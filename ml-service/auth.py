from __future__ import annotations

from typing import Any

from fastapi import Header, HTTPException, status
from pydantic import BaseModel

from database import get_client


class AdminIdentity(BaseModel):
    user_id: str
    role: str | None = None
    permissions: list[dict[str, Any]] | dict[str, Any] | None = None


def _extract_bearer_token(authorization: str | None) -> str:
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header is required.",
        )

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Bearer token is required.",
        )

    return token.strip()


def authenticate_admin_token(token: str) -> AdminIdentity:
    db = get_client()

    try:
        user_response = db.auth.get_user(token)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token.",
        ) from exc

    user = getattr(user_response, "user", None)
    user_id = getattr(user, "id", None)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unable to resolve caller identity.",
        )

    try:
        admin_res = (
            db.table("admins")
            .select("id, role, permissions")
            .eq("id", user_id)
            .maybe_single()
            .execute()
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to verify admin authorization.",
        ) from exc

    admin = admin_res.data
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin authorization is required.",
        )

    return AdminIdentity(
        user_id=user_id,
        role=admin.get("role"),
        permissions=admin.get("permissions"),
    )


async def require_admin_access(
    authorization: str | None = Header(default=None),
) -> AdminIdentity:
    token = _extract_bearer_token(authorization)
    return authenticate_admin_token(token)
