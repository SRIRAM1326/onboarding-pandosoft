from typing import Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api import deps
from app.core.database import get_db
from app.models.user import User
from app.schemas.user import User as UserSchema

router = APIRouter()

@router.get("/", response_model=List[UserSchema])
def read_users(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
):
    users = db.query(User).offset(skip).limit(limit).all()
    return users
