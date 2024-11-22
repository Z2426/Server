import cv2
import numpy as np
from PIL import Image, ImageEnhance
from io import BytesIO
import requests

def load_image_from_url(url):
    try:
        response = requests.get(url)
        img = Image.open(BytesIO(response.content)).convert('RGB')
        img = ImageEnhance.Contrast(img).enhance(1.2)  # Increase contrast
        img = ImageEnhance.Brightness(img).enhance(1.1)  # Increase brightness
        img = np.array(img)
        return cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
    except Exception as e:
        print(f"Error loading image from URL: {e}")
        return None

def align_faces(image, detector):
    faces = detector.detect_faces(image)
    aligned_faces = []
    for face in faces:
        x, y, w, h = face['box']
        keypoints = face['keypoints']
        left_eye, right_eye = keypoints['left_eye'], keypoints['right_eye']

        angle = np.degrees(np.arctan2(right_eye[1] - left_eye[1], right_eye[0] - left_eye[0]))
        M = cv2.getRotationMatrix2D((x + w // 2, y + h // 2), angle, 1)
        rotated_image = cv2.warpAffine(image, M, (image.shape[1], image.shape[0]))

        face_img = rotated_image[y:y+h, x:x+w]
        aligned_faces.append(cv2.resize(face_img, (160, 160)))
    return aligned_faces
