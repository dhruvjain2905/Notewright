from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import generate

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


app.include_router(generate.router, prefix="/api")