from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi import UploadFile, File
from supabase import create_client, Client
from dotenv import load_dotenv
from groq import Groq
import os
from datetime import datetime, timezone
from uuid import uuid4
import json

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

        
        supabase.auth.sign_out()

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

        supabase.auth.sign_out()

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


@app.post("/reviews")
async def create_review(review : dict):
    try:
        response = supabase.table("reviews").insert({
            "manufacturer_id": review['manufacturer_id'],
            "user_id": review['user_id'],
            "rating": review['rating'],
            "review":  review['review'],
            #supabase automatically will make the created_at col bc of the
            #default value set to 'now()' during table creation
        }).execute()

        return {
            "success": True,
            "message": "Review sucessfully added"
        }

    except Exception as e:
        return {
            "success": False,
            "message": f"Error submitting review in API layer. Error: {e}"
        }


@app.get("/manufacturers")
async def list_manufacturers():
    """
    Fetch manufacturers with an average rating (if reviews exist).
    """
    try:

        #print("starting to grab manufacturers")

        manufacturers_response = supabase.table("manufacturers").select(
            "manufacturer_id,name,location,address,phone,email,contactee,description"
        ).execute()
        manufacturers = manufacturers_response.data or []

        reviews_response = supabase.table("reviews").select("manufacturer_id,rating").execute()
        rating_map = {}
        for review in reviews_response.data or []:
            manufacturer_id = review.get("manufacturer_id")
            rating = review.get("rating")
            if manufacturer_id is None or rating is None:
                continue
            bucket = rating_map.setdefault(manufacturer_id, {"sum": 0.0, "count": 0})
            bucket["sum"] += float(rating)
            bucket["count"] += 1

        for manufacturer in manufacturers:
            stats = rating_map.get(manufacturer.get("manufacturer_id"))
            if stats and stats["count"]:
                manufacturer["rating"] = round(stats["sum"] / stats["count"], 1)
            else:
                manufacturer["rating"] = None

        return manufacturers

    except Exception as e:
        print(f"Error grabbing manufacturers - {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch manufacturers: {e}")
    

@app.get("/manufacturers/{manufacturer_id}")
async def get_manufacturer(manufacturer_id: str):

    try:
        #get the data from the manufacturer table for the specified manufacturer
        manufacturer_response = supabase.table('manufacturers').select(
            'manufacturer_id, name, location, address, phone, email, contactee, description'
            ).eq('manufacturer_id', manufacturer_id).execute()
        
        if not manufacturer_response.data:
            return {
                "success": False,
                "message": f"Supabase couldnt find a manufactuerer for ID: {manufacturer_id}. Error: {e}"
            }
        
        manufacturer = manufacturer_response.data[0]

        #get the reviews for that manfacturer
        reviews_response = supabase.table('reviews').select('rating').eq('manufacturer_id', manufacturer_id).execute()

        if reviews_response.data:
            ratings = [r['rating'] for r in reviews_response.data if r.get('rating')]
            manufacturer['rating'] = round(sum(ratings) / len(ratings), 1) if ratings else None
        else:
            manufacturer['rating'] = None

        #get the price range for that manufacturer
        manufacturer_price_response = supabase.table('manufacturer_prices').select('price_id').eq('manufacturer_id', manufacturer_id).execute()

        if manufacturer_price_response.data:

            price_range_ids = [item['price_id'] for item in manufacturer_price_response.data]

            price_range_response = supabase.table('prices').select('price_level').in_('price_id', price_range_ids).execute()

            if price_range_response.data:
                range_levels = [pr['price_level'] for pr in price_range_response.data]
                manufacturer['price_range'] = ", ".join(range_levels) if range_levels else None
            else:
                manufacturer['price_range'] = None
        else:
            manufacturer['price_range'] = None

        return manufacturer

    except Exception as e:
        return {
            "success": False,
            "message": f"Error grabbing manufacturer in API layer. Error: {str(e)}"
        }
    

@app.post("/designs/save/{user_id}")
async def save_design(
    user_id: str,
    file: UploadFile = File(...),
    name: str = Form(...),
    material: str = Form(...)
):
    try:
        # generate a random design id here, rather than auto incremening
        # - so we can use it in the file_path
        design_id = str(uuid4())

        file_path = f"{user_id}/{design_id}.glb"
        file_content = await file.read()

        supabase.storage.from_("3d-models").upload(
            file_path,
            file_content,
            {"content-type": "model/gltf-binary"}
        )

        public_url = supabase.storage.from_("3d-models").get_public_url(file_path)

        supabase.table('saved_designs').insert({
            'design_id': design_id,
            'user_id': user_id,
            'name': name,
            'model_url': public_url,
            'material_used': material,
            'created_at': datetime.now(timezone.utc).isoformat()
        }).execute()


        #print(f"DB response data: {dbResponse.data}")

        return {
            'success': True, 
            'design_id': design_id
        }


    except Exception as e:
        print(f"Error in save_design: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }
    

@app.get("/designs/saved_designs/{user_id}")
async def get_user_saved_designs(user_id: str):
    response = supabase.table('saved_designs').select('*').eq('user_id', user_id).execute()

    '''
    for design in response.data:
        print(f"model_url type: {type(design['model_url'])}")
        print(f"model_url value: {design['model_url']}")
    '''


    return {
        'designs': response.data
    }