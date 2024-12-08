import requests
from PIL import Image, UnidentifiedImageError
from io import BytesIO
import torch
import os
from transformers import CLIPProcessor, CLIPModel, pipeline
from googletrans import Translator
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Environment setup for transformers cache
cache_dir = os.getenv("HF_HOME", "/root/.cache/huggingface/transformers")
os.makedirs(cache_dir, exist_ok=True)  # Create cache directory if it doesn't exist

# Load CLIP model and processor
clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch16")
clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch16")

# Toxic comment classifier pipeline
toxicity_classifier = pipeline("text-classification", model="unitary/toxic-bert")

# Zero-shot text classification pipeline
text_classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")


TOKEN_TOXIC_CONTENT =os.getenv("TOKEN_TOXIC_CONTENT")
# Sensitive labels for image classification
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
    # Add new sensitive labels
    "supernatural", "demon", "zombie", "monster", "possession", "poltergeist", 
    "exorcism", "vampire", "werewolf", "mutant", "decapitation", "dismemberment", 
    "burnt body", "rotting flesh", "deformed", "undead", "corpse", "skull", 
    "haunting", "ghost", "nightmare", "screaming", "creepy", "shadow", 
    "darkness", "phantom", "specter", "cursed", "macabre", "jump scare", 
    "ritual murder", "occult", "dark ritual", "body horror", "flesh eating", 
    "demonic possession", "creature attack", "haunted house", "satanic symbol", 
    "witchcraft", "ghoul", "necromancy"
]

# List of topics for text classification
topics = [
    "News and Events", "Entertainment", "Health and Fitness", "Travel", 
    "Fashion and Beauty", "Technology and Innovation", "Education and Learning", 
    "Business and Entrepreneurship", "Lifestyle", "Art and Creativity", 
    "Environment and Nature Conservation", "Love and Relationships", "Pets"
]

# Load image from URL function
def load_image(image_url):
    try:
        response = requests.get(image_url)
        response.raise_for_status()

        if 'image' not in response.headers['Content-Type']:
            return None

        img = Image.open(BytesIO(response.content)).convert("RGB")
        return img
    except Exception as e:
        logger.error(f"Error loading image: {e}")
        return None

# Check if an image is sensitive
def check_sensitive_image(image_url):
    img = load_image(image_url)
    if img is None:
        logger.warning("Cannot load image or invalid image.")
        return False, None

    inputs = clip_processor(text=sensitive_labels, images=img, return_tensors="pt", padding=True)
    
    with torch.no_grad():
        outputs = clip_model(**inputs)

    logits_per_image = outputs.logits_per_image
    probs = logits_per_image.softmax(dim=1)

    for i, label in enumerate(sensitive_labels):
        if probs[0][i] > 0.5:
            logger.info(f"Sensitive image detected: {label} (confidence: {probs[0][i]:.2f})")
            return True, label

    logger.info("No sensitive content detected in the image.")
    return False, None

# Translate Vietnamese text to English
def translate_vietnamese_to_english(vietnamese_text):
    translator = Translator()
    translation = translator.translate(vietnamese_text, src='vi', dest='en')
    return translation.text

# Check if text is in Vietnamese
def is_vietnamese(text):
    return any(ord(c) > 127 for c in text)
def analyze_vietnamese_text_with_wit_ai(text, token):
    url = f"https://api.wit.ai/message?v=20241208&q={text}"
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        return response.json() 
    else:
        logger.error(f"Wit.ai API request failed with status code {response.status_code}")
        return {'intents': []}  
def check_sensitive_text(text):
    if is_vietnamese(text):
        analysis_result = analyze_vietnamese_text_with_wit_ai(text, TOKEN_TOXIC_CONTENT)
        if any(intent['name'] == 'toxic_content' for intent in analysis_result.get('intents', [])):
            return True  
        return False  
        
    else:
        result = toxicity_classifier(text)
        toxicity_score = result[0]['score'] if isinstance(result, list) else result['score']       
        logger.info(f"Toxicity score: {toxicity_score}")  
        if toxicity_score > 0.5:
            return True
        return False


# Classify text based on predefined topics
def classify_text(content):
    try:
        if not content.strip():
            return None

        if is_vietnamese(content):
            content = translate_vietnamese_to_english(content)
    
        results = text_classifier(content, candidate_labels=topics)

        if 'labels' in results and 'scores' in results:
            scores = {results['labels'][i]: results['scores'][i] for i in range(len(results['labels']))}
            predicted_topic = max(scores, key=scores.get)
            predicted_score = max(scores.values())
            return {"topic": predicted_topic, "score": predicted_score}
        else:
            logger.error("Error: The structure of the classification result is not as expected.")
            return None
    except Exception as e:
        logger.error(f"Error during text classification: {e}")
        return None

# Classify image based on predefined topics
def classify_image(image_url):
    try:
        image = Image.open(requests.get(image_url, stream=True).raw)
        inputs = clip_processor(images=image, text=topics, return_tensors="pt", padding=True)
        outputs = clip_model(**inputs)

        logits_per_image = outputs.logits_per_image
        probs = logits_per_image.softmax(dim=1)
        predicted_topic_idx = torch.argmax(probs)
        predicted_topic = topics[predicted_topic_idx.item()]
        predicted_score = probs[0][predicted_topic_idx.item()].item()
        return {"topic": predicted_topic, "score": predicted_score}
    except Exception as e:
        logger.error(f"Error during image classification: {e}")
        return {"topic": "Error: Classification failed", "score": 0.0}

# Classify both text and image and return the one with the highest score
def classify_post(text_content=None, image_url=None):
    try:
        predicted_text = None
        predicted_image = None

        if text_content and text_content.strip():
            predicted_text = classify_text(text_content)

        if image_url:
            predicted_image = classify_image(image_url)

        if predicted_text is None and predicted_image is None:
            return {"error": "No text or image provided"}

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
    except Exception as e:
        logger.error(f"Error during post classification: {e}")
        return {"error": "Failed to classify post"}
def check_content_sensitivity(text_content=None, image_url=None):
    try:
        # Check if text content is provided and assess if it's toxic
        if text_content and text_content.strip():
            is_toxic = check_sensitive_text(text_content)
            if is_toxic:
                logger.info("Text contains sensitive content.")
                return True  # Return True if the text is toxic

        # If an image URL is provided, check if the image contains sensitive content
        if image_url:
            is_sensitive_image, label = check_sensitive_image(image_url)
            if is_sensitive_image:
                logger.info(f"Image contains sensitive content: {label}")
                return True  # Return True if the image is sensitive

        # If no sensitive content is found in both text and image
        return False

    except Exception as e:
        logger.error(f"Error during content sensitivity check: {e}")
        return False  # Return False if there's an error during the check