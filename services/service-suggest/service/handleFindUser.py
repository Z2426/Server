import base64
import cv2
from deepface import DeepFace
from scipy.spatial.distance import cosine
from models.database import embeddings_collection, search_results_collection, users_collection
from utils.image_utils import align_faces
from bson import ObjectId
from mtcnn import MTCNN

# Set up logging
import logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Detect if there is any face in the image using MTCNN
def detect_person_using_mtcnn(image):
    detector = MTCNN()
    faces = detector.detect_faces(image)
    return len(faces) > 0

# Get the blocked users and friends of a given user
def get_user_data(user_id):
    try:
        user_id = ObjectId(user_id)
    except Exception as e:
        return [], []
    user_data = users_collection.find_one({"_id": ObjectId(user_id)}, {"blockedUsers": 1, "friends": 1})
    if user_data:
        blocked_users = user_data.get("blockedUsers", [])
        friends = user_data.get("friends", [])
        return blocked_users, friends
    else:
        return [], []

def add_to_suggest_friends(user_id, user_ids_to_add):
    try:
        user_id = ObjectId(user_id)
    except Exception as e:
        return {"error": "Invalid user_id format", "suggestFriends": []}
    
    user_data = users_collection.find_one({"_id": user_id}, {"suggestFriends": 1})
    if user_data:
        suggest_friends = user_data.get("suggestFriends", [])
        suggest_friends_set = set([str(friend) for friend in suggest_friends])  
        updated_suggest_friends = []
        
        for user_id_to_add in user_ids_to_add:
            try:
                user_id_to_add = ObjectId(user_id_to_add)
            except Exception as e:
                continue  
            
            if str(user_id_to_add) not in suggest_friends_set:
                updated_suggest_friends.append(user_id_to_add) 
                suggest_friends_set.add(str(user_id_to_add))

        updated_suggest_friends.extend(suggest_friends)
        users_collection.update_one({"_id": user_id}, {"$set": {"suggestfriends": updated_suggest_friends}})
        return {"suggestFriends": updated_suggest_friends}
    else:
        return {"error": "User not found", "suggestFriends": []}
# Convert image (numpy.ndarray) to base64 string
def convert_image_to_base64(image):
    """Convert numpy.ndarray to base64 string."""
    _, buffer = cv2.imencode('.jpg', image)
    return base64.b64encode(buffer).decode('utf-8')

# Add or update the embedding for a user in the database
def add_or_update_embedding(user_id, image):
    embedding = DeepFace.represent(image, model_name="Facenet", enforce_detection=False)[0]['embedding']
    existing_user = embeddings_collection.find_one({"user_id": user_id})
    if existing_user:
        embeddings_collection.update_one({"user_id": user_id}, {"$set": {"embedding": embedding}})
        return {"message": f"Updated embedding for user {user_id}."}
    else:
        embeddings_collection.insert_one({"user_id": user_id, "embedding": embedding})
        return {"message": f"Added embedding for user {user_id}."}

# Search for users in a group that are similar to the detected face
def search_in_group(image, threshold):
    detector = MTCNN()
    aligned_faces = align_faces(image, detector)
    detected_users = []
    for face in aligned_faces:
        face_embedding = DeepFace.represent(face, model_name="Facenet", enforce_detection=False)[0]['embedding']
        
        for user in embeddings_collection.find():
            similarity = 1 - cosine(face_embedding, user['embedding'])
            if similarity >= threshold:
                detected_users.append(user['user_id'])
    # Convert the image to base64 for further processing if needed
    base64_image = convert_image_to_base64(image)
    return detected_users

# Suggest friends based on detected users and avoid blocked/friends users
def suggest_friend_logic(current_user_id, image, threshold=0.6):
    detected_users = search_in_group(image, threshold)
    blocked_users, friends = get_user_data(current_user_id)
    # Filter out blocked and already friends users from the detected list
    potential_friends = [
        user_id for user_id in detected_users
        if user_id != current_user_id and user_id not in blocked_users and user_id not in friends
    ]  
    # Add the potential friends to the user's suggestion list
    add_to_suggest_friends(current_user_id, potential_friends)  
    return potential_friends
