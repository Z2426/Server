from flask import Blueprint, request, jsonify
from service.content_model import check_sensitive_image, check_sensitive_text, classify_post
from googletrans import Translator
content_bp = Blueprint('content', __name__)
@content_bp.route('/translator', methods=['POST'])
def translate():
    # Get data from the JSON request
    data = request.get_json()
    # Check if the parameters src, dest, and text are provided
    src = data.get('src')
    dest = data.get('dest')
    text = data.get('text')
    if not src or not dest or not text:
        return jsonify({'error': 'Missing parameters. Please provide src, dest, and text.'}), 400
    try:
        translator = Translator()
        # Translate the text, passing the text parameter correctly
        result = translator.translate(text, src=src, dest=dest)
        # Return the translated result as JSON
        return jsonify({
            'original_text': text,
            'translated_text': result.text,
            'src_language': src,
            'dest_language': dest
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@content_bp.route('/check-post', methods=['POST'])
def check_post():
    # Get data from the JSON request
    data = request.json
    text_input = data.get('text')
    image_url = data.get('image_url')

    # Variable to store the result of the check
    result = {'sensitive': False}

    # Check text if provided
    if text_input:
        is_text_sensitive = check_sensitive_text(text_input)
        if is_text_sensitive:
            result['sensitive'] = True
            result['text'] = {'sensitive': True}
            return jsonify(result), 200  # Return the result immediately if the text is sensitive

        result['text'] = {'sensitive': False}

    # Check image if provided
    if image_url:
        is_image_sensitive, label = check_sensitive_image(image_url)
        if is_image_sensitive:
            result['sensitive'] = True
            result['image'] = {'sensitive': True, 'label': label}
            return jsonify(result), 200  # Return the result immediately if the image is sensitive

        result['image'] = {'sensitive': False}

    # If both fields are empty, return an error
    if not text_input and not image_url:
        return jsonify({'error': 'text or image_url is required'}), 400
    
    # Return the result of the check if no sensitive content is found
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
