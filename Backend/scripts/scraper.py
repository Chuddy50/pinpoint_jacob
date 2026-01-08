from playwright.sync_api import sync_playwright

from bs4 import BeautifulSoup
import time
import csv
import re
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

        page.wait_for_load_state("networkidle")  # wait until everything loads

        # Get all <li> inside the data-post-directory-posts container
        items = page.locator('[data-post-directory-posts] li')

        count = items.count()
        print(f"Found {count} list items")


        for i in range(10):
            # Enter factory information screen
            button = items.nth(i).locator('button[data-post-preview-toggle]')
            button.click()
            time.sleep(3)

            name = items.nth(i).text_content().strip()

            # individual factory page 
            factory_page = page.locator("div[data-post-content]")

            # company information outer div
            company_information = factory_page.locator("section").first.locator("div > div > div")
            first_col = company_information.nth(0)
            second_col = company_information.nth(1)
            third_col = company_information.nth(2)

            # company information inner div
            description_section = factory_page.locator("section + section")
            main_info = factory_page.locator("section + section > div")
            

            # Each section of main company info page
            company_info = parse_first_column(first_col)
            contact_info = parse_second_column(second_col)
            locations = parse_third_column(third_col)
            description = parse_description(main_info.locator("> div"))
            services = parse_services(main_info.locator("> div + div"))
            product_minimums = parse_product_minimums(main_info.locator(" > div + div + div"))
            products = parse_products(main_info.locator("> div + div + div + div"))
            categories = parse_categories(main_info.locator("> div + div + div + div + div"))
            price_points = parse_price_points(main_info.locator("> div + div + div + div + div + div"))
        
            data = {"Name": name,
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

            factory_page.wait_for(state="hidden", timeout=10000)

        browser.close()
     


def parse_first_column(content):
    try:
        content_items = content.locator("p")
        address_and_phone = " ".join((content_items.first).text_content().split()).split("Phone:")
        address = address_and_phone[0].strip()
        phone = address_and_phone[1].strip() if len(address_and_phone) > 1 else None
        email = " ".join((content_items.nth(1)).locator("a").text_content().split()).strip()
    except Exception as e:
        print(f"  Warning: Could not parse company info - {e}")
        address = None
        phone = None
        email = None

    return {"Address": address, "Phone": phone, "Email": email}


def parse_second_column(content):
    try:
        content_items = content.locator("p")

        contactee_info = content_items.first.inner_html()
        contactee_soup = BeautifulSoup(contactee_info, "html.parser")
        contactee_text_parts = list(contactee_soup.stripped_strings)
        
        name = contactee_text_parts[0] if len(contactee_text_parts) > 0 else None
        title = contactee_text_parts[1] if len(contactee_text_parts) > 1 else None
        
        phone_and_email = content_items.nth(1).inner_html()
        phone_email_soup = BeautifulSoup(phone_and_email, "html.parser")
        phone_email_parts = list(phone_email_soup.stripped_strings)
        
        phone = phone_email_parts[0][7:] if len(phone_email_parts) > 0 else None
        email = phone_email_parts[1] if len(phone_email_parts) > 1 else None
    except Exception as e:
        print(f"  Warning: Could not parse contact info - {e}")
        name = None
        title = None
        phone = None
        email = None
    
    return {"Contactee": name, "Title": title, "Phone": phone, "Email": email}


def parse_third_column(content):
    try:
        locations = content.locator("ul").locator("li").all()
        parsed_locations = [location.text_content().strip() for location in locations]
        return parsed_locations if parsed_locations else []
    except Exception as e:
        print(f"  Warning: Could not parse locations - {e}")
        return []


def parse_description(content):
    try:
        descriptions = []
        paragraphs = content.locator("> div")
        description_paragraphs = paragraphs.locator("p").all()
        for description in description_paragraphs:
            descriptions.append(description.text_content().strip())
        final_description = "\n".join(descriptions)
        return final_description if final_description else None
    except Exception as e:
        print(f"  Warning: Could not parse description - {e}")
        return None


def parse_services(content):
    try:
        services = []
        list_items = content.locator("ul").first.locator("li").all()
        for item in list_items:
            services.append(item.text_content())
        return services
    except Exception as e:
        print(f"  Warning: Could not parse services - {e}")
        return []


def parse_product_minimums(content):
    try:
        minimums = []
        list_of_minimums = content.locator("> div > div + div > ul ").first.locator("li").all()
        
        for item in list_of_minimums:
            minimums.append(item.text_content())
        return minimums
    except Exception as e:
        print(f"  Warning: Could not parse minimums - {e}")
        return []


def parse_products(content):
    results = {}
    
    try:
        all_data = content.locator("> div > div + div").first
        upper_categories = all_data.locator("div.underline").all()

        for upper in upper_categories:
            try:
                category_name = upper.text_content().strip()
                results[category_name] = []

                # check that a <ul> actually follows the category div
                ul_locator = upper.locator("+ ul")
                if ul_locator.count() == 0:
                    continue  # no items for this category, skip safely

                ul = ul_locator.first
                items = ul.locator("> li").all()

                for item in items:
                    try:
                        # only get direct text of this <li> (avoid merging with sublist)
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

                        # check for subcategory list inside this li
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
                print(f"  Warning: Could not parse product category {category_name} - {e}")
                continue
                
    except Exception as e:
        print(f"  Warning: Could not parse products section - {e}")
        
    return results


def parse_categories(content):
    try:
        categories = []
        list_of_categories = content.locator("> div > div + div > ul ").first.locator("li").all()
        
        for item in list_of_categories:
            categories.append(item.text_content())
        return categories
    except Exception as e:
        print(f"  Warning: Could not parse categories - {e}")
        return []


def parse_price_points(content):
    try:
        price_points = []
        list_of_prices = content.locator("> div > div + div > ul ").first.locator("li").all()
        for item in list_of_prices:
            price_points.append(item.text_content())
        return price_points
    except Exception as e:
        print(f"  Warning: Could not parse price points - {e}")
        return []

def test():
    data = {
	"Name": "21 Production",
	"Company Info": {
		"Address": "155 W. Washington Los Angeles , CA , 90015",
		"Phone": "2134345520",
		"Email": "Mike@avendors.com"
	},
	"Contact": {
		"Contactee": "Mike Cherent",
		"Title": "Co-Founder",
		"Phone": "2134345520",
		"Email": "Mike@avendors.com"
	},
	"Locations": ["Los Angeles"],
	"Description": "We are founders with over 50 years of combined manufacturing experience and provide contemporary brands with high-quality, full package apparel manufacturing made in the U.S.A.\nWe’re disputing the traditional manufacturing process. AV provides a one-stop-shop manufacturing hub to help Free designers with the following :\nUncap limitations in their creative process\nNo more dealing with 10’s factories\nNo more battling to find reliable factories\nNo more worrying about souring\nNo more quality-related issue\nFaster turnaround time\nWe think in long-term. We aim to select candidates who are serious about building their business. Our goal is to go above and beyond to help designers reach their full potential. In exchange, we hope to win you over for your brand’s ever-growing manufacturing needs.\nAVmade.com",
	"Services": ["Cutting", "Denim Services", "Designing", "Embroidery", "Fabric Dyeing", "Fabric Purchase", "Fabric Sourcing", "Fabric Weaving", "Knitting", "Marker Making", "Pattern Grading", "Pattern Making", "Pleating", "Printing", "Sample Making", "Sewing", "TrimmingEmbellishment"],
	"Product Minumums": ["+300 Prod", "+500 Prod", "1-10 Proto & Samples", "100-300 Prod", "50-100 Prod"],
	"Products": {
		"Accessories": ["Bags & Soft Cases", "Fur", "Handbags", "Head Bands", "Headwear", "Leather Goods", "Leggings", "Legwear", {
			"Neckwear": ["Ties"]
		}, "Robes", "Scarves"],
		"Active Wear": ["Bike Shorts", "Body Wear", "Bra Tops", "Dance Exercisewear", "Flatlock Activewear", "Golf", "Jogging Suits", "Swimwear"],
		"Evening": ["Bridal", "Cocktail Dresses", "Evening Dresses"],
		"Home": ["Aprons", "Decorative Pillows", {
			"Infant": ["Baby Bedding"]
		}, "Table Cloths"],
		"Innerwear": [{
			"Lingerie": ["Boxer Shorts", "Bras", "Briefs", "Robes", "Sleepwear", "Slips"]
		}],
		"Knits": ["Fleece Bottoms", "Fleece Tops", {
			"Full": ["Half Zips"]
		}, "Hand Loomed Knitwear", "Knit Headwear", {
			"Knit Shirts": ["Tops"]
		}, "Knit Tops", "Loungewear", "Polar Fleece", "Polo Shirts", "Sweaters", "T-Shirts"],
		"Sportswear": ["Blouses", {
			"Coats": ["Outerwear"]
		}, "Denim Product", "Dress Shirts", "Dresses", "Pants", "Rainwear", "Shorts", "Skirts", "Unconstructed Jackets", "Vests", "Woven Shirts"],
		"Tailored": ["Bottoms", "Formal Wear", {
			"Jackets": ["Blazers"]
		}],
		"Uniforms": ["Athletic Uniforms", "Disposable Uniforms", "Workwear"]
	},
	"Categories": ["Accessories", "Children's", "Home", "Men's", "Women's"],
	"Price": ["Better", "Bridge", "Contemporary", "Designer", "Moderate"]
}
        
        
#         flat = flatten_json(data)


#      df = pd.DataFrame([flat])
# df.to_csv("output.csv", index=False)

# }

def main():
    scrape_data()
    #  test()

    # after scrape_data() runs and 'all_manufacturers' is filled, put it in a json file
    with open('all_manufacturers.json', 'w', encoding='utf-8') as file:
        json.dump(all_manufacturers, file, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    main()