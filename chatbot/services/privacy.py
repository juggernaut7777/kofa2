"""
KOFA Privacy & NDPR Compliance Service
Handles user consent, data handling, and Nigerian Data Protection Regulation compliance.
"""
import os
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)


class ConsentType(str, Enum):
    """Types of consent for NDPR compliance."""
    VOICE_TRANSCRIPTION = "voice_transcription"
    DATA_PROCESSING = "data_processing"
    MARKETING = "marketing"
    ANALYTICS = "analytics"
    THIRD_PARTY_SHARING = "third_party_sharing"


class ConsentRecord(BaseModel):
    """Record of user consent."""
    customer_phone: str
    vendor_id: str
    consent_type: ConsentType
    granted: bool
    granted_at: Optional[str] = None
    revoked_at: Optional[str] = None
    ip_address: Optional[str] = None
    consent_text: str = ""


class DataRetentionPolicy(BaseModel):
    """Data retention rules per data type."""
    data_type: str
    retention_days: int
    anonymize_on_delete: bool = True
    description: str


class PrivacyService:
    """
    NDPR Compliance Manager for KOFA.
    
    Key NDPR Requirements:
    1. Lawful processing - obtain consent before processing personal data
    2. Purpose limitation - only use data for stated purposes
    3. Data minimization - collect only necessary data
    4. Accuracy - keep data accurate and up to date
    5. Storage limitation - don't keep data longer than necessary
    6. Security - protect data from unauthorized access
    7. Accountability - demonstrate compliance
    """
    
    def __init__(self):
        # In production, store in Supabase
        self._consents: Dict[str, Dict[ConsentType, ConsentRecord]] = {}
        self._data_requests: List[Dict[str, Any]] = []
        
        # Define retention policies
        self.retention_policies = {
            "voice_recordings": DataRetentionPolicy(
                data_type="voice_recordings",
                retention_days=7,  # Delete after 7 days
                anonymize_on_delete=True,
                description="Voice notes are transcribed and deleted within 7 days"
            ),
            "customer_data": DataRetentionPolicy(
                data_type="customer_data",
                retention_days=365,
                anonymize_on_delete=True,
                description="Customer order history retained for 1 year"
            ),
            "chat_logs": DataRetentionPolicy(
                data_type="chat_logs",
                retention_days=90,
                anonymize_on_delete=False,
                description="Chat logs retained for 90 days"
            ),
            "analytics_data": DataRetentionPolicy(
                data_type="analytics_data",
                retention_days=730,  # 2 years
                anonymize_on_delete=True,
                description="Anonymized analytics kept for 2 years"
            )
        }
    
    def get_consent_key(self, customer_phone: str, vendor_id: str) -> str:
        """Generate unique key for consent storage."""
        return f"{vendor_id}:{customer_phone}"
    
    def has_consent(
        self, 
        customer_phone: str, 
        vendor_id: str, 
        consent_type: ConsentType
    ) -> bool:
        """
        Check if customer has given consent for a specific purpose.
        
        Args:
            customer_phone: Customer's phone number
            vendor_id: Vendor identifier
            consent_type: Type of consent to check
            
        Returns:
            True if consent is granted and not revoked
        """
        key = self.get_consent_key(customer_phone, vendor_id)
        
        if key not in self._consents:
            return False
        
        consent = self._consents[key].get(consent_type)
        
        if not consent:
            return False
        
        return consent.granted and consent.revoked_at is None
    
    def record_consent(
        self,
        customer_phone: str,
        vendor_id: str,
        consent_type: ConsentType,
        granted: bool,
        ip_address: Optional[str] = None
    ) -> ConsentRecord:
        """
        Record customer consent.
        
        Args:
            customer_phone: Customer's phone number
            vendor_id: Vendor identifier
            consent_type: Type of consent
            granted: Whether consent is granted
            ip_address: Optional IP for audit
            
        Returns:
            ConsentRecord object
        """
        key = self.get_consent_key(customer_phone, vendor_id)
        
        consent_texts = {
            ConsentType.VOICE_TRANSCRIPTION: 
                "I consent to having my voice messages transcribed by AI to process my orders.",
            ConsentType.DATA_PROCESSING: 
                "I consent to the processing of my personal data for order fulfillment.",
            ConsentType.MARKETING: 
                "I consent to receiving marketing messages about products and offers.",
            ConsentType.ANALYTICS: 
                "I consent to anonymized analytics about my shopping behavior.",
            ConsentType.THIRD_PARTY_SHARING: 
                "I consent to sharing my data with delivery partners for order fulfillment."
        }
        
        record = ConsentRecord(
            customer_phone=customer_phone,
            vendor_id=vendor_id,
            consent_type=consent_type,
            granted=granted,
            granted_at=datetime.now().isoformat() if granted else None,
            ip_address=ip_address,
            consent_text=consent_texts.get(consent_type, "")
        )
        
        if key not in self._consents:
            self._consents[key] = {}
        
        self._consents[key][consent_type] = record
        
        logger.info(f"Consent recorded: {consent_type.value} = {granted} for {customer_phone}")
        return record
    
    def revoke_consent(
        self,
        customer_phone: str,
        vendor_id: str,
        consent_type: ConsentType
    ) -> bool:
        """
        Revoke previously granted consent.
        
        Returns:
            True if consent was revoked
        """
        key = self.get_consent_key(customer_phone, vendor_id)
        
        if key not in self._consents:
            return False
        
        consent = self._consents[key].get(consent_type)
        
        if not consent:
            return False
        
        consent.granted = False
        consent.revoked_at = datetime.now().isoformat()
        
        logger.info(f"Consent revoked: {consent_type.value} for {customer_phone}")
        return True
    
    def get_all_consents(
        self, 
        customer_phone: str, 
        vendor_id: str
    ) -> Dict[ConsentType, ConsentRecord]:
        """Get all consent records for a customer."""
        key = self.get_consent_key(customer_phone, vendor_id)
        return self._consents.get(key, {})
    
    def request_data_deletion(
        self,
        customer_phone: str,
        vendor_id: str,
        reason: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Process a data deletion request (Right to Erasure under NDPR).
        
        Returns:
            Request status and reference number
        """
        request_id = f"DEL-{datetime.now().strftime('%Y%m%d%H%M%S')}-{customer_phone[-4:]}"
        
        request = {
            "request_id": request_id,
            "customer_phone": customer_phone,
            "vendor_id": vendor_id,
            "reason": reason,
            "requested_at": datetime.now().isoformat(),
            "status": "pending",
            "estimated_completion": (datetime.now()).isoformat()
        }
        
        self._data_requests.append(request)
        
        # In production: Queue for processing, notify vendor
        logger.info(f"Data deletion request created: {request_id}")
        
        return {
            "request_id": request_id,
            "status": "pending",
            "message": "Your data deletion request has been received. It will be processed within 30 days as required by NDPR."
        }
    
    def request_data_export(
        self,
        customer_phone: str,
        vendor_id: str
    ) -> Dict[str, Any]:
        """
        Process a data portability request (Right to Data Portability under NDPR).
        
        Returns:
            Request status and download info
        """
        request_id = f"EXP-{datetime.now().strftime('%Y%m%d%H%M%S')}-{customer_phone[-4:]}"
        
        # In production: Generate JSON export of all customer data
        return {
            "request_id": request_id,
            "status": "processing",
            "message": "Your data export is being prepared. You will receive a download link within 24 hours.",
            "data_types_included": [
                "Order history",
                "Chat messages",
                "Consent records",
                "Account information"
            ]
        }
    
    def get_privacy_policy_url(self) -> str:
        """Get URL to KOFA privacy policy."""
        return "https://kofa.ng/privacy"
    
    def get_consent_prompt(self, consent_type: ConsentType, language: str = "en") -> str:
        """
        Get the consent prompt text in the user's language.
        
        Args:
            consent_type: Type of consent
            language: Language code (en, pid, ha, ig, yo)
        """
        prompts = {
            ConsentType.VOICE_TRANSCRIPTION: {
                "en": "Can I transcribe your voice messages to understand your orders better? Reply YES to agree.",
                "pid": "Make I convert your voice note to text so I fit understand wetin you wan buy? Reply YES if e dey okay.",
                "ha": "Zan iya canza saƙon murya zuwa rubutu don in fahimci odar ku? Amsa EE don yarda.",
                "ig": "Enwere m ike ịdekọ ozi olu gị ka m ghọta order gị nke ọma? Zaa EE ka ị kwenyere.",
                "yo": "Ṣe mo le yi ifiranṣẹ ohùn rẹ pada si ọrọ lati le ye aṣẹ rẹ dara? Dahun BEENI lati gba."
            },
            ConsentType.DATA_PROCESSING: {
                "en": "By continuing, you agree to our data processing for order fulfillment.",
                "pid": "If you continue, e mean say you gree make we use your info deliver your order.",
                "ha": "Ta hanyar ci gaba, kuna amincewa da sarrafa bayanan ku don cika oda.",
                "ig": "Site n'ịga n'ihu, ị kwenyere na nhazi data anyị maka imejupụta order.",
                "yo": "Nipa lilọ siwaju, o gba pe a le lo data rẹ fun ṣiṣe aṣẹ."
            }
        }
        
        consent_prompts = prompts.get(consent_type, {})
        return consent_prompts.get(language, consent_prompts.get("en", ""))
    
    def get_retention_policy(self, data_type: str) -> Optional[DataRetentionPolicy]:
        """Get data retention policy for a specific data type."""
        return self.retention_policies.get(data_type)


# Singleton instance
privacy_service = PrivacyService()
