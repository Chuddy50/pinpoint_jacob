"""
auth.py

Last Edited: 1/10/2026
Developers: Leo Plute
Description: User authentication endpoints including signup, login, logout,
             and profile picture updates. Handles Supabase Auth integration
             and file storage for profile pictures.
"""

from fastapi import APIRouter, UploadFile, File, Header, HTTPException
from config.database import supabase

router = APIRouter()
    
'''
Update a user's profile picture in storage and database
Validates file type and size, uploads to Supabase storage, and updates users table with new URL

@param user_id: The UUID of the user updating their profile picture
@param file: Image file to use as new profile picture (JPEG, PNG, or WebP)
@return: Dictionary with success status and new profile picture URL on success; error message on failure
'''
@router.post("/updatePFP")
async def userUpdateProfilePic(
    file: UploadFile = File(...),
    authorization: str = Header(...)
):
    
    #1 extract jwt
    try:
        token = authorization.replace("Bearer ", "")
    except:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    
    #2 verify jwt
    try:
        user_response = supabase.auth.get_user(token)
        user_id = user_response.user.id #extract user_id from VERIFIED token
    except:
        raise HTTPException(status_code=401, detail="Invalid token")

    allowed_types = ["image/jpeg", "image/png", "image/webp"]
    max_size = 5 * 1024 * 1024  # 5MB

    #3 Validate file type
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="File must be .jpeg, .png, or .webp")

    #4 Validate size
    fileBytes = await file.read()
    if len(fileBytes) > max_size:
        raise HTTPException(status_code=400, detail="File must be smaller than 5MB")

    #5 Get current pfp to check if we need to delete it
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

    #6 Make storage path
    extension = file.filename.split(".")[-1].lower()
    path = f"{user_id}.{extension}"

    #7 Upload to supabase storage (with upsert to overwrite)
    try:
        supabase.storage.from_("profile_pics").upload(
            path, 
            fileBytes, 
            {"content-type": file.content_type, "upsert": "true"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail="Inernal server error during supabase file storage")

    #8 Get the URL in the storage
    public_url = supabase.storage.from_("profile_pics").get_public_url(path)

    #9 Update the users table w/ new pfp url
    try:
        supabase.table("users").update({"profile_pic_url": public_url}).eq("user_id", user_id).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error during supabase db update")
    
    return {"success": True, "profile_pic_url": public_url}

    