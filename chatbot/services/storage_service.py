"""
Product Image Storage Service
TODO: Migrate to Azure Blob Storage for production image hosting.
Currently a placeholder — Supabase storage was removed since KOFA uses Azure.
"""
import os
import uuid
from typing import Optional, Tuple
import httpx
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


async def upload_product_image(
    product_id: str,
    file_bytes: bytes,
    filename: str,
    content_type: str = "image/jpeg"
) -> Tuple[bool, str, Optional[str]]:
    """
    Upload a product image.
    TODO: Implement Azure Blob Storage upload.
    """
    logger.warning("Image storage not configured — Azure Blob Storage integration needed")
    return False, "Image storage not yet configured (Azure Blob Storage pending)", None


async def delete_product_image(image_url: str) -> Tuple[bool, str]:
    """
    Delete a product image.
    TODO: Implement Azure Blob Storage delete.
    """
    logger.warning("Image storage not configured — cannot delete images")
    return False, "Image storage not yet configured"


async def ensure_bucket_exists() -> Tuple[bool, str]:
    """
    Ensure storage container exists.
    TODO: Implement Azure Blob Storage container setup.
    """
    return False, "Image storage not yet configured"
