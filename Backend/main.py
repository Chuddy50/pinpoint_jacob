from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import UploadFile, File
from supabase import create_client, Client
from dotenv import load_dotenv
import os

load_dotenv()
supabaseURL = os.getenv("SUPABASE_URL")
supabaseKey = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(supabaseURL, supabaseKey)

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
        #1 Create user in Supabase Auth table
        auth_result = supabase.auth.sign_up({
            "email": credentials['email'],
            "password": credentials['password']
        })

        user_id = auth_result.user.id

        #2 Insert into our custom users table
        supabase.table("users").insert({
            "user_id": user_id,
            "name": "",
            "profile_pic_url": "",
            "role": "",
            "preferences": {}
        }).execute()

        return {"success": True, "user_id": user_id}
    except Exception as e:
        return {"success": False, "error": str(e)}
    
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

    extension = file.filename.split(".")[-1].lower() #gets extension, like ong, jpeg, etc
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