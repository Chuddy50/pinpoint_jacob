"""
reviews.py

Last Edited: 1/12/2026
Developers: Luke Jones
Description: Manufacturer reviews endpoints. Allows users to submit ratings
             and written reviews for manufacturers
"""

from fastapi import APIRouter
from config.database import supabase

router = APIRouter()

'''
Submit a new review and rating for a manufacturer
Creates review record in database with rating (1-5 stars) and written feedback

@param review: Dictionary containing manufacturer_id, user_id, rating (int 1-5), and review text
@return: Dictionary with success status and message
'''
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