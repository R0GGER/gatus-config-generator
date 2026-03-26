from pathlib import Path
from fastapi import Depends, FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from .auth import verify_credentials
from .database import create_db
from .settings import get_settings
from .api import configs, deploy

app = FastAPI(
    title="Gatus Config Generator",
    description="Visuele YAML-generator voor Gatus monitoring",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

auth_deps = [Depends(verify_credentials)]

app.include_router(configs.router, prefix="/api", dependencies=auth_deps)
app.include_router(deploy.router, prefix="/api", dependencies=auth_deps)

FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"
if not FRONTEND_DIR.exists():
    FRONTEND_DIR = Path(__file__).resolve().parent.parent.parent / "frontend"


@app.on_event("startup")
def on_startup():
    create_db()


@app.get("/api/health")
def health():
    settings = get_settings()
    return {"status": "ok", "standalone_mode": settings.standalone_mode}


if FRONTEND_DIR.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")
