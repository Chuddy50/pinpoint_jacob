import json
import os
from dotenv import load_dotenv
from supabase import create_client, Client

import logging

# configure logging
logging.basicConfig(
    filename='process_log.txt',  # log file name
    filemode='w',                # 'w' = overwrite each run, 'a' = append
    format='%(asctime)s - %(levelname)s - %(message)s',
    level=logging.INFO           # log levels: DEBUG, INFO, WARNING, ERROR, CRITICAL
)


#make supabase client so we can add to the db 
load_dotenv()
supabaseURL = os.getenv("SUPABASE_URL")
supabaseKey = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(supabaseURL, supabaseKey)

''' Function to load a .json file and return the json inside '''
def load_manufacturers_json(path):
    #load json file w/ all manufacturer data
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)




''' insert functions for basic info below '''

def insert_manufacturer(manufacturer_data):

        manufacturer = {
            'name': manufacturer_data['Name'],
            'address': manufacturer_data['Company Info'].get('Address'),
            'location': manufacturer_data['Locations'][0] if manufacturer_data['Locations'] else None,
            'phone': manufacturer_data['Company Info'].get('Phone'),
            'email': manufacturer_data['Company Info'].get('Email'),
            'contactee': manufacturer_data['Contact'].get('Contactee'),  
            'description': manufacturer_data['Description']
        }

        result = supabase.table('manufacturers').insert(manufacturer).execute()
        manufacturer_id = result.data[0]['manufacturer_id']

        logging.info(f'inserted into manufacturers table: {manufacturer_data['Name']} (ID: {manufacturer_id})')

        return manufacturer_id


def insert_service(manufacturer_data):
    services_data = {
        'services': manufacturer_data['Services']
    }

    for service in services_data['services']:

        #check the service isnt already added
        result = supabase.table('services').select('service_name').eq('service_name', service).execute()

        if result.data:
            logging.info(f'not inserting into services table: {service} is already in the table')
            continue
        else:
            insert_response = supabase.table('services').insert({'service_name': service}).execute()
            service_id = insert_response.data[0]['service_id']
            logging.info(f'inserted into services table: {service}, (ID: {service_id})')



def insert_category(manufacturer_data):
    category_data = {
        'categories': manufacturer_data['Categories']
    }

    for category in category_data['categories']:

        #check category isnt already added
        result =  supabase.table('categories').select('category_name').eq('category_name', category).execute()

        if result.data:
            logging.info(f'not inserting into categories table: {category} is already in the table')
            continue
        else:
            insert_response = supabase.table('categories').insert({'category_name': category}).execute()
            category_id = insert_response.data[0]['category_id']
            logging.info(f'inserted into categories table: {category}, (ID: {category_id})')



def insert_prices(manufacturer_data):
    price_data = {
        'prices': manufacturer_data['Price']
    }

    for price in price_data['prices']:

        #check price isnt already added
        result = supabase.table('prices').select('price_level').eq('price_level', price).execute()

        if result.data:
            logging.info(f'not inserting into prices table: {price} is already in the table')
            continue
        else:
            insert_response = supabase.table('prices').insert({'price_level': price}).execute()
            price_id = insert_response.data[0]['price_id']
            logging.info(f'inserted into prices table: {price}, (ID: {price_id})')


def insert_minimums(manufacturer_data):
    minimums_data = {
        'minimums': manufacturer_data['Product Minimums']
    }

    for minimum in minimums_data['minimums']:

        #check the range isnt already in the table
        result = supabase.table('minimums').select('minimum_range').eq('minimum_range', minimum).execute()

        #if in the table, continue to next, no need to add it 
        if result.data:
            logging.info(f'not inserting into prod min table: {minimum} is already in the table')
            continue
        # if not in the table, add it
        else:
            insert_response = supabase.table('minimums').insert({'minimum_range': minimum}).execute()
            product_minimum_id = insert_response.data[0]['minimum_id']
            logging.info(f'inserted into prod min table: {minimum}, (ID: {product_minimum_id})')


def insert_product_categories(manufacturer_data):
    products_data = manufacturer_data['Products']

    for category_name, products in products_data.items():

        result = supabase.table('product_categories').select('product_category_id').eq('category_name', category_name).execute()
        
        if not result.data:
            insert_response = supabase.table('product_categories').insert({'category_name' : category_name}).execute()
            logging.info(f'inserted in prod categories table: {category_name} (ID: {insert_response.data[0]['product_category_id']})')
        else:
            logging.info(f"prod category already exists: {category_name}")

        
        #check for nested categories

        for product in products:
            if isinstance(product, dict):
                for nested_category_name in product.keys():
                    nested_result = supabase.table('product_categories').select('product_category_id').eq('category_name', nested_category_name).execute()
                    
                    if not nested_result.data:
                        nested_insert = supabase.table('product_categories').insert({'category_name': nested_category_name}).execute()
                        logging.info(f'inserted into prod categories: {nested_category_name} (ID: {nested_insert.data[0]['product_category_id']})')
                    else:
                        logging.info(f'prod category already exists: {nested_category_name}')



