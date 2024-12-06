from flask import Blueprint, request, jsonify, send_file
from service.suggestSmart import generate_image,generate_text
import base64
import io
from flask import request, jsonify
from PIL import Image
import requests
generate_ai = Blueprint('generate_ai', __name__)
@generate_ai.route('/api/suggest/generate-text', methods=['POST'])
def handle_generate_text():
    data = request.json
    prompt = data['prompt']
    if not prompt:
        return jsonify({"error": "No prompt provided"}), 400
    generated_text = generate_text(prompt)
    return jsonify({"generated_text": generated_text})
@generate_ai.route('/api/suggest/generate-image', methods=['POST'])
def handle_generate_image():
    data = request.json
    prompt = data['prompt']
    if not prompt:
        return jsonify({"error": "No prompt provided"}), 400
    image_bytes = generate_image(prompt)
    if image_bytes:
        img_base64 = base64.b64encode(image_bytes.getvalue()).decode('utf-8')
        return jsonify({"image": img_base64})
    else:
        return jsonify({"error": "Failed to generate image"}), 500