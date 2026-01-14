# KOFA Auth Router - User Registration and Login
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr, validator
from typing import Optional
from datetime import datetime
import uuid
import hashlib
import os

router = APIRouter()

# Simple password hashing (in production, use bcrypt)
def hash_password(password: str) -> str:
    """Hash password with salt using SHA256."""
    salt = os.environ.get("AUTH_SALT", "kofa-salt-2024")
    return hashlib.sha256(f"{password}{salt}".encode()).hexdigest()

def verify_password(password: str, password_hash: str) -> bool:
    """Verify password against hash."""
    return hash_password(password) == password_hash


class RegisterRequest(BaseModel):
    """User registration request."""
    email: str
    password: str
    first_name: str
    business_name: str
    phone: Optional[str] = None
    
    @validator('email')
    def validate_email(cls, v):
        if not v or '@' not in v:
            raise ValueError('Valid email is required')
        return v.lower().strip()
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters')
        return v
    
    @validator('first_name')
    def validate_name(cls, v):
        if not v or len(v.strip()) < 1:
            raise ValueError('First name is required')
        return v.strip()
    
    @validator('business_name')
    def validate_business(cls, v):
        if not v or len(v.strip()) < 2:
            raise ValueError('Business name is required')
        return v.strip()


class LoginRequest(BaseModel):
    """User login request."""
    email: str
    password: str


class AuthResponse(BaseModel):
    """Auth response with user data."""
    success: bool
    user_id: Optional[str] = None
    email: Optional[str] = None
    first_name: Optional[str] = None
    business_name: Optional[str] = None
    message: Optional[str] = None


# In-memory user store (will be replaced with database)
# Format: {email: {user_data}}
USERS_STORE = {}


@router.post("/register", response_model=AuthResponse)
async def register(request: RegisterRequest):
    """
    Register a new user account.
    Returns user_id on success.
    """
    try:
        from ..database import SessionLocal
        from ..models import User
        
        db = SessionLocal()
        try:
            # Check if email already exists
            existing = db.query(User).filter(User.email == request.email).first()
            if existing:
                raise HTTPException(status_code=400, detail="Email already registered")
            
            # Check if phone exists (if provided)
            if request.phone:
                existing_phone = db.query(User).filter(User.phone == request.phone).first()
                if existing_phone:
                    raise HTTPException(status_code=400, detail="Phone number already registered")
            
            # Create new user
            user_id = str(uuid.uuid4())
            new_user = User(
                id=user_id,
                email=request.email,
                phone=request.phone or f"+234{uuid.uuid4().hex[:10]}",  # Generate placeholder if not provided
                business_name=request.business_name,
                # Store first_name in the 'name' field (we'll update model if needed)
                # For now, use business_name field or add to a JSON field
            )
            
            # Store password hash in memory for now (add to model later)
            USERS_STORE[request.email] = {
                "user_id": user_id,
                "password_hash": hash_password(request.password),
                "first_name": request.first_name,
                "business_name": request.business_name
            }
            
            db.add(new_user)
            db.commit()
            
            return AuthResponse(
                success=True,
                user_id=user_id,
                email=request.email,
                first_name=request.first_name,
                business_name=request.business_name,
                message="Account created successfully"
            )
            
        except HTTPException:
            raise
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")
        finally:
            db.close()
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")


@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    """
    Login with email and password.
    Returns user data on success.
    """
    try:
        from ..database import SessionLocal
        from ..models import User
        
        db = SessionLocal()
        try:
            # Find user by email
            user = db.query(User).filter(User.email == request.email.lower().strip()).first()
            
            if not user:
                raise HTTPException(status_code=401, detail="Invalid email or password")
            
            # Check password from memory store
            stored_data = USERS_STORE.get(request.email.lower().strip())
            if not stored_data:
                # User exists in DB but no password - might be old account
                # For now, allow login and create password entry
                USERS_STORE[request.email.lower().strip()] = {
                    "user_id": user.id,
                    "password_hash": hash_password(request.password),
                    "first_name": user.business_name.split()[0] if user.business_name else "User",
                    "business_name": user.business_name
                }
                stored_data = USERS_STORE[request.email.lower().strip()]
            
            # Verify password
            if not verify_password(request.password, stored_data["password_hash"]):
                raise HTTPException(status_code=401, detail="Invalid email or password")
            
            return AuthResponse(
                success=True,
                user_id=user.id,
                email=user.email,
                first_name=stored_data.get("first_name", "User"),
                business_name=user.business_name,
                message="Login successful"
            )
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")
        finally:
            db.close()
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")


@router.get("/me")
async def get_current_user(user_id: str):
    """
    Get current user profile.
    """
    try:
        from ..database import SessionLocal
        from ..models import User
        
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
            
            # Get stored data for first_name
            stored_data = None
            for email, data in USERS_STORE.items():
                if data.get("user_id") == user_id:
                    stored_data = data
                    break
            
            return {
                "user_id": user.id,
                "email": user.email,
                "first_name": stored_data.get("first_name") if stored_data else (user.business_name.split()[0] if user.business_name else "User"),
                "business_name": user.business_name,
                "phone": user.phone,
                "bot_style": user.bot_style
            }
            
        finally:
            db.close()
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
