from flask import Blueprint, request, jsonify
from service.handleFindUser import add_or_update_embedding, search_in_group,get_user_data,detect_person_using_mtcnn,suggest_friend_logic
from utils.image_utils import load_image_from_url
user_blueprint = Blueprint('user', __name__)
@user_blueprint.route('/detect_person', methods=['POST'])
def detect_person():
    data = request.json
    image_url = data['image_url']
    image = load_image_from_url(image_url)
    if image is not None:
        has_person = detect_person_using_mtcnn(image)
        if has_person:
            return jsonify({"message": "Ảnh có người."}), 200
        else:
            return jsonify({"message": "Ảnh không có người."}), 200
    else:
        return jsonify({"error": "Could not load image."}), 400
@user_blueprint.route('/suggest_friend_by_image', methods=['POST'])
def suggest_friend_by_image():
    data = request.json
    current_user_id = data['userId'] 
    image_url = data['image_url']  
    threshold = data.get('threshold', 0.6) 
    image = load_image_from_url(image_url)
    if image is None:
        return {"error": "Could not load image."}, 400
    result, status_code = suggest_friend_logic(current_user_id, image, threshold)
    return jsonify(result), status_code
@user_blueprint.route('/add_embedding_2', methods=['POST'])
def add_embedding():
    data = request.json
    user_id = data['user_id']
    image_url = data['image_url']
    image = load_image_from_url(image_url)
    if image is not None:
        response = add_or_update_embedding(user_id, image)
        return jsonify(response), 200
    else:
        return jsonify({"error": "Could not load image."}), 400
@user_blueprint.route('/search_in_group', methods=['POST'])
def search_group():
    data = request.json
    image_url = data['image_url']
    threshold = data.get('threshold', 0.6)
    image = load_image_from_url(image_url)
    if image is not None:
        detected_users = search_in_group(image, threshold)
        return jsonify({"detected_users": detected_users}), 200
    else:
        return jsonify({"error": "Could not load group image."}), 400
