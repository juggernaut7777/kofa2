from chatbot.database import engine
from chatbot.models import Base, User, Product, Order, OrderItem
import logging

logging.basicConfig()
logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)

print("--- DROPPING ALL TABLES ---")
Base.metadata.drop_all(bind=engine)
print("--- CREATING ALL TABLES ---")
Base.metadata.create_all(bind=engine)
print("--- DATABASE RESET COMPLETE ---")

