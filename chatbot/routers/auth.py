# KOFA Auth Router - User Registration and Login
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, validator
from typing import Optional
from datetime import datetime
import uuid
import hashlib
import os
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# Try to import bcrypt for secure password hashing
try:
    import bcrypt
    _BCRYPT_AVAILABLE = True
    logger.info("bcrypt available — using secure password hashing")
except ImportError:
    _BCRYPT_AVAILABLE = False
    logger.warning("bcrypt not installed — falling back to SHA256 (INSECURE, install bcrypt ASAP)")

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

def hash_password(password: str) -> str:
    """Hash password securely. Uses bcrypt if available, SHA256 as fallback."""
    if _BCRYPT_AVAILABLE:
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    else:
        salt = os.environ.get("AUTH_SALT")
        if not salt:
            raise ValueError("AUTH_SALT environment variable is required when bcrypt is not installed")
        return hashlib.sha256(f"{password}{salt}".encode()).hexdigest()

def verify_password(password: str, password_hash: str) -> bool:
    """Verify password. Supports both bcrypt and legacy SHA256 hashes."""
    # Bcrypt hashes start with $2b$ or $2a$
    if password_hash.startswith('$2b$') or password_hash.startswith('$2a$'):
        if _BCRYPT_AVAILABLE:
            return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))
        return False
    else:
        # Legacy SHA256 hash — verify and upgrade to bcrypt on success
        salt = os.environ.get("AUTH_SALT", "")
        legacy_match = hashlib.sha256(f"{password}{salt}".encode()).hexdigest() == password_hash
        return legacy_match

def _upgrade_hash_if_needed(db, user, password: str):
    """Upgrade legacy SHA256 hash to bcrypt on successful login."""
    if _BCRYPT_AVAILABLE and user.password_hash and not user.password_hash.startswith('$2b$'):
        user.password_hash = hash_password(password)
        db.commit()
        logger.info(f"Upgraded password hash to bcrypt for user {user.email}")


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


# Legacy in-memory stores — NO LONGER USED
# All data is now persisted in the database


@router.post("/register", response_model=AuthResponse)
async def register(request: RegisterRequest):
    """
    Register a new user account.
    Sends verification email and stores verification code in database.
    """
    try:
        from ..database import SessionLocal
        from ..models import User, VerificationCode
        
        db = SessionLocal()
        try:
            # Check if email already exists in users
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
            
            # Delete any existing verification code for this email
            db.query(VerificationCode).filter(VerificationCode.email == request.email).delete()
            
            # Store verification code in database (persists across Heroku restarts!)
            new_verification = VerificationCode(
                id=str(uuid.uuid4()),
                email=request.email.lower().strip(),
                code=verification_code,
                password=hash_password(request.password),  # Store hashed password
                first_name=request.first_name,
                business_name=request.business_name,
                phone=request.phone,
                expires_at=get_verification_expiry()
            )
            
            db.add(new_verification)
            db.commit()
            
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
    Reads verification data from database (persists across Heroku restarts).
    """
    try:
        from ..database import SessionLocal
        from ..models import User, VerificationCode
        
        email = request.email.lower().strip()
        
        db = SessionLocal()
        try:
            # Get verification data from database
            verification_data = db.query(VerificationCode).filter(
                VerificationCode.email == email
            ).first()
            
            if not verification_data:
                raise HTTPException(status_code=400, detail="No verification code found. Please register first.")
            
            # Check if code expired
            if datetime.utcnow() > verification_data.expires_at:
                db.delete(verification_data)
                db.commit()
                raise HTTPException(status_code=400, detail="Verification code expired. Please request a new one.")
            
            # Verify code
            if verification_data.code != request.code:
                raise HTTPException(status_code=400, detail="Invalid verification code")
            
            # Code is valid - check if user already exists
            existing = db.query(User).filter(User.email == email).first()
            if existing:
                db.delete(verification_data)
                db.commit()
                return AuthResponse(
                    success=True,
                    user_id=existing.id,
                    email=email,
                    first_name=existing.first_name,
                    business_name=existing.business_name,
                    message="Email already verified and account exists"
                )
            
            # Create new user - password is already hashed in verification_data
            user_id = str(uuid.uuid4())
            new_user = User(
                id=user_id,
                email=email,
                phone=verification_data.phone or f"+234{uuid.uuid4().hex[:10]}",
                password_hash=verification_data.password,  # Already hashed during registration
                first_name=verification_data.first_name,
                business_name=verification_data.business_name
            )
            
            db.add(new_user)
            
            # Delete verification code
            db.delete(verification_data)
            
            db.commit()
            
            return AuthResponse(
                success=True,
                user_id=user_id,
                email=email,
                first_name=verification_data.first_name,
                business_name=verification_data.business_name,
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
    Reads from DATABASE (not in-memory) so it survives Heroku restarts.
    """
    try:
        from ..database import SessionLocal
        from ..models import VerificationCode

        email = email.lower().strip()

        db = SessionLocal()
        try:
            # Get existing verification data from DATABASE
            verification_data = db.query(VerificationCode).filter(
                VerificationCode.email == email
            ).first()

            if not verification_data:
                raise HTTPException(status_code=400, detail="No pending verification for this email")

            # Generate new code
            verification_code = generate_verification_code()
            verification_expiry = get_verification_expiry()

            # Update in database
            verification_data.code = verification_code
            verification_data.expires_at = verification_expiry
            db.commit()

            # Resend email
            email_result = await send_verification_email(
                to_email=email,
                verification_code=verification_code,
                first_name=verification_data.first_name
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
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to resend code: {str(e)}")
        finally:
            db.close()

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
            # Find user by email or phone
            login_id = request.email.lower().strip()
            # The frontend calls the field "email", but the user might type a phone number in it
            user = db.query(User).filter(
                (User.email == login_id) | (User.phone == request.email.strip())
            ).first()
            
            if not user:
                raise HTTPException(status_code=401, detail="Invalid email/phone or password")
            
            # Check password from database
            if not user.password_hash:
                raise HTTPException(status_code=401, detail="Account not verified. Please complete email verification.")
            
            # Verify password
            if not verify_password(request.password, user.password_hash):
                raise HTTPException(status_code=401, detail="Invalid email/phone or password")
            
            # Upgrade legacy SHA256 hash to bcrypt on successful login
            _upgrade_hash_if_needed(db, user, request.password)
            
            return AuthResponse(
                success=True,
                user_id=str(user.id),
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
    Get current user profile — reads directly from database.
    """
    try:
        from ..database import SessionLocal
        from ..models import User

        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == user_id).first()

            if not user:
                raise HTTPException(status_code=404, detail="User not found")

            return {
                "user_id": user.id,
                "email": user.email,
                "first_name": user.first_name or (user.business_name.split()[0] if user.business_name else "User"),
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
