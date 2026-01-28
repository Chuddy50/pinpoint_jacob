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
async def list_manufacturers():
    """
    Fetch manufacturers with an average rating (if reviews exist).
    """
    try:

        #print("starting to grab manufacturers")

        manufacturers_response = supabase.table("manufacturers").select(
            "manufacturer_id,name,location,address,phone,email,contactee,description"
        ).execute()
        manufacturers = manufacturers_response.data or []

        reviews_response = supabase.table("reviews").select("manufacturer_id,rating").execute()
        rating_map = {}
        for review in reviews_response.data or []:
            manufacturer_id = review.get("manufacturer_id")
            rating = review.get("rating")
            if manufacturer_id is None or rating is None:
                continue
            bucket = rating_map.setdefault(manufacturer_id, {"sum": 0.0, "count": 0})
            bucket["sum"] += float(rating)
            bucket["count"] += 1

        for manufacturer in manufacturers:
            stats = rating_map.get(manufacturer.get("manufacturer_id"))
            if stats and stats["count"]:
                manufacturer["rating"] = round(stats["sum"] / stats["count"], 1)
            else:
                manufacturer["rating"] = None

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
            'manufacturer_id, name, location, address, phone, email, contactee, description'
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
    

router.get("/{manufacturer_id}/categories")
async def get_manufacturer_categories(manufacturer_id: str):

    categories =[]

    # query into junction table first
    junctionResponse = supabase.table('manufacturer_categories').select('category_id').eq('manufacturer_id', manufacturer_id).execute()

    if not junctionResponse.data:
        return {
            "success": False,
            "message": f"No categories found for the manufacturer with id: {manufacturer_id}"
        }

    # query into categories table w/ all the categories the manfuacturer does
    for category_id in junctionResponse.data:
        categoryResponse = supabase.table('categories').select('category_name').eq('category_id', category_id).execute()

        if not categoryResponse.data:
            return {
                "success": False,
                "message": f"No category name found for category_id: {category_id}"
            }

        categories.append(categoryResponse.data['category_name'])

    return {
        "success": True,
        "categories": categories
    }

router.get("/{manufacturer_id}/minimums")
async def get_manufacturer_minimums(manufacturer_id: str):

    minimums =[]

    # query into junction table first
    junctionResponse = supabase.table('manufacturer_minimums').select('minimum_id').eq('manufacturer_id', manufacturer_id).execute()

    if not junctionResponse.data:
        return {
            "success": False,
            "message": f"No minimums found for the manufacturer with id: {manufacturer_id}"
        }

    # query into minimums table w/ all the minimums the manfuacturer supports
    for minimum_id in junctionResponse.data:
        minimumResponse = supabase.table('minimums').select('minimum_range').eq('minimum_id', minimum_id).execute()

        if not minimumResponse.data:
            return {
                "success": False,
                "message": f"No category name found for category_id: {minimum_id}"
            }

        minimums.append(minimumResponse.data['minimun_range'])

    return {
        "success": True,
        "minimums": minimums
    }


router.get("/{manufacturer_id}/services")
async def get_manufacturer_services(manufacturer_id: str):

    services =[]

    # query into junction table first
    junctionResponse = supabase.table('manufacturer_services').select('service_id').eq('manufacturer_id', manufacturer_id).execute()

    if not junctionResponse.data:
        return {
            "success": False,
            "message": f"No services found for the manufacturer with id: {manufacturer_id}"
        }

    # query into services table w/ all the services the manfuacturer supports
    for service_id in junctionResponse.data:
        serviceResponse = supabase.table('services').select('service_name').eq('service_id', service_id).execute()

        if not serviceResponse.data:
            return {
                "success": False,
                "message": f"No category name found for category_id: {service_id}"
            }

        services.append(serviceResponse.data['service_name'])

    return {
        "success": True,
        "services": services
    }


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
        return {
            "success": False,
            "message": f"No products found for manufacturer with id: {manufacturer_id}"
        }

    product_type_ids = [item['product_type_id'] for item in junction_response.data]

    # get product details with category IDs
    products_response = supabase.table('product_type') \
        .select('product_type_id, product_type_name, product_category_id') \
        .in_('product_type_id', product_type_ids) \
        .execute()

    # get all unique category IDs
    category_ids = list(set([p['product_category_id'] for p in products_response.data]))

    # get category names
    categories_response = supabase.table('product_categories') \
        .select('category_id, category_name') \
        .in_('category_id', category_ids) \
        .execute()

    # create category map
    category_map = {cat['category_id']: cat['category_name'] for cat in categories_response.data}

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