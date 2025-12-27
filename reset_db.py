from chatbot.database import engine, Base
from chatbot.models import User, Product, Order, OrderItem
import logging

logging.basicConfig()
logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)

print("--- DROPPING ALL TABLES ---")
Base.metadata.drop_all(bind=engine)
print("--- CREATING ALL TABLES ---")
Base.metadata.create_all(bind=engine)
print("--- DATABASE RESET COMPLETE ---")

