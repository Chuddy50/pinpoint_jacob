# Backend

## Project Structure
```
Backend/
├── main.py                    # Application entry point, router registration
├── config/
│   └── database.py           # Supabase and Groq client configuration
├── routers/
│   ├── auth.py              # User authentication endpoints
│   ├── manufacturers.py     # Manufacturer data endpoints
│   ├── reviews.py           # Review submission endpoints
│   ├── consultant.py        # AI consultant chat endpoint
│   └── designs.py           # 3D design management endpoints
├── scripts/
│   ├── dataToDB.py          # Scraped JSON -> DB script
│   ├── dbTests.py           # Simple tests for JSON -> DB
│   ├── newScraper.py        # Optimized version of original scraper
│   ├── scraper.py           # Original scraper
│   ├── process_log.txt      # Log of JSON -> DB process
├── requirements.txt
└── .env                      # Environment variables (not in repo)
```

## First-Time Setup

1. **Create and activate virtual environment:**

   **Mac/Linux:**
```
   cd Backend
   python3 -m venv venv
   source venv/bin/activate
```

   **Windows:**
```
   cd Backend
   python -m venv venv
   venv\Scripts\activate
```

2. **Install dependencies:**
```
   pip install -r requirements.txt
```

3. **Configure environment variables:**
   
   Create a `.env` file in the `Backend/` directory with:
```
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_key
   GROQ_API_KEY=your_groq_api_key
   GROQ_MODEL=mixtral-8x7b-32768
   CONSULTANT_SYSTEM_PROMPT="You are PinPoint's consulting assistant. Be concise and actionable."
```

## Activating Virtual Environment

**Mac/Linux:**
```
source venv/bin/activate
```

**Windows:**
```
venv\Scripts\activate
```

## Running the Server

**Make sure virtual environment is activated**, then:
```
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

The API will be available at `http://127.0.0.1:8000`

API documentation available at `http://127.0.0.1:8000/docs`

## Stopping the Server

- Press `Ctrl+C` in the terminal
- To exit virtual environment: `deactivate`

## API Endpoints

- **Auth:** `/pinpoint/signup`, `/pinpoint/login`, `/pinpoint/logout`, `/pinpoint/updatePFP/{user_id}`
- **Manufacturers:** `/manufacturers`, `/manufacturers/{manufacturer_id}`
- **Reviews:** `/reviews`
- **Consultant:** `/pinpoint/chat`
- **Designs:** `/designs/save/{user_id}`, `/designs/saved_designs/{user_id}`
