from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/auth", tags=["Auth"])

class LoginRequest(BaseModel):
    username: str
    password: str
    role: str

USERS = {
    "patient": {
        "username": "patient",
        "password": "patient123",
        "role": "patient"
    },
    "doctor": {
        "username": "doctor",
        "password": "doctor123",
        "role": "doctor"
    },
    "inventory": {
        "username": "inventory",
        "password": "inventory123",
        "role": "inventory"
    }
}

@router.post("/login")
def login(data: LoginRequest):
    user = USERS.get(data.role)

    if not user:
        raise HTTPException(status_code=400, detail="Invalid role")

    if data.username != user["username"] or data.password != user["password"]:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    return {
        "message": "Login successful",
        "username": user["username"],
        "role": user["role"]
    }