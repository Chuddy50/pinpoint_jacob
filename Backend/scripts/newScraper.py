"""
newScraper.py

Last Edited: 1/12/2026
Developers: Leo Plute
Description: Updated version of the scraper originally written
             by Jacob Dietz. This one takes out some hardcoded stuff,
             as well as fixes some of the small details. I (Leo) made a
             whole new file for this to make sure the original one stayed
             in tact in case I messed this one up further. 
             This was the scraper actually used to scrape the site to JSON
             before going into the database.
"""

from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup
import time
import json

URL = "https://cfda.com/resources/supply-chain-manufacturing/production-directory/"

# list to collect all manufacturer data
all_manufacturers = []

def scrape_data():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        page.goto(URL)

        page.wait_for_load_state("networkidle")

        items = page.locator('[data-post-directory-posts] li')

        count = items.count()
        print(f"Found {count} list items")

        for i in range(count):  # change to count for full run
            # requery items to avoid stale locator
            items = page.locator('[data-post-directory-posts] li')
            
            # enter factory information screen
            button = items.nth(i).locator('button[data-post-preview-toggle]')
            button.click()
            page.locator("div[data-post-content]").wait_for(state="visible", timeout=5000)

            name = items.nth(i).text_content().strip()

            # individual factory page 
            factory_page = page.locator("div[data-post-content]")

            # company information outer div (first section - keep as is)
            company_information = factory_page.locator("section").first.locator("div > div > div")
            first_col = company_information.nth(0)
            second_col = company_information.nth(1)
            third_col = company_information.nth(2)

            # parse company info section 
            company_info = parse_first_column(first_col)
            contact_info = parse_second_column(second_col)
            locations = parse_third_column(third_col)
            
            # parse description from rich-text section
            description = parse_description(factory_page)
            
            # parse sections by header name
            services_section = get_section_by_header(factory_page, "Services")
            minimums_section = get_section_by_header(factory_page, "Production Minimums")
            products_section = get_section_by_header(factory_page, "Products")
            categories_section = get_section_by_header(factory_page, "Categories")
            price_section = get_section_by_header(factory_page, "Price")
            
            # parse each section or return defaults if section doesn't exist
            services = parse_services(services_section) if services_section else []
            product_minimums = parse_product_minimums(minimums_section) if minimums_section else []
            products = parse_products(products_section) if products_section else {}
            categories = parse_categories(categories_section) if categories_section else []
            price_points = parse_price_points(price_section) if price_section else []
        
            data = {
                "Name": name,
                "Company Info": company_info,
                "Contact": contact_info, 
                "Locations": locations,
                "Description": description,
                "Services": services, 
                "Product Minimums": product_minimums, 
                "Products": products,
                "Categories": categories,
                "Price": price_points
            }
            
            all_manufacturers.append(data)
            print(f"scraped: {name}")

            # Exit factory information screen
            close_button = page.locator("button[data-popover-close]").last
            close_button.click()
            page.locator("div[data-post-content]").wait_for(state="hidden", timeout=10000)

        browser.close()


def get_section_by_header(factory_page, header_text):
    """Find a section by its header text and return the content div"""
    try:
        # get all sections with border-t class
        sections = factory_page.locator("div.border-t.border-grey-200").all()
        
        for section in sections:
            # find the header span
            header_spans = section.locator("span.font-bold").all()
            for header_span in header_spans:
                section_title = header_span.text_content().strip()
                
                # Check if this is the section we're looking for
                if header_text.lower() in section_title.lower():
                    # Return the content div (second column with actual data)
                    return section.locator("div.col-span-12.md\\:col-span-6").nth(1)
        
        return None  # Section not found
    except Exception as e:
        print(f"  Warning: Could not find section '{header_text}' - {e}")
        return None


def parse_first_column(content):
    # Initialize to None
    address = None
    phone = None
    email = None
    
    try:
        content_items = content.locator("p")
        address_and_phone = " ".join((content_items.first).text_content().split()).split("Phone:")
        address = address_and_phone[0].strip()
        phone = address_and_phone[1].strip() if len(address_and_phone) > 1 else None
        email = " ".join((content_items.nth(1)).locator("a").text_content().split()).strip()
    except Exception as e:
        print(f"  Warning: Could not parse company info - {e}")

    return {"Address": address, "Phone": phone, "Email": email}


