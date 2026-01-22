from fastapi import APIRouter, UploadFile, File, Form
from config.database import supabase
from datetime import datetime, timezone
from uuid import uuid4

router = APIRouter()

'''
    Save a users 3d clothing design to supabase storage
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
    Retrieve all saved designs for a specific user
    Returns a list of designs with 'model_url' pointing to supabase storage
'''
@router.get("/designs/saved_designs/{user_id}")
async def get_user_saved_designs(user_id: str):
    response = supabase.table('saved_designs').select('*').eq('user_id', user_id).execute()
    return {
        'designs': response.data
    }