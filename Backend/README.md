# Backend

// Create virtual environment
python -m venv .venv

// Activate virtual environment
.venv\scripts\activate

// Install dependencies in virtual environment
pip install -r requirements.txt

// Start backend server
uvicorn main:app --reload
