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
@router.post("")
async def create_review(review : dict):
    try:
        insertResponse = supabase.table("reviews").insert({
            "manufacturer_id": review['manufacturer_id'],
            "user_id": review['user_id'],
            "rating": review['rating'],
            "review":  review['review'],
            #supabase automatically will make the created_at col bc of the
            #default value set to 'now()' during table creation
        }).execute()

        # Now update the average rating for this manufacturer
        print("Updating average rating for a manufacturer.")
        print("Wassup")

        # Get all ratings for manufacturer.
        ratingsResponse = (
            supabase
            .table("reviews")
            .select("rating")
            .eq("manufacturer_id", review['manufacturer_id'])
            .execute()
        )
        print("Got all ratings for manufacturer.")
        # Calculate average rating.
        ratings = [r["rating"] for r in ratingsResponse.data]
        avgRating = sum(ratings) / len(ratings)
        print("Calculated the average")

        # Save average rating in the database.
        avgRatingResponse = (
            supabase
            .table("manufacturers")
            .update({"average_rating": avgRating})
            .eq("manufacturer_id", review['manufacturer_id'])
            .execute()
        )

        print("Saved the average rating")

        return {
            "success": True,
            "message": "Review sucessfully added"
        }

    except Exception as e:
        return {
            "success": False,
            "message": f"Error submitting review in API layer. Error: {str(e)}"
        }
    

@router.get('/user/{user_id}')
async def get_users_reviews(user_id: str):
    try:
        # get all reviews by this user
        response = supabase.table('reviews').select('*').eq('user_id', user_id).execute()
        
        if not response.data:
            return {"success": True, "reviews": []}
        
        # parse reviews and fetch manufacturer names
        parsed_reviews = []
        for review in response.data:
            # get manufacturer name
            manufacturer_response = supabase.table('manufacturers').select('name').eq('manufacturer_id', review['manufacturer_id']).single().execute()
            
            manufacturer_name = manufacturer_response.data['name'] if manufacturer_response.data else 'Unknown Manufacturer'
            
            parsed_reviews.append({
                'id': review['review_id'],
                'manufacturer_name': manufacturer_name,
                'rating': review['rating'],
                'message': review['review'],
                'created_at': review['created_at']
            })
        
        return {"success": True, "reviews": parsed_reviews}
        
    except Exception as e:
        print(f"Error fetching user reviews: {e}")
        return {"success": False, "error": str(e)}
    

@router.get('/manufacturer/{manufacturer_id}')
async def get_manufacturers_reviews(manufacturer_id: str):
    try:
        # get all reviews for this manufacturer
        response = supabase.table('reviews').select('*').eq('manufacturer_id', manufacturer_id).execute()
        
        if not response.data:
            return {"success": True, "reviews": []}
        
        # parse reviews and fetch user names
        parsed_reviews = []
        for review in response.data:
            # get user name
            try:
                user_response = supabase.table('users').select('name').eq('user_id', review['user_id']).single().execute()
                user_name = user_response.data.get('name', '').strip() if user_response.data else ''
                # use "Jane Doe" if name is empty, None, or whitespace
                if not user_name or user_name == '':
                    #TODO: Change
                    user_name = "Jane Doe"
            except:
                #TODO: Change
                user_name = "Jane Doe"
            
            parsed_reviews.append({
                'id': review['review_id'],
                'user_name': user_name,
                'rating': review['rating'],
                'message': review['review'],
                'created_at': review['created_at']
            })
        
        return {"success": True, "reviews": parsed_reviews}
        
    except Exception as e:
        print(f"Error fetching manufacturer reviews: {e}")
        return {"success": False, "error": str(e)}