def parse_second_column(content):
    # Initialize everything to None
    name = None
    title = None
    phone = None
    email = None
    
    try:
        content_items = content.locator("p")

        # Try to parse name/title
        try:
            contactee_info = content_items.first.inner_html()
            contactee_soup = BeautifulSoup(contactee_info, "html.parser")
            contactee_text_parts = list(contactee_soup.stripped_strings)
            
            name = contactee_text_parts[0] if len(contactee_text_parts) > 0 else None
            title = contactee_text_parts[1] if len(contactee_text_parts) > 1 else None
        except Exception as e:
            print(f"  Warning: Could not parse contactee name/title - {e}")
        
        # Try to parse phone/email separately
        try:
            phone_and_email = content_items.nth(1).inner_html()
            phone_email_soup = BeautifulSoup(phone_and_email, "html.parser")
            phone_email_parts = list(phone_email_soup.stripped_strings)
            
            if len(phone_email_parts) > 0:
                phone = phone_email_parts[0][7:] if phone_email_parts[0].startswith("Phone:") else phone_email_parts[0]
            if len(phone_email_parts) > 1:
                email = phone_email_parts[1]
        except Exception as e:
            print(f"  Warning: Could not parse phone/email - {e}")
            
    except Exception as e:
        print(f"  Warning: Major parsing error in contact column - {e}")
    
    return {"Contactee": name, "Title": title, "Phone": phone, "Email": email}


def parse_third_column(content):
    try:
        locations = content.locator("ul").locator("li").all()
        parsed_locations = [location.text_content().strip() for location in locations]
        return parsed_locations if parsed_locations else []
    except Exception as e:
        print(f"  Warning: Could not parse locations - {e}")
        return []


def parse_description(factory_page):
    try:
        descriptions = []
        # Description is in the rich-text div
        rich_text_section = factory_page.locator("div.rich-text")
        
        if rich_text_section.count() > 0:
            description_paragraphs = rich_text_section.locator("p").all()
            for description in description_paragraphs:
                descriptions.append(description.text_content().strip())
            final_description = "\n".join(descriptions)
            return final_description if final_description else None
        return None
    except Exception as e:
        print(f"  Warning: Could not parse description - {e}")
        return None


def parse_services(content):
    if not content:
        return []
    
    try:
        services = []
        list_items = content.locator("ul li").all()
        for item in list_items:
            services.append(item.text_content().strip())
        return services
    except Exception as e:
        print(f"  Warning: Could not parse services - {e}")
        return []


def parse_product_minimums(content):
    if not content:
        return []
    
    try:
        minimums = []
        list_items = content.locator("ul li").all()
        for item in list_items:
            minimums.append(item.text_content().strip())
        return minimums
    except Exception as e:
        print(f"  Warning: Could not parse minimums - {e}")
        return []


def parse_products(content):
    if not content:
        return {}
    
    results = {}
    
    try:
        # Products section has categories with underline divs
        upper_categories = content.locator("div.underline").all()

        for upper in upper_categories:
            try:
                category_name = upper.text_content().strip()
                results[category_name] = []

                # Get the ul that follows this category
                ul_locator = upper.locator("+ ul")
                if ul_locator.count() == 0:
                    continue

                ul = ul_locator.first
                items = ul.locator("> li").all()

                for item in items:
                    try:
                        # Get direct text of this <li> (avoid merging with sublist)
                        item_name = item.evaluate(
                            """(el) => {
                                let text = '';
                                for (const node of el.childNodes) {
                                    if (node.nodeType === Node.TEXT_NODE)
                                        text += node.textContent;
                                }
                                return text.trim();
                            }"""
                        )

                        # Check for subcategory list inside this li
                        sub_uls = item.locator("> ul")
                        if sub_uls.count() > 0:
                            sub_ul = sub_uls.first
                            subitems = [sub.text_content().strip() for sub in sub_ul.locator("> li").all()]
                            results[category_name].append({item_name: subitems})
                        else:
                            results[category_name].append(item_name)
                    except Exception as e:
                        print(f"  Warning: Could not parse product item - {e}")
                        continue
                        
            except Exception as e:
                print(f"  Warning: Could not parse product category - {e}")
                continue
                
    except Exception as e:
        print(f"  Warning: Could not parse products section - {e}")
        
    return results


def parse_categories(content):
    if not content:
        return []
    
    try:
        categories = []
        list_items = content.locator("ul li").all()
        for item in list_items:
            categories.append(item.text_content().strip())
        return categories
    except Exception as e:
        print(f"  Warning: Could not parse categories - {e}")
        return []


def parse_price_points(content):
    if not content:
        return []
    
    try:
        price_points = []
        list_items = content.locator("ul li").all()
        for item in list_items:
            price_points.append(item.text_content().strip())
        return price_points
    except Exception as e:
        print(f"  Warning: Could not parse price points - {e}")
        return []


def main():
    scrape_data()

    # Save to JSON file
    with open('all_manufacturers.json', 'w', encoding='utf-8') as file:
        json.dump(all_manufacturers, file, indent=2, ensure_ascii=False)

    print(f"\nSuccessfully scraped {len(all_manufacturers)} manufacturers")


if __name__ == "__main__":
    main()