"""
database.py

Last Edited: 1/21/2026
Developers: Leo Plute
Description: Centralized database and external service (Groq) configuration.
             Initializes the Supabase client and Groq AI client with environment
             variables
"""

from supabase import create_client, Client
from groq import Groq
from dotenv import load_dotenv
import os
from prompts.consultant import CONSULTANT_SYSTEM_PROMPT

# Load environment variables from .env file
load_dotenv()

# Initialize Supabase client for database, authentication, and file storage
supabaseURL = os.getenv("SUPABASE_URL")
supabaseKey = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(supabaseURL, supabaseKey)

# Initialize Groq AI client for consulatnt chat feature
groq_api_key = os.getenv("GROQ_API_KEY")
groq_client = Groq(api_key=groq_api_key) if groq_api_key else None
consultant_prompt = CONSULTANT_SYSTEM_PROMPT
groq_model = os.getenv("GROQ_MODEL", "mixtral-8x7b-32768")
