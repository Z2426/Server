import requests
from PIL import Image, UnidentifiedImageError
from io import BytesIO
import torch
import os
from transformers import CLIPProcessor, CLIPModel, BertTokenizer, BertForSequenceClassification,pipeline
from sklearn.metrics.pairwise import cosine_similarity
from transformers import pipeline
from googletrans import Translator
# Tải mô hình CLIP
# Tải và lưu mô hình và tokenizer
# Đảm bảo rằng biến môi trường TRANSFORMERS_CACHE đã được thiết lập đúng
cache_dir = os.getenv("HF_HOME", "/root/.cache/huggingface/transformers")
os.makedirs(cache_dir, exist_ok=True)  # Tạo thư mục cache nếu chưa tồn tại

clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch16")
clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch16")
# # Tải pipeline phân loại toxic comments
toxicity_classifier = pipeline("text-classification", model="unitary/toxic-bert")
# # Load zero-shot text classification model 
text_classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")
# Danh sách nhãn nhạy cảm
sensitive_labels = [
    "toxic", "nudity", "violence", "horror", "blood", "gore", "murder", 
    "assault", "abuse", "self-harm", "slasher", "disturbing", "graphic", "cruelty", 
    "hate", "terrorism", "suicide", "death", "rape", "torture", "war", "execution",
    "drugs", "child abuse", "weapon", "stabbing", "shooting", "massacre", "genocide", 
    "animal cruelty", "domestic violence", "bullying", "abortion", "explosion", "poison",
    "addiction", "gang violence", "extremism", "hostage", "harassment", "racism", 
    "sex trafficking", "human trafficking", "human rights violations", "sexually explicit", 
    "extreme violence", "sexual abuse", "brutality", "crimes against humanity", "child pornography",
    "pedophilia", "incest", "hate speech", "hate crime", "arson", "forced labor", "slave trade", 
    "smuggling", "cyberbullying", "homophobia", "xenophobia", "misogyny", "misandry", 
    "death threat", "necrophilia", "sadism", "sexual harassment", "verbal abuse", 
    "physical abuse", "mental abuse", "psychological torture", "bombing", "lynching", 
    "police brutality", "honor killing", "forced marriage", "child exploitation", 
    "body shaming", "gaslighting", "cult abuse", "revenge porn", "blackmail", 
    "pornography", "sexual exploitation", "military violence", "chemical weapons", 
    "biological weapons", "organ trafficking", "ritual abuse", "witch hunt", 
    "serial killer", "organized crime", "prostitution", "forced prostitution", 
    "child soldier", "genital mutilation", "ethnic cleansing", "serial abuse", 
    "hate propaganda", "violent threat", 
    # Bổ sung mới
    "supernatural", "demon", "zombie", "monster", "possession", "poltergeist", 
    "exorcism", "vampire", "werewolf", "mutant", "decapitation", "dismemberment", 
    "burnt body", "rotting flesh", "deformed", "undead", "corpse", "skull", 
    "haunting", "ghost", "nightmare", "screaming", "creepy", "shadow", 
    "darkness", "phantom", "specter", "cursed", "macabre", "jump scare", 
    "ritual murder", "occult", "dark ritual", "body horror", "flesh eating", 
    "demonic possession", "creature attack", "haunted house", "satanic symbol", 
    "witchcraft", "ghoul", "necromancy"
]
#TOPIC CLASSIFY POST
# List of topics for classification
topics = [
    "News and Events",
    "Entertainment",
    "Health and Fitness",
    "Travel",
    "Fashion and Beauty",
    "Technology and Innovation",
    "Education and Learning",
    "Business and Entrepreneurship",
    "Lifestyle",
    "Art and Creativity",
    "Environment and Nature Conservation",
    "Love and Relationships",
    "Pets"  # New topic added here
]
# Hàm tải ảnh từ URL
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
        print(f"Error loading image: {e}")
        return None

# Hàm kiểm tra ảnh nhạy cảm
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
# Tải pipeline phân loại toxic comments
toxicity_classifier = pipeline("text-classification", model="unitary/toxic-bert")

# Dịch văn bản từ tiếng Việt sang tiếng Anh
def translate_vietnamese_to_english(vietnamese_text):
    translator = Translator()
    translation = translator.translate(vietnamese_text, src='vi', dest='en')
    return translation.text
# Hàm kiểm tra xem văn bản có phải là tiếng Việt hay không
def is_vietnamese(text):
    # Kiểm tra nếu văn bản có chứa ký tự tiếng Việt
    return any(ord(c) > 127 for c in text)
# Hàm phát hiện toxicity
def check_sensitive_text(text):
    # Nếu văn bản là tiếng Việt, dịch sang tiếng Anh
    if is_vietnamese(text):
        text = translate_vietnamese_to_english(text)
    
    # Phân loại toxicity và giả sử toxicity_classifier trả về một dictionary với 'score'
    result = toxicity_classifier(text)
    
    # Lấy điểm toxicity từ kết quả trả về (dưới dạng dictionary)
    toxicity_score = result[0]['score'] if isinstance(result, list) else result['score']
    
    # In kết quả toxicity ra (nếu cần)
    print(toxicity_score)
    
    # Kiểm tra nếu độ độc hại cao hơn 0.8
    if toxicity_score > 0.5:
        return True
    else:
        return False

