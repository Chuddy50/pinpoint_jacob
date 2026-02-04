"""
designs.py

Last Edited: 1/21/2026
Developers: Leo Plute
Description: 3D design management endpoints. Handles saving and retrieving 
             user-created clothing designs with GLB file storage in Supabase.
"""

from fastapi import APIRouter, UploadFile, File, Form, Header, HTTPException
from config.database import supabase
from datetime import datetime, timezone
from uuid import uuid4

router = APIRouter()

'''
Save a user's 3D clothing design to Supabase storage
Uploads GLB file to user-specific folder, stores metadata in database with material information

@param file: GLB file containing the 3D model data
@param name: User-provided name for the design
@param material: Material type selected for the design (cotton, denim, polyester, etc.)
@param authorization: Header that contains JWT to extract the user_id
@return: Dictionary with success status and design_id on success; error message on failure
'''
@router.post("/save")
async def save_design(
    file: UploadFile = File(...),
    name: str = Form(...),
    material: str = Form(...),
    authorization: str = Header(...)
):
    
    #1 extract jwt
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing authorization header")

    token = authorization.replace("Bearer ", "")
    
    #2 verify jwt
    try:
        user_response = supabase.auth.get_user(token)
        user_id = user_response.user.id #extract user_id from VERIFIED token
    except:
        raise HTTPException(status_code=401, detail="Invalid token")


    try:
        # generate a random design id here, rather than auto incremening
        # - so we can use it in the file_path
        design_id = str(uuid4())

        # user specific folder path
        file_path = f"{user_id}/{design_id}.glb"
        file_content = await file.read()

        # upload .glb file to supabase storage 3d-models bucket
        supabase.storage.from_("3d-models").upload(
            file_path,
            file_content,
            {"content-type": "model/gltf-binary"}
        )

        # get the url for the filepath
        public_url = supabase.storage.from_("3d-models").get_public_url(file_path)

        # cleaning up URL formatting issues
        # - what gets returned has double slashes and a trailing query parameter,
        #   which dont allow for the GLTFLoader in ModelEditor.jsx load_model function
        #   to load the file at that path
        if isinstance(public_url, str):
            # remove double slashes and trailing query params
            public_url = public_url.replace('//storage', '/storage').rstrip('?')
        else:
            # handle if it's an object
            public_url = str(public_url).replace('//storage', '/storage').rstrip('?')


        # insert metadata to db
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
        print(f"Error in save_design: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to save design"
        )
    

'''
Retrieve all saved 3D designs for a specific user
Fetches design metadata including model URLs from database

@param user_id: UUID of user whose designs to retrieve
@return: Dictionary containing 'designs' list with all user's saved design records
'''
@router.get("/saved_designs")
async def get_user_saved_designs(authorization: str = Header(...)):

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


    response = supabase.table('saved_designs').select('*').eq('user_id', user_id).execute()
    return {
        'designs': response.data
    }


@router.delete("/delete/{design_id}")
async def delete_saved_design(
    design_id: str,
    authorization: str = Header(...)
):
    
    #1 extract jwt
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing authorization header")

    token = authorization.replace("Bearer ", "")

    #2 verify jwt
    try:
        user_response = supabase.auth.get_user(token)
        user_id = user_response.user.id #extract user_id from VERIFIED token
    except:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    #make sure design exists and belongs to signed in user
    design = supabase.table('saved_designs').select('user_id').eq('design_id', design_id).execute()
    
    if not design.data:
        raise HTTPException(
            status_code=404,
            detail="Design does not exist"
        )
    
    if design.data[0]['user_id'] != user_id:
        raise HTTPException(
            status_code=403,
            details="Design does not belong to user"
        )

    
    #remove from database
    dbResponse = supabase.table('saved_designs').delete().eq('design_id', design_id).execute()
    
    if not dbResponse.data:
        raise HTTPException(
            status_code=500,
            detail="Error removing design from database"
        )

    #remove from file bucket
    try:
        supabase.storage.from_("3d-models").remove([f"{user_id}/{design_id}.glb"])  
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="Error removing design from file storage"
        )

    return {
        "success": True,
        "message": "3D Model sucessfully removed from file storage and database"
    }