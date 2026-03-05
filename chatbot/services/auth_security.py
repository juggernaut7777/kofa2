"""
JWT Token Refresh & Auth Security Service for KOFA
Handles access token generation, refresh token rotation, and API key management.
"""
import os
import hashlib
import secrets
import logging
from typing import Optional, Dict, Tuple
from datetime import datetime, timedelta
from contextlib import contextmanager

logger = logging.getLogger(__name__)

# Configuration from environment
JWT_SECRET = os.getenv("JWT_SECRET_KEY", "kofa-dev-secret-change-in-production")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "30"))


class AuthSecurityService:
    """
    Enhanced auth with refresh tokens and API key rotation.
    
    Flow:
    1. User logs in → gets access_token (30 min) + refresh_token (30 days)
    2. When access_token expires → client sends refresh_token to get new pair
    3. Each refresh_token can only be used ONCE (rotation prevents theft)
    """
    
    @contextmanager
    def _get_db_session(self):
        from ..database import SessionLocal
        db = SessionLocal()
        try:
            yield db
            db.commit()
        except Exception:
            db.rollback()
            raise
        finally:
            db.close()
    
    def create_access_token(self, user_id: str, extra_data: dict = None) -> str:
        """Create a short-lived JWT access token."""
        import jwt
        
        payload = {
            "sub": user_id,
            "type": "access",
            "iat": datetime.utcnow(),
            "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
        }
        if extra_data:
            payload.update(extra_data)
        
        return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    
    def create_refresh_token(self, user_id: str) -> str:
        """
        Create a long-lived refresh token and store its hash in DB.
        The raw token is returned to the client; only the hash is stored.
        """
        from ..models import RefreshToken
        
        raw_token = secrets.token_urlsafe(64)
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        
        with self._get_db_session() as db:
            rt = RefreshToken(
                user_id=user_id,
                token_hash=token_hash,
                expires_at=datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
            )
            db.add(rt)
        
        return raw_token
    
    def refresh_tokens(self, refresh_token: str) -> Optional[Dict]:
        """
        Exchange a refresh token for a new access + refresh token pair.
        
        The old refresh token is revoked (one-time use) to prevent replay attacks.
        
        Returns:
            Dict with new access_token and refresh_token, or None if invalid
        """
        from ..models import RefreshToken
        
        token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
        
        with self._get_db_session() as db:
            rt = db.query(RefreshToken).filter(
                RefreshToken.token_hash == token_hash,
                RefreshToken.revoked == 0,
            ).first()
            
            if not rt:
                logger.warning("Refresh token not found or already revoked")
                return None
            
            if rt.expires_at < datetime.utcnow():
                logger.warning(f"Refresh token expired for user {rt.user_id}")
                rt.revoked = 1
                return None
            
            # Revoke the old token (one-time use)
            rt.revoked = 1
            rt.last_used_at = datetime.utcnow()
            
            user_id = rt.user_id
        
        # Generate new pair
        new_access = self.create_access_token(user_id)
        new_refresh = self.create_refresh_token(user_id)
        
        return {
            "access_token": new_access,
            "refresh_token": new_refresh,
            "token_type": "bearer",
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,  # seconds
        }
    
    def verify_access_token(self, token: str) -> Optional[Dict]:
        """Verify and decode an access token."""
        import jwt
        
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            if payload.get("type") != "access":
                return None
            return payload
        except jwt.ExpiredSignatureError:
            logger.debug("Access token expired")
            return None
        except jwt.InvalidTokenError as e:
            logger.warning(f"Invalid token: {e}")
            return None
    
    def revoke_all_tokens(self, user_id: str):
        """Revoke all refresh tokens for a user (e.g. on password change or logout-all)."""
        from ..models import RefreshToken
        
        with self._get_db_session() as db:
            db.query(RefreshToken).filter(
                RefreshToken.user_id == user_id,
                RefreshToken.revoked == 0,
            ).update({"revoked": 1})
    
    def cleanup_expired_tokens(self):
        """Remove expired/revoked tokens from DB (run periodically)."""
        from ..models import RefreshToken
        
        with self._get_db_session() as db:
            deleted = db.query(RefreshToken).filter(
                (RefreshToken.expires_at < datetime.utcnow()) |
                (RefreshToken.revoked == 1)
            ).delete(synchronize_session=False)
            logger.info(f"Cleaned up {deleted} expired/revoked refresh tokens")


# API Key rotation helper
def rotate_api_key(key_name: str) -> str:
    """
    Generate a new API key and log the rotation.
    
    In production, this should:
    1. Generate new key
    2. Update the environment/secrets manager
    3. Log the rotation in audit log
    
    Args:
        key_name: Name of the key to rotate (e.g. "PAYSTACK_SECRET_KEY")
    
    Returns:
        The new key value
    """
    new_key = secrets.token_urlsafe(48)
    logger.info(f"API key rotated: {key_name} (set new value in environment/secrets manager)")
    return new_key


# Singleton
auth_security = AuthSecurityService()
