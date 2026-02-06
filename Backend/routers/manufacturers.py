"""
manufacturers.py

Last Edited: 1/28/2026
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
@router.get("")
async def list_manufacturers(
    location: str | None = None,
    moq: int | None = None,
    rating: float | None = None
):
    """
    Fetch manufacturers with an average rating (if reviews exist).
    """
    try:

        #print("starting to grab manufacturers")


        query = supabase.table("manufacturers").select(
            "manufacturer_id,name,location,address,phone,email,contactee,description,average_rating"
        )
        print("Abouta be at the filtering")
        
        # Add the optional filtering
        if location:
            print("Filtering location.")
            query = query.eq("location", location)

        if moq:
            print("Filtering moq.")
            moqResponse = supabase.table("manufacturer_minimums").select("manufacturer_id").eq("minimum_id", moq).execute()
            manuIdsList = [item["manufacturer_id"] for item in moqResponse.data or []]
            query = query.in_("manufacturer_id", manuIdsList)
            
        
        if rating:
            print("Filtering rating.")
            query = query.gte("average_rating", rating)
        

        manufacturers_response = query.execute()

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
@router.get("/{manufacturer_id}")
async def get_manufacturer(manufacturer_id: str):

    try:
        #get the data from the manufacturer table for the specified manufacturer
        manufacturer_response = supabase.table('manufacturers').select(
            'manufacturer_id, name, location, address, phone, email, contactee, description, average_rating'
            ).eq('manufacturer_id', manufacturer_id).execute()
        
        if not manufacturer_response.data:
            raise HTTPException(status_code=404, detail="Couldn't find manufacturer from id in database")
        
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
    
    except HTTPException:
        #if one of the HTTPExceptions raised in try block is hit, just raise it here
        raise

    except Exception as e:
        # this except block is for unexpected exceptions
        raise HTTPException(status_code=500, detail=f"Internal server error: {e}")

@router.get("/locations")
async def get_all_unique_manufacturer_locations():
    """
    Fetch all unique locations.
    Returns a list of string as locations.
    """
    try:
        response = supabase.table("manufacturers").select("location").execute()
        
        # Extract unique locations and filter out None/empty values
        locations = set()
        for item in response.data or []:
            location = item.get("location")
            if location:
                locations.add(location)
        
        # Return as sorted list
        return sorted(list(locations))
    except Exception as e:
        print(f"Error fetching locations - {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch locations: {e}")

# @router.get("/prices")
# async def get_prices():
#     """
#     Fetch all price levels.
#     Returns a list of strings as price levels.
#     """
#     try:
#         response = supabase.table("prices").select("price_level").execute()

#         priceLevels = [item["price_level"] for item in response.data or [] if item.get("price_level")]

#         return priceLevels
#     except Exception as e:
#         print(f"Error fetching price levels - {str(e)}")
#         raise HTTPException(status_code=500, detail=f"Failed to fetch price levels: {e}")


# @router.get("/product-categories")
# async def get_product_categories():
#     """
#     Fetch all product categories.
#     Returns a list of strings as product categories.
#     """
#     try:
#         response = supabase.table("product_categories").select("category_name").execute()
#         productCategories = [item["category_name"] for item in response.data or [] if item.get("category_name")]
#         return productCategories
#     except Exception as e:
#         print(f"Error fetching product categories - {str(e)}")
#         raise HTTPException(status_code=500, detail=f"Failed to fetch price levels: {e}")


@router.get("/minimums")
async def get_minimums():
    """
    Fetch all minimum order quantities.
    Returns a list of minimum objects with minimum_id and minimum_range.
    """
    try:
        response = supabase.table('minimums').select('minimum_id, minimum_range').execute()
        return response.data or []
    except Exception as e:
        print(f"Error fetching minimums - {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch minimums: {e}")
    

@router.get("/{manufacturer_id}/categories")
async def get_manufacturer_categories(manufacturer_id: str):
    junction = supabase.table('manufacturer_categories').select('category_id').eq('manufacturer_id', manufacturer_id).execute()
    if not junction.data:
        return {"success": True, "categories": []}
    
    category_ids = [item['category_id'] for item in junction.data]
    categories = supabase.table('categories').select('*').in_('category_id', category_ids).execute()
    return {"success": True, "categories": categories.data}


@router.get("/{manufacturer_id}/services")
async def get_manufacturer_services(manufacturer_id: str):
    junction = supabase.table('manufacturer_services').select('service_id').eq('manufacturer_id', manufacturer_id).execute()
    if not junction.data:
        return {"success": True, "services": []}
    
    service_ids = [item['service_id'] for item in junction.data]
    services = supabase.table('services').select('*').in_('service_id', service_ids).execute()
    return {"success": True, "services": services.data}


@router.get("/{manufacturer_id}/minimums")
async def get_manufacturer_minimums(manufacturer_id: str):
    junction = supabase.table('manufacturer_minimums').select('minimum_id').eq('manufacturer_id', manufacturer_id).execute()
    if not junction.data:
        return {"success": True, "minimums": []}
    
    minimum_ids = [item['minimum_id'] for item in junction.data]
    minimums = supabase.table('minimums').select('*').in_('minimum_id', minimum_ids).execute()
    return {"success": True, "minimums": minimums.data}


@router.get("/{manufacturer_id}/products")
async def get_manufacturer_products(manufacturer_id: str):
    '''
    structure:
    [
        { "category_name": "category1", "products": [{"id": 1, "name": "product1"}, ...] },
        { "category_name": "category2", "products": [{"id": 2, "name": "product2"}, ...] },
        ...
    ]
    '''

    # get all product_type_ids for this manufacturer
    junction_response = supabase.table('manufacturer_products') \
        .select('product_type_id') \
        .eq('manufacturer_id', manufacturer_id) \
        .execute()

    if not junction_response.data:
        raise HTTPException(status_code=404, detail="No products found for given manufacturer")

    product_type_ids = [item['product_type_id'] for item in junction_response.data]

    # get product details with category IDs
    products_response = supabase.table('product_types') \
        .select('product_type_id, product_type_name, product_category_id') \
        .in_('product_type_id', product_type_ids) \
        .execute()

    # get all unique category IDs
    category_ids = list(set([p['product_category_id'] for p in products_response.data]))

    # get category names
    categories_response = supabase.table('product_categories') \
        .select('product_category_id, category_name') \
        .in_('product_category_id', category_ids) \
        .execute()

    # create category map
    category_map = {cat['product_category_id']: cat['category_name'] for cat in categories_response.data}

    # group products by category
    products_by_category = {}
    for product in products_response.data:
        cat_id = product['product_category_id']
        if cat_id not in products_by_category:
            products_by_category[cat_id] = {
                'category_name': category_map.get(cat_id, 'Unknown'),
                'products': []
            }
        products_by_category[cat_id]['products'].append({
            'product_type_id': product['product_type_id'],
            'product_type_name': product['product_type_name']
        })

    return {
        "success": True,
        "products": list(products_by_category.values())
    }
