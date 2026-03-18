from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting up...")
    yield
    print("Shutting down...")

app = FastAPI(title="MVP API", version="1.0.0", lifespan=lifespan)

# CORS - allow Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://americsoft.vercel.app",
        os.getenv("FRONTEND_URL", "*"),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ────────────────────────────────────────────
# Health check
# ────────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "ok", "message": "API is running"}

@app.get("/health")
def health():
    return {"status": "healthy"}

# ────────────────────────────────────────────
# Add your routes below
# ────────────────────────────────────────────
