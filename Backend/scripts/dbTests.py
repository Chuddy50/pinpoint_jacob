"""
dbTests.py

Last Edited: 1/13/2026
Developers: Leo Plute
Description: Simple test queries used to ensure the dataToDB.py
             script was working as expected before it was ran 
             on 350+ manufacturers.
"""

import os
from dotenv import load_dotenv
from supabase import create_client, Client

# setup supabase client
load_dotenv()
supabaseURL = os.getenv("SUPABASE_URL")
supabaseKey = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(supabaseURL, supabaseKey)



def simpleTestQueryOne():
    print("-"*60)
    print("Simple Query Test:")
    
    print("5001:\n - expecting: prod mins = 1-10 Proto & Samples, 10-50 Prod")
    print("Actually:")

    company = supabase.table('manufacturers').select('manufacturer_id, name').eq('name', '5001 FLAVORS').execute()

    if not company.data:
        print("5001 Flavors not found")
        return
    
    manufacturerId = company.data[0]['manufacturer_id']
    print(f"5001 Flavors found (ID: {manufacturerId})")

    minimumsIDs = supabase.table('manufacturer_minimums').select('minimum_id').eq('manufacturer_id', manufacturerId).execute()
    print(f"Found {len(minimumsIDs.data)} product minimum IDs")
    print(f"Product Minimums:")

    for id in minimumsIDs.data:
        minimum_id = id['minimum_id']
        minimum = supabase.table('minimums').select('minimum_range').eq('minimum_id', minimum_id).execute()
        if minimum.data:
            print(f" - {minimum.data[0]['minimum_range']}")

    print("-"*60)

def simpleTestQueryTwo():

    print("-"*60)
    print("Simple Query Test:")
    print("Accurate Categories")
    print("Categories expected: Childrens, Mens, Women")
    print("Product expected: None")

    company = supabase.table('manufacturers').select('manufacturer_id, name').eq('name', 'Accurate Patterns').execute()

    if not company.data:
        print("Accurate Patterns not found")
        return

    manufacturerId = company.data[0]['manufacturer_id']
    print(f"Accurate Patterns found (ID: {manufacturerId})")

    categoryIDs = supabase.table('manufacturer_categories').select('category_id').eq('manufacturer_id', manufacturerId).execute()
    print(f"Found {len(categoryIDs.data)} category IDs")
    print(f"Categories:")

    for id in categoryIDs.data:
        category_id = id['category_id']
        category = supabase.table('categories').select('category_name').eq('category_id', category_id).execute()
        if category.data:
            print(f" - {category.data[0]['category_name']}")


    productIDs = supabase.table('manufacturer_products').select('product_type_id').eq('manufacturer_id', manufacturerId).execute()
    print(f"\nFound {len(productIDs.data)} product IDs")

    if len(productIDs.data) > 0:
        print(f"Products: ")

        for id in productIDs.data:
            product_id = id['product_type_id']
            product = supabase.table('product_types').select('product_type_name').eq('product_type_id', product_id).execute()
            if product.data:
                print(f" - {product.data[0]['category_name']}")

    print("-"*60)


def simpleTestQueryThree():

    print("-"*60)
    print("Simple Query Test:")
    print("Absolute Quality Patterns")
    print("Prices expected: Better, Bridge, Contemporary, Couture, Designer, Moderate")

    company = supabase.table('manufacturers').select('manufacturer_id, name').eq('name', 'ABSOLUTE QUALITY PATTERNS').execute()

    if not company.data:
        print("Absolute Quality Patterns not found")
        return

    manufacturerId = company.data[0]['manufacturer_id']
    print(f"Absolute Quality Patterns found (ID: {manufacturerId})")

    priceIDs = supabase.table('manufacturer_prices').select('price_id').eq('manufacturer_id', manufacturerId).execute()
    print(f"Found {len(priceIDs.data)} price IDs")
    print(f"Prices:")

    for id in priceIDs.data:
        price_id = id['price_id']
        price = supabase.table('prices').select('price_level').eq('price_id', price_id).execute()
        if price.data:
            print(f" - {price.data[0]['price_level']}")

    print("-"*60)


def harderQuery():

    print("-"*60)
    print("Harder Query")
    print("Reconstruct A.V. inc from the database")

    manufacturer = supabase.table('manufacturers').select('*').eq('name', 'A V inc.').execute()
    if not manufacturer:
        print("A V inc. not found")
        return 
    
    mfg = manufacturer.data[0]
    manufacturerId = mfg['manufacturer_id']

    print(f"Found A V inc.")
    print(f" - ID: {manufacturerId}")
    print(f" - Location: {mfg['location']}")
    print(f" - Email: {mfg['email']}")

    print("Services:")
    service_link = supabase.table('manufacturer_services').select('service_id').eq('manufacturer_id', manufacturerId).execute()
    services = []
    for link in service_link.data:
        service = supabase.table('services').select('service_name').eq('service_id', link['service_id']).execute()
        services.append(service.data[0]['service_name'])
    print(f"Found {len(services)} services (Expected 17)")
    
    print("Categories:")
    category_link = supabase.table('manufacturer_categories').select('category_id').eq('manufacturer_id', manufacturerId).execute()
    categories  = []
    for link in category_link.data:
        category = supabase.table('categories').select('category_name').eq('category_id', link['category_id']).execute()
        categories.append(category.data[0]['category_name'])
    print(f"Found {len(categories)} categories (Expected 5)")

    print("Prices:")
    price_link = supabase.table('manufacturer_prices').select('price_id').eq('manufacturer_id', manufacturerId).execute()
    prices  = []
    for link in price_link.data:
        price = supabase.table('prices').select('price_level').eq('price_id', link['price_id']).execute()
        prices.append(price.data[0]['price_level'])
    print(f"Found {len(prices)} prices (Expected 5)")

    print("Product Minimums:")
    mins_link = supabase.table('manufacturer_minimums').select('minimum_id').eq('manufacturer_id', manufacturerId).execute()
    mins  = []
    for link in mins_link.data:
        min = supabase.table('minimums').select('minimum_range').eq('minimum_id', link['minimum_id']).execute()
        mins.append(min.data[0]['minimum_range'])
    print(f"Found {len(mins)} product minimums (Expected 5)")


    print("Products:")
    product_links = supabase.table('manufacturer_products').select('product_type_id').eq('manufacturer_id', manufacturerId).execute()
    products_by_category = {}
    for link in product_links.data:
        product_type = supabase.table('product_types').select('product_type_name, product_category_id').eq('product_type_id', link['product_type_id']).execute()
        
        if product_type.data:
            type_name = product_type.data[0]['product_type_name']
            category_id = product_type.data[0]['product_category_id']
            
            category = supabase.table('product_categories').select('category_name').eq('product_category_id', category_id).execute()
            category_name = category.data[0]['category_name']
            
            if category_name not in products_by_category:
                products_by_category[category_name] = []
            products_by_category[category_name].append(type_name)
    
    print(f"Total product types: {len(product_links.data)}")
    print(f"Product categories: {len(products_by_category)}")
    print(f"Full Product Catelog:")
    for category, products in products_by_category.items():
        print(f" - {category}: {products}")



def main():
    #simpleTestQueryOne()
    #simpleTestQueryTwo()
    #simpleTestQueryThree()
    harderQuery()
    return

if __name__ == "__main__":
    main()