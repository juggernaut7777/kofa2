"""
Audit Log Service for KOFA
Records every important action: who changed what, when.
Provides accountability and compliance tracking.
"""
import json
import logging
from typing import Optional, List, Dict
from datetime import datetime
from contextlib import contextmanager

logger = logging.getLogger(__name__)


class AuditService:
    """
    Records all vendor actions for accountability.
    Every product change, order update, settings change is logged.
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
    
    def log_action(
        self,
        user_id: str,
        action: str,
        entity_type: str,
        entity_id: str = None,
        details: dict = None,
        ip_address: str = None,
    ):
        """
        Record an action in the audit log.
        
        Args:
            user_id: Who performed the action
            action: What was done (e.g. "product.create", "order.update", "settings.change")
            entity_type: Type of entity affected ("product", "order", "expense", "settings")
            entity_id: ID of the affected entity
            details: Dict with before/after values or additional context
            ip_address: Client IP if available
        """
        from ..models import AuditLog
        
        try:
            with self._get_db_session() as db:
                log_entry = AuditLog(
                    user_id=user_id,
                    action=action,
                    entity_type=entity_type,
                    entity_id=entity_id,
                    details=json.dumps(details) if details else None,
                    ip_address=ip_address,
                )
                db.add(log_entry)
                logger.debug(f"Audit: {user_id} → {action} on {entity_type}/{entity_id}")
        except Exception as e:
            logger.error(f"Audit log failed: {e}")
    
    def get_logs(
        self,
        user_id: str,
        entity_type: str = None,
        limit: int = 50,
    ) -> List[Dict]:
        """Get audit logs for a vendor, optionally filtered by entity type."""
        from ..models import AuditLog
        from sqlalchemy import desc
        
        with self._get_db_session() as db:
            query = db.query(AuditLog).filter(AuditLog.user_id == user_id)
            
            if entity_type:
                query = query.filter(AuditLog.entity_type == entity_type)
            
            logs = query.order_by(desc(AuditLog.created_at)).limit(limit).all()
            
            return [
                {
                    "id": str(log.id),
                    "action": log.action,
                    "entity_type": log.entity_type,
                    "entity_id": str(log.entity_id) if log.entity_id else None,
                    "details": json.loads(log.details) if log.details else None,
                    "ip_address": log.ip_address,
                    "created_at": log.created_at.isoformat() if log.created_at else None,
                }
                for log in logs
            ]


# Singleton
audit_service = AuditService()
