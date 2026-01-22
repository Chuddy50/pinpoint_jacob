# Backend

## to run this 
// Start virtual environment for windows
venv\Scripts\activate

cd backend
pip install -r requirements.txt
source venv/bin/activate
uvicorn main:app --reload --host 127.0.0.1 --port 8000

// Install dependencies in virtual environment
pip install -r requirements.txt

// Start backend server
uvicorn main:app --reload

// To exit virtual environment: deactivate