# Function to classify text
def classify_text(content):
    try:
        if not content.strip():
            return None  # Return None if no text provided
         # Nếu văn bản là tiếng Việt, dịch sang tiếng Anh
        if is_vietnamese(content):
            content = translate_vietnamese_to_english(content)
    
        # Perform zero-shot text classification
        results = text_classifier(content, candidate_labels=topics)

        # Ensure the results contain labels and scores
        if 'labels' in results and 'scores' in results:
            # Collect topic scores and get the topic with the highest score
            scores = {results['labels'][i]: results['scores'][i] for i in range(len(results['labels']))}
            predicted_topic = max(scores, key=scores.get)
            predicted_score = max(scores.values())  # Get the highest score for text
            return {"topic": predicted_topic, "score": predicted_score}
        else:
            print("Error: The structure of the classification result is not as expected.")
            return None  # Return None for invalid result structure
    except Exception as e:
        print(f"Error during text classification: {e}")
        return None  # Return None in case of any exception

# Function to classify image
def classify_image(image_url):
    try:
        # Load image from URL
        image = Image.open(requests.get(image_url, stream=True).raw)

        # Preprocess the image and get the model output
        inputs = clip_processor(images=image, text=topics, return_tensors="pt", padding=True)
        outputs = clip_model(**inputs)

        # Get image features and match with the topics
        logits_per_image = outputs.logits_per_image  # this is the similarity score for each image-topic
        probs = logits_per_image.softmax(dim=1)  # Softmax to get probability distribution
        predicted_topic_idx = torch.argmax(probs)  # Get the index of the most likely topic
        predicted_topic = topics[predicted_topic_idx.item()]  # Get the corresponding topic
        predicted_score = probs[0][predicted_topic_idx.item()].item()  # Get the probability of the predicted topic
        return {"topic": predicted_topic, "score": predicted_score}
    except Exception as e:
        print(f"Error during image classification: {e}")
        return {"topic": "Error: Classification failed", "score": 0.0}

# Function to classify both text and image and return a unified result as an object
# Function to classify both text and image and return a unified result as an object
def classify_post(text_content=None, image_url=None):
    try:
        predicted_text = None
        predicted_image = None

        # Classify text if text content is provided
        if text_content and text_content.strip():
            predicted_text = classify_text(text_content)

        # Classify image if image URL is provided
        if image_url:
            predicted_image = classify_image(image_url)

        # Handle case where only one input (text or image) is provided
        if predicted_text is None and predicted_image is None:
            return {"error": "No text or image provided"}

        # Compare scores and return the one with the highest score
        if predicted_text and predicted_image:
            if predicted_text["score"] >= predicted_image["score"]:
                return {
                    "predicted_topic": predicted_text["topic"] or "Unknown",
                    "text_score": predicted_text["score"],
                    "image_score": predicted_image["score"]
                }
            else:
                return {
                    "predicted_topic": predicted_image["topic"] or "Unknown",
                    "text_score": predicted_text["score"],
                    "image_score": predicted_image["score"]
                }
        elif predicted_text:
            return {
                "predicted_topic": predicted_text["topic"] or "Unknown",
                "text_score": predicted_text["score"],
                "image_score": 0.0
            }
        elif predicted_image:
            return {
                "predicted_topic": predicted_image["topic"] or "Unknown",
                "text_score": 0.0,
                "image_score": predicted_image["score"]
            }

        # If neither classifier returned a valid topic, return "Unknown"
        return {"predicted_topic": "Unknown", "text_score": 0.0, "image_score": 0.0}

    except Exception as e:
        return {"error": f"Error during classification: {e}"}
def check_content_sensitivity(text_content=None, image_url=None):
    try:
        # Kiểm tra văn bản có nhạy cảm không
        if text_content and text_content.strip():
            # Kiểm tra độ độc hại trong văn bản
            is_toxic = check_sensitive_text(text_content)
            if is_toxic:
                print("Văn bản chứa nội dung nhạy cảm.")
                return True  # Trả về True ngay nếu văn bản nhạy cảm

        # Nếu có URL ảnh, kiểm tra ảnh nhạy cảm
        if image_url:
            is_sensitive_image, label = check_sensitive_image(image_url)
            if is_sensitive_image:
                print(f"Ảnh chứa nội dung nhạy cảm: {label}")
                return True  # Trả về True nếu ảnh nhạy cảm

        # Nếu không có nội dung nhạy cảm trong cả văn bản và ảnh
        return False

    except Exception as e:
        print(f"Error during content sensitivity check: {e}")
        return False  # Trả về False nếu có lỗi trong quá trình kiểm tra