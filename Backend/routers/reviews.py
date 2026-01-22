from fastapi import APIRouter
from config.database import supabase

router = APIRouter()

@router.post("/reviews")
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