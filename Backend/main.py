from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, manufacturers, reviews, consultant, designs

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(auth.router, prefix="/pinpoint", tags=["auth"])
app.include_router(manufacturers.router, tags=["manufacturers"])
app.include_router(reviews.router, tags=["reviews"])
app.include_router(consultant.router, prefix="/pinpoint", tags=["consultant"])
app.include_router(designs.router, tags=["designs"])