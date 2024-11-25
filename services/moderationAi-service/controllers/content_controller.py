from flask import Blueprint, request, jsonify
from service.content_model import check_sensitive_image, check_sensitive_text,classify_post

content_bp = Blueprint('content', __name__)
@content_bp.route('/check-post', methods=['POST'])
def check_post():
    # Lấy dữ liệu từ request JSON
    data = request.json
    text_input = data.get('text')
    image_url = data.get('image_url')

    # Biến lưu kết quả kiểm duyệt
    result = {'sensitive': False}

    # Kiểm tra văn bản nếu có
    if text_input:
        is_text_sensitive = check_sensitive_text(text_input)
        if is_text_sensitive:
            result['sensitive'] = True
            result['text'] = {'sensitive': True}
            return jsonify(result), 200  # Trả về kết quả ngay lập tức nếu văn bản nhạy cảm

        result['text'] = {'sensitive': False}

    # Kiểm tra hình ảnh nếu có
    if image_url:
        is_image_sensitive, label = check_sensitive_image(image_url)
        if is_image_sensitive:
            result['sensitive'] = True
            result['image'] = {'sensitive': True, 'label': label}
            return jsonify(result), 200  # Trả về kết quả ngay lập tức nếu hình ảnh nhạy cảm

        result['image'] = {'sensitive': False}

    # Nếu cả hai trường đều trống, trả về lỗi
    if not text_input and not image_url:
        return jsonify({'error': 'text or image_url is required'}), 400
    
    # Trả về kết quả kiểm duyệt nếu không có nội dung nhạy cảm
    return jsonify(result), 200

@content_bp.route('/check-image', methods=['POST'])
def check_image():
    data = request.json
    image_url = data.get('image_url')

    if not image_url:
        return jsonify({'error': 'image_url is required'}), 400

    is_sensitive, label = check_sensitive_image(image_url)
    if is_sensitive:
        return jsonify({'sensitive': True, 'label': label}), 200
    else:
        return jsonify({'sensitive': False}), 200

@content_bp.route('/check-text', methods=['POST'])
def check_text():
    data = request.json
    text_input = data.get('text')

    if not text_input:
        return jsonify({'error': 'text is required'}), 400

    is_sensitive = check_sensitive_text(text_input)
    if is_sensitive:
        return jsonify({'sensitive': True}), 200
    else:
        return jsonify({'sensitive': False}), 200

@content_bp.route('/classify-post', methods=['POST'])
def classify_post_endpoint():
    data = request.json
    text_content = data.get('text')  # Text content to classify
    image_url = data.get('image_url')  # Image URL to classify

    # Ensure at least one input (text or image URL) is provided
    if not text_content and not image_url:
        return jsonify({'error': 'Either text or image_url is required'}), 400

    # Call the classify_post function with provided text and/or image URL
    result = classify_post(text_content=text_content, image_url=image_url)

    # Handle any errors that occur during classification
    if "error" in result:
        return jsonify({'error': result["error"]}), 500

    # Return the classification result with the predicted topic and scores
    return jsonify({
        'predicted_topic': result["predicted_topic"],
        'text_score': result["text_score"],
        'image_score': result["image_score"]
    }), 200
