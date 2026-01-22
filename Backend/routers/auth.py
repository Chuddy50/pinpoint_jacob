"""
auth.py

Last Edited: 1/10/2026
Developers: Leo Plute
Description: User authentication endpoints including signup, login, logout,
             and profile picture updates. Handles Supabase Auth integration
             and file storage for profile pictures.
"""

from fastapi import APIRouter, UploadFile, File
from config.database import supabase

router = APIRouter()

'''
Main PinPoint sign up endpoint

@param 'credentials': Dictionary containing the inputted email and password from react side
@returns: Dictionary with a 'success' field to show if the sign up worked,
    and the user_id, if it failed, sends the error message
'''
@router.post("/signup")
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
    

@router.post('/login')
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
@router.post("/updatePFP/{user_id}")
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

    

@router.post("/logout")
async def userLogout():
    try:
        result = supabase.auth.sign_out()
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}