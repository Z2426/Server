import base64
import cv2
from deepface import DeepFace
from scipy.spatial.distance import cosine
from models.database import embeddings_collection, search_results_collection,users_collection
from utils.image_utils import align_faces
from bson import ObjectId
from mtcnn import MTCNN

def detect_person_using_mtcnn(image):
    detector = MTCNN()
    faces = detector.detect_faces(image) 
    return len(faces) > 0
def get_user_data(user_id):
    print(user_id)
    # Make sure to convert user_id to ObjectId
    try:
        user_id = ObjectId(user_id)
    except Exception as e:
        print("Invalid user_id format:", e)
        return [], []
    # Query to fetch user data from the Users collection based on the _id field
    #user_data = users_collection.find_one({"_id": user_id}, {"blockedUsers": 1, "friends": 1})\
    user_data = users_collection.find_one({"_id": ObjectId(user_id)}, {"blockedUsers": 1, "friends": 1})
    #user_data=db.Users.find({ "_id": ObjectId("671d17af94cbf607726ed92f") }, { "blockedUsers": 1, "friends": 1 });
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

    # Kiểm tra định dạng user_id
    try:
        user_id = ObjectId(user_id)
    except Exception as e:
        print(f"Invalid user_id format: {e}")
        return {"error": "Invalid user_id format", "suggestFriends": []}

    # Truy vấn cơ sở dữ liệu để lấy danh sách suggestFriends cho user
    user_data = users_collection.find_one({"_id": user_id}, {"suggestFriends": 1})

    if user_data:
        suggest_friends = user_data.get("suggestFriends", [])
        print(f"Current suggestFriends for user {user_id}: {suggest_friends}")
        
        # Duy trì set các ID bạn bè đã có trong danh sách suggestFriends
        suggest_friends_set = set([str(friend["_id"]) for friend in suggest_friends])
        updated_suggest_friends = []

        # Thêm các user_id mới vào đầu danh sách và đảm bảo không có trùng
        for user_id_to_add in user_ids_to_add:
            # Kiểm tra user_id_to_add có phải ObjectId hợp lệ hay không
            try:
                user_id_to_add = ObjectId(user_id_to_add)
            except Exception as e:
                print(f"Invalid user_id_to_add format: {user_id_to_add}. Error: {e}")
                continue  # Bỏ qua ID không hợp lệ

            # Thêm vào danh sách nếu chưa có trong suggestFriends
            if str(user_id_to_add) not in suggest_friends_set:
                updated_suggest_friends.append({"_id": user_id_to_add})
                suggest_friends_set.add(str(user_id_to_add))  # Thêm vào set để tránh trùng

        # Thêm danh sách suggestFriends cũ vào sau các ID mới
        updated_suggest_friends.extend(suggest_friends)

        # Chuyển ObjectId thành chuỗi trước khi trả về
        updated_suggest_friends = [
            {"_id": str(friend["_id"])} for friend in updated_suggest_friends
        ]

        # Cập nhật lại danh sách suggestFriends vào cơ sở dữ liệu nếu cần thiết
        # users_collection.update_one({"_id": user_id}, {"$set": {"suggestFriends": updated_suggest_friends}})

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
    # Tính toán embedding cho hình ảnh
    embedding = DeepFace.represent(image, model_name="Facenet", enforce_detection=False)[0]['embedding']
    existing_user = embeddings_collection.find_one({"user_id": user_id})
    if existing_user:
        # Cập nhật embedding của người dùng
        embeddings_collection.update_one({"user_id": user_id}, {"$set": {"embedding": embedding}})
        return {"message": f"Updated embedding for user {user_id}."}
    else:
        # Thêm mới embedding của người dùng
        embeddings_collection.insert_one({"user_id": user_id, "embedding": embedding})
        return {"message": f"Added embedding for user {user_id}."}
def search_in_group(image, threshold):
    detector = MTCNN()
    aligned_faces = align_faces(image, detector)
    detected_users = []
    for face in aligned_faces:
        # Tính toán embedding cho từng khuôn mặt đã căn chỉnh
        face_embedding = DeepFace.represent(face, model_name="Facenet", enforce_detection=False)[0]['embedding']
        for user in embeddings_collection.find():
            # Tính toán độ tương đồng cosine
            similarity = 1 - cosine(face_embedding, user['embedding'])
            if similarity >= threshold:
                detected_users.append(user['user_id'])

    # Chuyển đổi hình ảnh sang base64 trước khi lưu
    base64_image = convert_image_to_base64(image)
    # Lưu kết quả tìm kiếm vào MongoDB
    search_results_collection.insert_one({
        "group_image": base64_image,
        "detected_users": detected_users
    })
    
    return detected_users
def suggest_friend_logic(current_user_id, image, threshold=0.6):
    # Tìm kiếm những người dùng trong ảnh
    detected_users = search_in_group(image, threshold)
    
    # Lấy dữ liệu của người dùng hiện tại (bạn bè và người bị chặn)
    blocked_users, friends = get_user_data(current_user_id)
    
    # Lọc ra những người dùng có thể kết bạn (chưa bị chặn và chưa là bạn bè)
    potential_friends = [
        user_id for user_id in detected_users
        if user_id != current_user_id and user_id not in blocked_users and user_id not in friends
    ]
    message = add_to_suggest_friends(current_user_id,potential_friends)
    return {"suggested_friends": message}, 200