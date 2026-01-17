# KOFA Auth Router - User Registration and Login
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr, validator
from typing import Optional
from datetime import datetime
import uuid
import hashlib
import os

router = APIRouter()

# Import verification email function
try:
    from ..resend_client import send_verification_email, generate_verification_code, get_verification_expiry
except ImportError:
    # Fallback if resend_client not available
    def generate_verification_code():
        import random
        return str(random.randint(100000, 999999))
    
    async def send_verification_email(email, code, name):
        return {"success": False, "error": "Email service not configured"}
    
    def get_verification_expiry():
        from datetime import datetime, timedelta
        return datetime.utcnow() + timedelta(minutes=15)

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


class VerifyCodeRequest(BaseModel):
    """Email verification code request."""
    email: str
    code: str


class AuthResponse(BaseModel):
    """Auth response with user data."""
    success: bool
    user_id: Optional[str] = None
    email: Optional[str] = None
    first_name: Optional[str] = None
    business_name: Optional[str] = None
    message: Optional[str] = None
    requires_verification: Optional[bool] = False


# In-memory user store (will be replaced with database)
# Format: {email: {user_data}}
USERS_STORE = {}

# Verification codes store
# Format: {email: {code, expiry, user_data}}
VERIFICATION_CODES = {}


@router.post("/register", response_model=AuthResponse)
async def register(request: RegisterRequest):
    """
    Register a new user account.
    Sends verification email before creating the account.
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
            
            # Generate verification code
            verification_code = generate_verification_code()
            
            # Send verification email
            email_result = await send_verification_email(
                to_email=request.email,
                verification_code=verification_code,
                first_name=request.first_name
            )
            
            if not email_result.get("success"):
                raise HTTPException(
                    status_code=500, 
                    detail=f"Failed to send verification email: {email_result.get('error', 'Unknown error')}"
                )
            
            # Store pending user data with verification code
            VERIFICATION_CODES[request.email] = {
                "code": verification_code,
                "expiry": get_verification_expiry(),
                "user_data": {
                    "email": request.email,
                    "password": request.password,
                    "first_name": request.first_name,
                    "business_name": request.business_name,
                    "phone": request.phone
                }
            }
            
            return AuthResponse(
                success=True,
                email=request.email,
                first_name=request.first_name,
                business_name=request.business_name,
                requires_verification=True,
                message="Verification email sent. Please check your inbox."
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


@router.post("/verify", response_model=AuthResponse)
async def verify_email(request: VerifyCodeRequest):
    """
    Verify email with 6-digit code and complete registration.
    Creates the user account after successful verification.
    """
    try:
        from ..database import SessionLocal
        from ..models import User
        
        email = request.email.lower().strip()
        
        # Get verification data
        verification_data = VERIFICATION_CODES.get(email)
        if not verification_data:
            raise HTTPException(status_code=400, detail="No verification code found. Please register first.")
        
        # Check if code expired
        if datetime.utcnow() > verification_data["expiry"]:
            del VERIFICATION_CODES[email]
            raise HTTPException(status_code=400, detail="Verification code expired. Please request a new one.")
        
        # Verify code
        if verification_data["code"] != request.code:
            raise HTTPException(status_code=400, detail="Invalid verification code")
        
        # Code is valid - get user data from stored verification
        user_data = verification_data["user_data"]
        
        # Create user account
        db = SessionLocal()
        try:
            # Check if user already exists
            existing = db.query(User).filter(User.email == email).first()
            if existing:
                del VERIFICATION_CODES[email]
                return AuthResponse(
                    success=True,
                    user_id=existing.id,
                    email=email,
                    first_name=existing.first_name,
                    business_name=existing.business_name,
                    message="Email already verified and account exists"
                )
            
            # Create new user with hashed password
            user_id = str(uuid.uuid4())
            new_user = User(
                id=user_id,
                email=email,
                phone=user_data.get("phone") or f"+234{uuid.uuid4().hex[:10]}",
                password_hash=hash_password(user_data["password"]),
                first_name=user_data["first_name"],
                business_name=user_data["business_name"]
            )
            
            db.add(new_user)
            db.commit()
            
            # Clear verification data
            del VERIFICATION_CODES[email]
            
            return AuthResponse(
                success=True,
                user_id=user_id,
                email=email,
                first_name=user_data["first_name"],
                business_name=user_data["business_name"],
                message="Email verified and account created successfully"
            )
            
        except HTTPException:
            raise
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Verification failed: {str(e)}")
        finally:
            db.close()
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Verification failed: {str(e)}")


@router.post("/resend-code")
async def resend_verification_code(email: str):
    """
    Resend verification code to email.
    """
    try:
        email = email.lower().strip()
        
        # Get existing verification data
        verification_data = VERIFICATION_CODES.get(email)
        if not verification_data:
            raise HTTPException(status_code=400, detail="No pending verification for this email")
        
        # Generate new code
        verification_code = generate_verification_code()
        verification_expiry = get_verification_expiry()
        
        # Update verification data
        verification_data["code"] = verification_code
        verification_data["expiry"] = verification_expiry
        VERIFICATION_CODES[email] = verification_data
        
        # Resend email
        email_result = await send_verification_email(
            to_email=email,
            verification_code=verification_code,
            first_name=verification_data["first_name"]
        )
        
        if not email_result.get("success"):
            raise HTTPException(status_code=500, detail="Failed to send verification email")
        
        return {
            "success": True,
            "message": "New verification code sent to your email"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to resend code: {str(e)}")


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
            
            # Check password from database
            if not user.password_hash:
                raise HTTPException(status_code=401, detail="Account not verified. Please complete email verification.")
            
            # Verify password
            if not verify_password(request.password, user.password_hash):
                raise HTTPException(status_code=401, detail="Invalid email or password")
            
            return AuthResponse(
                success=True,
                user_id=user.id,
                email=user.email,
                first_name=user.first_name or "User",
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
