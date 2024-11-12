# Import các thư viện cần thiết
import requests
from PIL import Image, UnidentifiedImageError
from io import BytesIO
import torch
from transformers import CLIPProcessor, CLIPModel, AutoTokenizer, AutoModel
from sklearn.metrics.pairwise import cosine_similarity

# Tải mô hình CLIP
clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch16")
clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch16")

# Tải mô hình và tokenizer cho văn bản
tokenizer = AutoTokenizer.from_pretrained("vinai/phobert-base")
text_model = AutoModel.from_pretrained("vinai/phobert-base")
#danh sach nhan nhay cam
sensitive_labels = [
    "toxic", "nudity", "violence", "horror", "blood", "gore", "murder", 
    "assault", "abuse", "self-harm", "slasher", "disturbing", "graphic", "cruelty", 
    "hate", "terrorism", "suicide", "death", "rape", "torture", "war", "execution",
    "drugs", "child abuse", "weapon", "stabbing", "shooting", "massacre", "genocide", 
    "animal cruelty", "domestic violence", "bullying", "abortion", "explosion", "poison",
    "addiction", "gang violence", "extremism", "hostage", "harassment", "racism", 
    "sex trafficking", "human trafficking", "human rights violations", "sexually explicit", 
    "extreme violence", "sexual abuse", "brutality", "crimes against humanity", "child pornography"
]
def load_image(image_url):
    try:
        response = requests.get(image_url)
        response.raise_for_status()

        if 'image' not in response.headers['Content-Type']:
            return None

        img = Image.open(BytesIO(response.content)).convert("RGB")
        return img

    except (requests.exceptions.HTTPError, requests.exceptions.ConnectionError,
            requests.exceptions.Timeout, requests.exceptions.RequestException,
            UnidentifiedImageError) as e:
        return None

def check_sensitive_image(image_url):
    img = load_image(image_url)
    if img is None:
        print("Không thể tải ảnh hoặc ảnh không hợp lệ.")
        return False, None

    inputs = clip_processor(text=sensitive_labels, images=img, return_tensors="pt", padding=True)
    
    with torch.no_grad():
        outputs = clip_model(**inputs)

    logits_per_image = outputs.logits_per_image
    probs = logits_per_image.softmax(dim=1)

    for i, label in enumerate(sensitive_labels):
        if probs[0][i] > 0.5:
            print(f"Ảnh nhạy cảm phát hiện: {label} (độ tin cậy: {probs[0][i]:.2f})")
            return True, label

    print("Ảnh không nhạy cảm.")
    return False, None

# Hàm phân loại văn bản
def classify_text(text):
    # Tokenize văn bản
    inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True)

    # Dự đoán kết quả
    with torch.no_grad():
        outputs = text_model(**inputs)
    
    # Xử lý đầu ra
    logits = outputs.logits
    predicted_class = torch.argmax(logits, dim=1).item()
    
    # Trả về kết quả boolean
    return predicted_class == 1

# Hàm kiểm tra văn bản nhạy cảm
def check_sensitive_text(text):
    if classify_text(text):
        print(f"Văn bản nhạy cảm phát hiện: {text}")
        return True, text
    else:
        print("Văn bản không nhạy cảm.")
        return False, None