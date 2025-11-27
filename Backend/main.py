from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi import UploadFile, File
from supabase import create_client, Client
from dotenv import load_dotenv
from groq import Groq
import os

load_dotenv()
supabaseURL = os.getenv("SUPABASE_URL")
supabaseKey = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(supabaseURL, supabaseKey)
groq_api_key = os.getenv("GROQ_API_KEY")
groq_client = Groq(api_key=groq_api_key) if groq_api_key else None
consultant_prompt = os.getenv(
    "CONSULTANT_SYSTEM_PROMPT",
    "You are PinPoint's consulting assistant. Be concise and actionable.",
)
groq_model = os.getenv("GROQ_MODEL", "mixtral-8x7b-32768")

app = FastAPI()

# Add CORS middleware 
# *Allows frontend server to send requests to this, normally same origin policy on
#    browser would block this, this allows us to bypass that
# *Will eventually need to add real site URL here once we deploy the site
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Starting auth stuff here

'''
Main PinPoint sign up endpoint

@param 'credentials': Dictionary containing the inputted email and password from react side
@returns: Dictionary with a 'success' field to show if the sign up worked,
    and the user_id, if it failed, sends the error message
'''
@app.post("/pinpoint/signup")
async def userSignup(credentials: dict):
    try:

        print("started sign up fun")

        #1 Create user in Supabase Auth table
        auth_result = supabase.auth.sign_up({
            "email": credentials['email'],
            "password": credentials['password']
        })

        user_id = auth_result.user.id

        print("added to supbase auth, now adding to our 'users' table")

        # URL to the basic pfp stored in supabase file storage bucket
        default_pfp = 'https://nsxnjccttoutxxagdlai.supabase.co/storage/v1/object/public/profile_pics/basicPfp.jpg'

        #2 Insert into our custom users table, assigned basic pfp on sign up
        supabase.table("users").insert({
            "user_id": user_id,
            "name": "",
            "profile_pic_url": default_pfp,
            "role": "",
            "preferences": {}
        }).execute()

        print("executed query")

        return {"success": True, 
                "user_id": user_id, 
                "pfp_url": default_pfp, 
                'email': credentials['email']}
    except Exception as e:
        return {"success": False, "error": str(e)}
    

@app.post('/pinpoint/login')
async def userLogin(credentials : dict):
    try:
        print("startng a login attempt")

        # Log the user in with inputted email + pw
        login_result = supabase.auth.sign_in_with_password({
            "email" : credentials['email'],
            "password": credentials['password']
        })

        user_id = login_result.user.id

        #Grab their saved pfp
        result = supabase.table("users").select("profile_pic_url").eq("user_id", user_id).execute()
        saved_pfp_url = result.data[0]['profile_pic_url']

        # If here, login successful
        return {
            "success": True,
            "user_id": user_id,
            "pfp_url": saved_pfp_url,
            "email": credentials['email']
        }

    except Exception as e:
        return {"success": False, "error": "Login error: " + str(e)}
    
'''
fastAPI endpoint to allow a signed in user to update their profile pic
This puts the new profile picture into the storage, creates a url w/ their unique
user ID, and then updates OUR users table to have the correct url in that column

@param 'user_id' : The user_id of the person trying to upload a new pfp
@param 'file' : The file the user is trying to make their new pfp
   - Syntax: expect a required uploaded file, UploadFile gives us access to filename, type, and stream access
'''
@app.post("/pinpoint/updatePFP/{user_id}")
async def userUpdateProfilePic(user_id: str, file: UploadFile = File(...)):

    allowed_types = ["image/jpeg", "image/png", "image/webp"]
    max_size = 5 * 1024 * 1024 * 1024 #5gb

    #1 Validate file type
    if file.content_type not in allowed_types:
        return {"success": False, "error": "File type not allowed"}

    #2 Validate size
    fileBytes = await file.read()
    if len(fileBytes) > max_size:
        return {"success": False, "error": "File too large"}

    #3 Make storage path

    extension = file.filename.split(".")[-1].lower() #gets extension, like png, jpeg, etc
    path = f"profile_pics/{user_id}.{extension}"

    #4 Upload to supabase storage
    try:
        supabase.storage.from_("profile_pics").upload(path, fileBytes, {"content-type": file.content_type})
    except Exception as e:
        return {"success": False, "error": "Failed to upload to storage: " + str(e)}

    #5 Get the URL in the storage
    public_url = supabase.storage.from_("profile_pics").get_public_url(path).public_url

    #6 Update the users table w/ new pfp url
    try:
        supabase.table("users").update({"profile_pic_url": public_url}).eq("user_id", user_id).execute()
    except Exception as e:
        return {"success": False, "error": "Failed to update users pfp url: " + str(e)}
    
    # If here, everything updated correctly, let front end know
    return {"success": True, "profile_pic_url": public_url}

    

@app.post("/pinpoint/logout")
async def userLogout():
    try:
        result = supabase.auth.sign_out()
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.post("/pinpoint/chat")
async def consultant_chat(payload: dict):
    """
    Lightweight chat relay to Groq; accepts message history and optional system prompt.
    """

    # makes sure groq client is configured
    if groq_client is None:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured")

    # pul the messages and system prompt from the payload
    messages = payload.get("messages") or []
    system_prompt = payload.get("system_prompt") or consultant_prompt

    if not isinstance(messages, list):
        raise HTTPException(status_code=400, detail="messages must be a list")

    # normalize message format into to Groq format
    groq_messages = [{"role": "system", "content": system_prompt}]
    for message in messages:
        role = message.get("role")
        content = message.get("content") or message.get("text")
        # if in wrong format skip 
        if not role or not content:
            continue
        groq_messages.append(
            {
                "role": role if role in {"user", "assistant"} else "user",
                "content": content,
            }
        )

    # call groq chat completion endpoint
    try:
        completion = groq_client.chat.completions.create(
            model=groq_model,
            messages=groq_messages,
            max_tokens=256,
            temperature=0.4,
        )
        # extract the reply from the completion 
        reply = completion.choices[0].message.content
        # return the completion reply
        return {"reply": reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Groq error: {e}")
