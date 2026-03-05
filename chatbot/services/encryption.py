"""
Data Encryption Service for KOFA
Encrypts sensitive fields at rest in the database.
Uses Fernet symmetric encryption (AES-128-CBC).
"""
import os
import base64
import logging
from typing import Optional
from cryptography.fernet import Fernet

logger = logging.getLogger(__name__)

# Encryption key from environment (generate once, store securely)
# Generate with: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
ENCRYPTION_KEY = os.getenv("KOFA_ENCRYPTION_KEY", "")


def _get_fernet() -> Optional[Fernet]:
    """Get Fernet cipher instance."""
    if not ENCRYPTION_KEY:
        logger.warning("KOFA_ENCRYPTION_KEY not set — encryption disabled")
        return None
    try:
        return Fernet(ENCRYPTION_KEY.encode() if isinstance(ENCRYPTION_KEY, str) else ENCRYPTION_KEY)
    except Exception as e:
        logger.error(f"Invalid encryption key: {e}")
        return None


def encrypt_field(plaintext: str) -> str:
    """
    Encrypt a sensitive field value for storage.
    
    If encryption is not configured, returns the plaintext with a prefix
    so we know it's not encrypted (for dev environments).
    
    Args:
        plaintext: The sensitive value to encrypt
    
    Returns:
        Encrypted string (base64-encoded)
    """
    if not plaintext:
        return ""
    
    fernet = _get_fernet()
    if not fernet:
        return f"PLAIN:{plaintext}"
    
    encrypted = fernet.encrypt(plaintext.encode())
    return f"ENC:{encrypted.decode()}"


def decrypt_field(ciphertext: str) -> str:
    """
    Decrypt a field value from storage.
    
    Handles both encrypted and unencrypted values gracefully.
    
    Args:
        ciphertext: The encrypted (or plain) value
    
    Returns:
        Decrypted plaintext
    """
    if not ciphertext:
        return ""
    
    # Handle unencrypted values
    if ciphertext.startswith("PLAIN:"):
        return ciphertext[6:]
    
    if not ciphertext.startswith("ENC:"):
        return ciphertext  # Legacy unencrypted value
    
    fernet = _get_fernet()
    if not fernet:
        logger.warning("Cannot decrypt — encryption key not available")
        return "[ENCRYPTED]"
    
    try:
        encrypted_data = ciphertext[4:].encode()
        return fernet.decrypt(encrypted_data).decode()
    except Exception as e:
        logger.error(f"Decryption failed: {e}")
        return "[DECRYPTION_ERROR]"


def encrypt_bank_details(bank_name: str, account_number: str, account_name: str) -> dict:
    """Encrypt all bank-related fields."""
    return {
        "bank_name": encrypt_field(bank_name),
        "bank_account_number": encrypt_field(account_number),
        "bank_account_name": encrypt_field(account_name),
    }


def decrypt_bank_details(encrypted: dict) -> dict:
    """Decrypt all bank-related fields."""
    return {
        "bank_name": decrypt_field(encrypted.get("bank_name", "")),
        "bank_account_number": decrypt_field(encrypted.get("bank_account_number", "")),
        "bank_account_name": decrypt_field(encrypted.get("bank_account_name", "")),
    }


# Sensitive fields that should be encrypted in the database
SENSITIVE_FIELDS = [
    "bank_account_number",
    "bank_account_name",
    "bank_name",
    "password_hash",  # Already hashed, but extra layer
]
