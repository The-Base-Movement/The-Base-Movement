from fastapi import APIRouter
from database import get_client

router = APIRouter()


@router.get("/health")
async def health():
    try:
        db = get_client()
        db.table("users").select("id").limit(1).execute()
        db_status = "connected"
    except Exception:
        db_status = "unreachable"

    return {"status": "ok", "database": db_status, "version": "1.0.0"}
