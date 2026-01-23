"""
main.py

Last Edited: 1/21/2026
Developers: Leo Plute, Jacob Nguyen, Luke Jones, Jacob Dietz
Description: FastAPI application entry point. Configures CORS middleware,
             and includes all API routers for auth, manufacturers, reviews
             consultant, and designs.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, manufacturers, reviews, consultant, designs, rfq

# Create FastAPI application instance
app = FastAPI()

# Add CORS middleware 
# *Allows frontend server to send requests to this, normally same origin policy on
#    browser would block this, this allows us to bypass that
# *Will eventually need to add real site URL here once we deploy the site
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# Register all API route modules with their URL prefixes and documentation tags
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(manufacturers.router, tags=["manufacturers"])
app.include_router(reviews.router, tags=["reviews"])
app.include_router(consultant.router, prefix="/consultant", tags=["consultant"])
app.include_router(designs.router, tags=["designs"])
app.include_router(rfq.router, prefix="/rfq", tags=["rfq"])