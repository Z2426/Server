from pymongo import MongoClient
from dotenv import load_dotenv
import os
# Load environment variables from .env file
load_dotenv()
# Get MongoDB credentials from environment variables
MONGO_USERNAME = os.getenv("MONGO_USERNAME")
MONGO_PASSWORD = os.getenv("MONGO_PASSWORD")
MONGO_DATABASE = os.getenv("MONGO_DATABASE")
MONGO_CLUSTER = os.getenv("MONGO_CLUSTER")
# Construct the MongoDB connection URL
if None in [MONGO_USERNAME, MONGO_PASSWORD, MONGO_DATABASE, MONGO_CLUSTER]:
    raise ValueError("One or more MongoDB environment variables are missing.")
mongo_url = f"mongodb+srv://{MONGO_USERNAME}:{MONGO_PASSWORD}@{MONGO_CLUSTER}/{MONGO_DATABASE}?retryWrites=true&w=majority"
# Connect to the MongoDB cluster
client = MongoClient(mongo_url)
# Connect to the MongoDB cluster
client = MongoClient(mongo_url)
db = client[MONGO_DATABASE]
embeddings_collection = db['embeddings']
search_results_collection = db['search_results']
users_collection = db['users']