def insert_product_types(manufacturer_data):
    products_data = manufacturer_data['Products']
    
    for category_name, products in products_data.items():
        # get the category_id for this category
        category_result = supabase.table('product_categories').select('product_category_id').eq('category_name', category_name).execute()
        category_id = category_result.data[0]['product_category_id']
        
        for product in products:
            if isinstance(product, str):
                type_result = supabase.table('product_types').select('product_type_id').eq('product_type_name', product).execute()
                
                if not type_result.data:
                    supabase.table('product_types').insert({
                        'product_type_name': product,
                        'product_category_id': category_id
                    }).execute()
                    logging.info(f'inserted product_type: {product} under category: {category_name}')
                else:
                    logging.info(f'product_type already exists: {product}')
                    
            elif isinstance(product, dict):
                # nested structure like {"Neckwear": ["Ties"]}
                for nested_category_name, nested_types in product.items():
                    # get the nested category_id
                    nested_category_result = supabase.table('product_categories').select('product_category_id').eq('category_name', nested_category_name).execute()
                    nested_category_id = nested_category_result.data[0]['product_category_id']
                    
                    for nested_type in nested_types:
                        nested_type_result = supabase.table('product_types').select('product_type_id').eq('product_type_name', nested_type).execute()
                        
                        if not nested_type_result.data:
                            supabase.table('product_types').insert({
                                'product_type_name': nested_type,
                                'product_category_id': nested_category_id
                            }).execute()
                            logging.info(f'inserted product_type: {nested_type} under category: {nested_category_name}')
                        else:
                            logging.info(f'product_type already exists: {nested_type}')
            



''' insert functions for junction tables below '''

def insert_manufacturer_services(manufacturer_id, manufacturer_data):
    services_data = manufacturer_data['Services']
    
    for service_name in services_data:
        # get the service_id
        service_result = supabase.table('services').select('service_id').eq('service_name', service_name).execute()
        service_id = service_result.data[0]['service_id']
        
        # check if relationship already exists
        existing = supabase.table('manufacturer_services').select('*').eq('manufacturer_id', manufacturer_id).eq('service_id', service_id).execute()
        
        if not existing.data:
            supabase.table('manufacturer_services').insert({
                'manufacturer_id': manufacturer_id,
                'service_id': service_id
            }).execute()
            logging.info(f'linked manufacturer {manufacturer_id} to service: {service_name}')
        else:
            logging.info(f'manufacturer {manufacturer_id} already linked to service: {service_name}')


def insert_manufacturer_categories(manufacturer_id, manufacturer_data):
    categories_data = manufacturer_data['Categories']
    
    for category_name in categories_data:
        # get the category_id
        category_result = supabase.table('categories').select('category_id').eq('category_name', category_name).execute()
        category_id = category_result.data[0]['category_id']
        
        # check if relationship already exists
        existing = supabase.table('manufacturer_categories').select('*').eq('manufacturer_id', manufacturer_id).eq('category_id', category_id).execute()
        
        if not existing.data:
            supabase.table('manufacturer_categories').insert({
                'manufacturer_id': manufacturer_id,
                'category_id': category_id
            }).execute()
            logging.info(f'linked manufacturer {manufacturer_id} to category: {category_name}')
        else:
            logging.info(f'manufacturer {manufacturer_id} already linked to category: {category_name}')


def insert_manufacturer_prices(manufacturer_id, manufacturer_data):
    prices_data = manufacturer_data['Price']
    
    for price_level in prices_data:
        # get the price_id
        price_result = supabase.table('prices').select('price_id').eq('price_level', price_level).execute()
        price_id = price_result.data[0]['price_id']
        
        # check if relationship already exists
        existing = supabase.table('manufacturer_prices').select('*').eq('manufacturer_id', manufacturer_id).eq('price_id', price_id).execute()
        
        if not existing.data:
            supabase.table('manufacturer_prices').insert({
                'manufacturer_id': manufacturer_id,
                'price_id': price_id
            }).execute()
            logging.info(f'linked manufacturer {manufacturer_id} to price: {price_level}')
        else:
            logging.info(f'manufacturer {manufacturer_id} already linked to price: {price_level}') 


