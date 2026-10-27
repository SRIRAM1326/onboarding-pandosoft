from typing import List
from pydantic_settings import BaseSettings
from pydantic import validator

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/pixelonics_onboarding"
    SECRET_KEY: str = "your-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE: int = 10485760
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000"]
    REDIS_URL: str = "redis://localhost:6379"
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    FRONTEND_URL: str = "http://localhost:3000"

    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v):
        if isinstance(v, str):
            import json
            return json.loads(v)
        return v

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
