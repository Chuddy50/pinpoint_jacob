"""
manufacturers.py

Last Edited: 1/21/2026
Developers: Leo Plute, Jacob Nguyen
Description: FastAPI endpoints for fetching manufacturer data, including
             list view with ratings and individual manufacturer profiles
             with pricing information.
"""

from fastapi import APIRouter, HTTPException
from config.database import supabase

router = APIRouter()

'''
Fetch all manufacturers with calculated average ratings
Retrieves manufacturer data and computes rating averages from review data

@return: List of manufacturer dictionaries with calculated rating field
'''
@router.get("/manufacturers")
async def list_manufacturers():
    """
    Fetch manufacturers with an average rating (if reviews exist).
    """
    try:

        #print("starting to grab manufacturers")

        manufacturers_response = supabase.table("manufacturers").select(
            "manufacturer_id,name,location,address,phone,email,contactee,description,average_rating"
        ).execute()
        manufacturers = manufacturers_response.data or []

        for m in manufacturers:
            m["rating"] = m.pop("average_rating", None)

        return manufacturers

    except Exception as e:
        print(f"Error grabbing manufacturers - {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch manufacturers: {e}")
    

'''
Fetch detailed profile for a specific manufacturer
Retrieves manufacturer info, calculated rating average, and price range data

@param manufacturer_id: Unique identifier for the manufacturer
@return: Dictionary with manufacturer details, rating, and price range; error message if not found
'''
@router.get("/manufacturers/{manufacturer_id}")
async def get_manufacturer(manufacturer_id: str):

    try:
        #get the data from the manufacturer table for the specified manufacturer
        manufacturer_response = supabase.table('manufacturers').select(
            'manufacturer_id, name, location, address, phone, email, contactee, description, average_rating'
            ).eq('manufacturer_id', manufacturer_id).execute()
        
        if not manufacturer_response.data:
            return {
                "success": False,
                "message": f"Supabase couldnt find a manufactuerer for ID: {manufacturer_id}. Error: {e}"
            }
        
        manufacturer = manufacturer_response.data[0]

        #get the reviews for that manfacturer
        reviews_response = supabase.table('reviews').select('rating').eq('manufacturer_id', manufacturer_id).execute()

        if reviews_response.data:
            ratings = [r['rating'] for r in reviews_response.data if r.get('rating')]
            manufacturer['rating'] = round(sum(ratings) / len(ratings), 1) if ratings else None
        else:
            manufacturer['rating'] = None

        #get the price range for that manufacturer
        manufacturer_price_response = supabase.table('manufacturer_prices').select('price_id').eq('manufacturer_id', manufacturer_id).execute()

        if manufacturer_price_response.data:

            price_range_ids = [item['price_id'] for item in manufacturer_price_response.data]

            price_range_response = supabase.table('prices').select('price_level').in_('price_id', price_range_ids).execute()

            if price_range_response.data:
                range_levels = [pr['price_level'] for pr in price_range_response.data]
                manufacturer['price_range'] = ", ".join(range_levels) if range_levels else None
            else:
                manufacturer['price_range'] = None
        else:
            manufacturer['price_range'] = None

        return manufacturer

    except Exception as e:
        return {
            "success": False,
            "message": f"Error grabbing manufacturer in API layer. Error: {str(e)}"
        }