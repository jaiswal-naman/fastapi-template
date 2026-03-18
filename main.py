from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting up...")
    yield
    print("Shutting down...")


app = FastAPI(title="MVP API", version="1.0.0", lifespan=lifespan)

# CORS - allow Vite frontend (localhost:5173) and deployed Vercel URL
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://americsoft.vercel.app",
        os.getenv("FRONTEND_URL", "http://localhost:5173"),
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
