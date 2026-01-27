from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi import UploadFile, File
import os
from datetime import datetime, timezone
from uuid import uuid4

from email_service import send_email



@app.get("/email")
async def get_manufacturer():
    pass