from chatbot.database import SessionLocal
from chatbot.models import User
import uuid

# Create a database session
db = SessionLocal()

try:
    # Check if user already exists
    existing_user = db.query(User).filter(User.id == '00000000-0000-0000-0000-000000000001').first()
    
    if existing_user:
        print("Admin user already exists!")
        print(f"Phone: {existing_user.phone}")
        print(f"Email: {existing_user.email}")
        print(f"Business Name: {existing_user.business_name}")
    else:
        # Create new admin user with the specified UUID
        admin_user = User(
            id='00000000-0000-0000-0000-000000000001',
            phone='+2340000000001',  # Required field
            email='admin@kofa.com',
            business_name='KOFA Admin',
            business_address='Admin Address',
            payment_method='bank_transfer',
            bot_style='corporate',
            is_active=1
        )
        
        db.add(admin_user)
        db.commit()
        print("Admin user created successfully!")
        print(f"ID: {admin_user.id}")
        print(f"Phone: {admin_user.phone}")
        print(f"Email: {admin_user.email}")
        print(f"Business Name: {admin_user.business_name}")
        
except Exception as e:
    db.rollback()
    print(f"Error creating admin user: {e}")
    raise
finally:
    db.close()

