import base64
import cv2
from deepface import DeepFace
from scipy.spatial.distance import cosine
from models.database import embeddings_collection, search_results_collection,users_collection
from utils.image_utils import align_faces
from bson import ObjectId
from mtcnn import MTCNN
import logging
def detect_person_using_mtcnn(image):
    detector = MTCNN()
    faces = detector.detect_faces(image) 
    return len(faces) > 0
def get_user_data(user_id):
    print(user_id)
    try:
        user_id = ObjectId(user_id)
    except Exception as e:
        print("Invalid user_id format:", e)
        return [], []
    user_data = users_collection.find_one({"_id": ObjectId(user_id)}, {"blockedUsers": 1, "friends": 1})
    if user_data:
        blocked_users = user_data.get("blockedUsers", [])
        friends = user_data.get("friends", [])
        print("Blocked Users:", blocked_users)
        print("Friends:", friends)
        return blocked_users, friends
    else:
        print("No user found with the provided user_id.")
        return [], []
from bson import ObjectId

def add_to_suggest_friends(user_id, user_ids_to_add):
    print(f"Fetching data for user_id: {user_id}")
    try:
        user_id = ObjectId(user_id)
    except Exception as e:
        print(f"Invalid user_id format: {e}")
        return {"error": "Invalid user_id format", "suggestFriends": []}
    user_data = users_collection.find_one({"_id": user_id}, {"suggestFriends": 1})
    if user_data:
        suggest_friends = user_data.get("suggestFriends", [])
        print(f"Current suggestFriends for user {user_id}: {suggest_friends}")
        suggest_friends_set = set([str(friend["_id"]) for friend in suggest_friends])
        updated_suggest_friends = []
        for user_id_to_add in user_ids_to_add:
            try:
                user_id_to_add = ObjectId(user_id_to_add)
            except Exception as e:
                print(f"Invalid user_id_to_add format: {user_id_to_add}. Error: {e}")
                continue  
            if str(user_id_to_add) not in suggest_friends_set:
                updated_suggest_friends.append({"_id": user_id_to_add})
                suggest_friends_set.add(str(user_id_to_add))


        updated_suggest_friends.extend(suggest_friends)
        updated_suggest_friends = [
            {"_id": str(friend["_id"])} for friend in updated_suggest_friends
        ]

        users_collection.update_one({"_id": user_id}, {"$set": {"suggestFriends": updated_suggest_friends}})

        print(f"Updated suggestFriends for user {user_id}: {updated_suggest_friends}")
        
        # Trả về kết quả với suggestFriends đã cập nhật
        return {"suggestFriends": updated_suggest_friends}

    else:
        print(f"No user found with the provided user_id: {user_id}")
        return {"error": "User not found", "suggestFriends": []}

def convert_image_to_base64(image):
    """Chuyển đổi numpy.ndarray thành chuỗi base64."""
    _, buffer = cv2.imencode('.jpg', image)
    return base64.b64encode(buffer).decode('utf-8')
def add_or_update_embedding(user_id, image):
    embedding = DeepFace.represent(image, model_name="Facenet", enforce_detection=False)[0]['embedding']
    existing_user = embeddings_collection.find_one({"user_id": user_id})
    if existing_user:
        embeddings_collection.update_one({"user_id": user_id}, {"$set": {"embedding": embedding}})
        return {"message": f"Updated embedding for user {user_id}."}
    else:
        embeddings_collection.insert_one({"user_id": user_id, "embedding": embedding})
        return {"message": f"Added embedding for user {user_id}."}
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
    base64_image = convert_image_to_base64(image)
    return detected_users
def suggest_friend_logic(current_user_id, image, threshold=0.6):
    detected_users = search_in_group(image, threshold)
    blocked_users, friends = get_user_data(current_user_id)
    potential_friends = [
        user_id for user_id in detected_users
        if user_id != current_user_id and user_id not in blocked_users and user_id not in friends
    ]
    add_to_suggest_friends(current_user_id,potential_friends)
    return potential_friends