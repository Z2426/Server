from flask import Blueprint, request, jsonify, send_file
from service.suggestSmart import generate_image,generate_text

# Tạo blueprint
generate_ai = Blueprint('generate_ai', __name__)
# Controller: Xử lý request API
@generate_ai.route('/generate-text', methods=['POST'])
def handle_generate_text():
    data = request.json
    prompt = data['prompt']
    if not prompt:
        return jsonify({"error": "No prompt provided"}), 400
    # Gọi hàm xử lý sinh văn bản
    generated_text = generate_text(prompt)
    return jsonify({"generated_text": generated_text})
# Route xử lý yêu cầu tạo ảnh từ text
@generate_ai.route('/generate-image', methods=['POST'])
def handle_generate_image():
    data = request.json
    prompt = data['prompt']
    if not prompt:
        return jsonify({"error": "No prompt provided"}), 400
    # Gọi hàm xử lý AI từ service
    image_bytes = generate_image(prompt)
    if image_bytes:
        return send_file(image_bytes, mimetype='image/png')
    else:
        return jsonify({"error": "Failed to generate image"}), 500