def insert_manufacturer_minimums(manufacturer_id, manufacturer_data):
    minimums_data = manufacturer_data['Product Minimums']
    
    for minimum_range in minimums_data:
        # get the minimum_id
        minimum_result = supabase.table('minimums').select('minimum_id').eq('minimum_range', minimum_range).execute()
        minimum_id = minimum_result.data[0]['minimum_id']
        
        # check if relationship already exists
        existing = supabase.table('manufacturer_minimums').select('*').eq('manufacturer_id', manufacturer_id).eq('minimum_id', minimum_id).execute()
        
        if not existing.data:
            supabase.table('manufacturer_minimums').insert({
                'manufacturer_id': manufacturer_id,
                'minimum_id': minimum_id
            }).execute()
            logging.info(f'linked manufacturer {manufacturer_id} to minimum: {minimum_range}')
        else:
            logging.info(f'manufacturer {manufacturer_id} already linked to minimum: {minimum_range}')



def insert_manufacturer_products(manufacturer_id, manufacturer_data):
    products_data = manufacturer_data['Products']
    
    for category_name, products in products_data.items():
        for product in products:
            if isinstance(product, str):
                # regular product type
                product_result = supabase.table('product_types').select('product_type_id').eq('product_type_name', product).execute()
                product_type_id = product_result.data[0]['product_type_id']
                
                # check if relationship already exists
                existing = supabase.table('manufacturer_products').select('*').eq('manufacturer_id', manufacturer_id).eq('product_type_id', product_type_id).execute()
                
                if not existing.data:
                    supabase.table('manufacturer_products').insert({
                        'manufacturer_id': manufacturer_id,
                        'product_type_id': product_type_id
                    }).execute()
                    logging.info(f'linked manufacturer {manufacturer_id} to product: {product}')
                else:
                    logging.info(f'manufacturer {manufacturer_id} already linked to product: {product}')
                    
            elif isinstance(product, dict):
                # nested products like {"Neckwear": ["Ties"]}
                for nested_category_name, nested_types in product.items():
                    for nested_type in nested_types:
                        nested_product_result = supabase.table('product_types').select('product_type_id').eq('product_type_name', nested_type).execute()
                        nested_product_type_id = nested_product_result.data[0]['product_type_id']
                        
                        # check if relationship already exists
                        existing = supabase.table('manufacturer_products').select('*').eq('manufacturer_id', manufacturer_id).eq('product_type_id', nested_product_type_id).execute()
                        
                        if not existing.data:
                            supabase.table('manufacturer_products').insert({
                                'manufacturer_id': manufacturer_id,
                                'product_type_id': nested_product_type_id
                            }).execute()
                            logging.info(f'linked manufacturer {manufacturer_id} to product: {nested_type}')
                        else:
                            logging.info(f'manufacturer {manufacturer_id} already linked to product: {nested_type}')


''' Helper function below '''

def process_manufacturer(manufacturer_data, index):
    try:
        manufacturer_id = insert_manufacturer(manufacturer_data)
        insert_service(manufacturer_data)
        insert_category(manufacturer_data)
        insert_prices(manufacturer_data)
        insert_minimums(manufacturer_data)
        insert_product_categories(manufacturer_data)
        insert_product_types(manufacturer_data)
        
        insert_manufacturer_services(manufacturer_id, manufacturer_data)
        insert_manufacturer_categories(manufacturer_id, manufacturer_data)
        insert_manufacturer_prices(manufacturer_id, manufacturer_data)
        insert_manufacturer_minimums(manufacturer_id, manufacturer_data)
        insert_manufacturer_products(manufacturer_id, manufacturer_data)
        
        logging.info(f"Successfully processed: {manufacturer_data['Name']}")
        print(f"Successfully processed: {manufacturer_data['Name']}")
        return True
        
    except Exception as e:
        logging.info(f"Error processing {manufacturer_data.get('Name', 'Unknown')}: {str(e)}")
        print(f"Error processed: {manufacturer_data['Name']}: {str(e)}")
        return False


def main():
    # load json data
    manufacturers = load_manufacturers_json('all_manufacturers.json')

    #NUM_TO_PROCESS = 10

    success_count = 0
    fail_count = 0

    for i, manufacturer in enumerate(manufacturers, 1):
        if process_manufacturer(manufacturer, i):
            success_count += 1
        else:
            fail_count += 1

    print(f"SUMMARY:")
    print(f"Successful: {success_count}")
    print(f"Failed: {fail_count}")

    logging.info(f"SUMMARY:")
    logging.info(f"Successful: {success_count}")
    logging.info(f"Failed: {fail_count}")



if __name__ == "__main__":
    main()
