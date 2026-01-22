from supabase import create_client, Client
from groq import Groq
from dotenv import load_dotenv
import os

load_dotenv()

supabaseURL = os.getenv("SUPABASE_URL")
supabaseKey = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(supabaseURL, supabaseKey)

groq_api_key = os.getenv("GROQ_API_KEY")
groq_client = Groq(api_key=groq_api_key) if groq_api_key else None
consultant_prompt = os.getenv(
    "CONSULTANT_SYSTEM_PROMPT",
    "You are PinPoint's consulting assistant. Be concise and actionable.",
)
groq_model = os.getenv("GROQ_MODEL", "mixtral-8x7b-32768")