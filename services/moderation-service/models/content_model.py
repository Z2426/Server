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

# Danh sách các nhãn nhạy cảm bổ sung
sensitive_labels = [
    "toxic", "nudity", "violence", "horror", "blood", "gore", "murder",
    "assault", "abuse", "self-harm", "slasher", "disturbing", "graphic", "cruelty"
]

# Danh sách từ nhạy cảm
sensitive_words = [
    "giết", "bạo lực", "tội ác", "ma túy", "hành hung", "tự sát", "đâm chém",
    "xâm hại", "thảm sát", "hại người", "hãm hiếp", "đánh đập", "thương tật",
    "khủng bố", "hận thù", "mê tín", "độc ác", "tình dục", "tội phạm",
    "sát thủ", "cái chết", "đau khổ", "bệnh tật", "nạn nhân", "cô đơn",
    "bạo hành", "hành vi", "nỗi đau", "tâm lý", "thảm họa", "nỗi sợ",
    "sự lạm dụng", "mâu thuẫn", "xã hội đen", "ma quái", "vô gia cư",
    "sự tổn thương", "khổ sở", "mâu thuẫn xã hội", "vấn đề", "căng thẳng",
    "sát nhân", "giết người"
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

def get_embedding(text):
    inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True)
    with torch.no_grad():
        outputs = text_model(**inputs)
    return outputs.last_hidden_state.mean(dim=1)

def check_sensitive_text(text):
    text_embedding = get_embedding(text).numpy()

    for word in sensitive_words:
        word_embedding = get_embedding(word).numpy()
        similarity = cosine_similarity(text_embedding, word_embedding)

        if similarity[0][0] > 0.5:
            print(f"Từ nhạy cảm phát hiện: {word} (độ tin cậy: {similarity[0][0]:.2f})")
            return True, word

    print("Không phát hiện từ nhạy cảm.")
    return False, None

