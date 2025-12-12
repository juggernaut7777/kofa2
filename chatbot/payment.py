"""Payment integration with Naira Ramp."""
import sys
import os
from typing import Optional

# Add parent directory to path to import nairaramp utils
# Adjust path based on your project structure
sys.path.append(os.path.join(os.path.dirname(__file__), "../../nairaramp"))


class PaymentManager:
    """Manages payment link generation via Naira Ramp."""
    
    def __init__(self):
        """Initialize payment manager."""
        # For now, we'll use a simple mock implementation
        # In production, you would import and use the actual Naira Ramp utils
        pass
    
    def generate_payment_link(
        self,
        order_id: str,
        amount_ngn: int,
        customer_phone: str,
        description: str = "Order Payment"
    ) -> Optional[str]:
        """
        Generate a payment link for an order.
        
        Args:
            order_id: Unique order identifier
            amount_ngn: Amount in Nigerian Naira
            customer_phone: Customer's phone number
            description: Payment description
            
        Returns:
            Payment link URL or None if failed
        """
        try:
            # TODO: Integrate with actual Naira Ramp API
            # This is a placeholder implementation
            
            # For now, generate a mock payment link
            # In production, you would call the Naira Ramp API here
            # Example:
            # from utils import create_payment_link
            # return create_payment_link(
            #     amount=amount_ngn,
            #     reference=order_id,
            #     customer_phone=customer_phone,
            #     description=description
            # )
            
            # Mock implementation
            base_url = "https://payment.nairaramp.com/pay"
            payment_link = f"{base_url}?ref={order_id}&amount={amount_ngn}&phone={customer_phone}"
            
            return payment_link
            
        except Exception as e:
            print(f"Error generating payment link: {e}")
            return None
    
    def verify_payment(self, payment_ref: str) -> bool:
        """
        Verify if a payment has been completed.
        
        Args:
            payment_ref: Payment reference to verify
            
        Returns:
            True if payment is verified, False otherwise
        """
        try:
            # TODO: Implement actual payment verification
            # This would call the Naira Ramp API to check payment status
            
            # Mock implementation
            return True
            
        except Exception as e:
            print(f"Error verifying payment: {e}")
            return False
    
    def format_naira(self, amount: int) -> str:
        """
        Format an amount in Naira with proper thousand separators.
        
        Args:
            amount: Amount in Naira (integer)
            
        Returns:
            Formatted string (e.g., "₦15,000")
        """
        return f"₦{amount:,}"
