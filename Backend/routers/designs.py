"""
designs.py

Last Edited: 1/21/2026
Developers: Leo Plute
Description: 3D design management endpoints. Handles saving and retrieving 
             user-created clothing designs with GLB file storage in Supabase.
"""

from fastapi import APIRouter, UploadFile, File, Form
from config.database import supabase
from datetime import datetime, timezone
from uuid import uuid4

router = APIRouter()

'''
Save a user's 3D clothing design to Supabase storage
Uploads GLB file to user-specific folder, stores metadata in database with material information

@param user_id: UUID of user saving the design
@param file: GLB file containing the 3D model data
@param name: User-provided name for the design
@param material: Material type selected for the design (cotton, denim, polyester, etc.)
@return: Dictionary with success status and design_id on success; error message on failure
'''
@router.post("/designs/save/{user_id}")
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
        print(f"Error in save_design: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }
    

'''
Retrieve all saved 3D designs for a specific user
Fetches design metadata including model URLs from database

@param user_id: UUID of user whose designs to retrieve
@return: Dictionary containing 'designs' list with all user's saved design records
'''
@router.get("/designs/saved_designs/{user_id}")
async def get_user_saved_designs(user_id: str):
    response = supabase.table('saved_designs').select('*').eq('user_id', user_id).execute()
    return {
        'designs': response.data
    }