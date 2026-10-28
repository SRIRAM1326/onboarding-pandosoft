from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.api import deps
from app.core.database import get_db
from app.models.notification import Notification
from app.models.user import User

router = APIRouter()

def serialize_notification(n: Notification) -> dict:
    return {
        "id": str(n.id),
        "userId": str(n.user_id),
        "applicationId": str(n.application_id) if n.application_id else None,
        "kind": n.type.value if hasattr(n.type, "value") else str(n.type or "info"),
        "title": n.title,
        "body": n.message or "",
        "createdAt": n.created_at.isoformat() if n.created_at else datetime.now(timezone.utc).isoformat(),
        "read": bool(n.is_read),
        "href": n.link or "/portal",
    }

@router.get("/")
def read_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    items = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.id.desc())
        .all()
    )
    return [serialize_notification(n) for n in items]

@router.post("/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    notif = (
        db.query(Notification)
        .filter(Notification.id == notification_id, Notification.user_id == current_user.id)
        .first()
    )
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    notif.read_at = datetime.now(timezone.utc)
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return serialize_notification(notif)

@router.post("/read-all")
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    now = datetime.now(timezone.utc)
    db.query(Notification).filter(
        Notification.user_id == current_user.id, Notification.is_read == False
    ).update({"is_read": True, "read_at": now})
    db.commit()
    return {"status": "ok"}
