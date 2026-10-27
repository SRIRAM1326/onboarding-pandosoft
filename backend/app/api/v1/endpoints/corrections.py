from typing import Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api import deps
from app.core.database import get_db
from app.models.user import User

router = APIRouter()

@router.get("/")
def read_corrections(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    return []
