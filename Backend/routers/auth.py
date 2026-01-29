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
Create a new user account in PinPoint system
Creates user in Supabase Auth, then adds user record to custom users table with default profile picture

@param credentials: Dictionary containing user's email and password
@return: Dictionary with success status, user_id, profile picture URL, and email on success; error message on failure
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
    

'''
Authenticate existing user and retrieve their profile data
Validates credentials against Supabase Auth and fetches user's saved profile picture

@param credentials: Dictionary containing user's email and password
@return: Dictionary with success status, user_id, profile picture URL, and email on success; error message on failure
'''
@router.post('/login')
async def userLogin(credentials: dict):
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
Update a user's profile picture in storage and database
Validates file type and size, uploads to Supabase storage, and updates users table with new URL

@param user_id: The UUID of the user updating their profile picture
@param file: Image file to use as new profile picture (JPEG, PNG, or WebP)
@return: Dictionary with success status and new profile picture URL on success; error message on failure
'''
@router.post("/updatePFP/{user_id}")
async def userUpdateProfilePic(user_id: str, file: UploadFile = File(...)):

    allowed_types = ["image/jpeg", "image/png", "image/webp"]
    max_size = 5 * 1024 * 1024  # 5MB

    #1 Validate file type
    if file.content_type not in allowed_types:
        return {"success": False, "error": "File type not allowed"}

    #2 Validate size
    fileBytes = await file.read()
    if len(fileBytes) > max_size:
        return {"success": False, "error": "File too large"}

    #3 Get current pfp to check if we need to delete it
    try:
        result = supabase.table("users").select("profile_pic_url").eq("user_id", user_id).execute()
        current_pfp_url = result.data[0]['profile_pic_url']
        
        # Check if current pfp is NOT the basic default one
        if "basicPfp.jpg" not in current_pfp_url:
            # Extract the file path from the URL (everything after 'profile_pics/')
            # URL format: https://...supabase.co/storage/v1/object/public/profile_pics/USER_ID.EXT
            old_filename = current_pfp_url.split('profile_pics/')[-1].split('?')[0]  # Remove query params
            
            # Delete the old pfp from storage
            try:
                supabase.storage.from_("profile_pics").remove([old_filename])
            except Exception as e:
                print(f"Warning: Could not delete old pfp: {e}")
                # Continue anyway - not critical if old file isn't deleted
                
    except Exception as e:
        print(f"Warning: Could not fetch current pfp: {e}")
        # Continue anyway - upload will still work

    #4 Make storage path
    extension = file.filename.split(".")[-1].lower()
    path = f"{user_id}.{extension}"

    #5 Upload to supabase storage (with upsert to overwrite)
    try:
        supabase.storage.from_("profile_pics").upload(
            path, 
            fileBytes, 
            {"content-type": file.content_type, "upsert": "true"}
        )
    except Exception as e:
        return {"success": False, "error": "Failed to upload to storage: " + str(e)}

    #6 Get the URL in the storage
    public_url = supabase.storage.from_("profile_pics").get_public_url(path)

    #7 Update the users table w/ new pfp url
    try:
        supabase.table("users").update({"profile_pic_url": public_url}).eq("user_id", user_id).execute()
    except Exception as e:
        return {"success": False, "error": "Failed to update users pfp url: " + str(e)}
    
    return {"success": True, "profile_pic_url": public_url}

    

@router.post("/logout")
async def userLogout():
    try:
        result = supabase.auth.sign_out()
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}