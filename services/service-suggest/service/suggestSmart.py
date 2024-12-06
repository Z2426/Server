from transformers import AutoTokenizer, AutoModelForCausalLM
import requests
import io
from PIL import Image
from dotenv import load_dotenv  
import os
from googletrans import Translator
load_dotenv()
# API Key và URL for Hugging Face
API_URL_GENERATE_AI = os.getenv("API_URL_GENERATE_AI")
TOKEN_HUFACE = os.getenv("TOKEN_HUGEFACE")  
headers = {"Authorization": f"Bearer {TOKEN_HUFACE}"}
# Model for text generation
model_name = "facebook/opt-350m"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(model_name)
# Function to detect if the text is in Vietnamese
def is_vietnamese(text):
    return any(ord(c) > 127 for c in text)
# Function to translate text from src to dest language
def translate(src, dest, text):
    if not src or not dest or not text:
        return 'Missing parameters. Please provide src, dest, and text.'
    try:
        translator = Translator()
        result = translator.translate(text, src=src, dest=dest)
        return result.text
    except Exception as e:
        return f'Error: {str(e)}'

# Function to generate text based on a prompt
def generate_text(prompt):
    is_input_vietnamese = is_vietnamese(prompt)
    if is_input_vietnamese:
        prompt_translated = translate('vi', 'en', prompt)
    else:
        prompt_translated = prompt
    inputs = tokenizer(prompt_translated, return_tensors="pt")
    output = model.generate(
        inputs["input_ids"],
        max_length=800,
        num_return_sequences=1,
        no_repeat_ngram_size=3,
        temperature=0.2,
        top_k=50,
        top_p=0.9,
        do_sample=False
    )
    generated_text = tokenizer.decode(output[0], skip_special_tokens=True)
    if is_input_vietnamese:
        generated_text = translate('en', 'vi', generated_text) 
    return generated_text
# Function to generate an image based on a prompt
def generate_image(prompt):
    # Check if the prompt is in Vietnamese
    if is_vietnamese(prompt):
        # Translate the Vietnamese prompt to English
        prompt = translate('vi', 'en', prompt)
    # Send the translated prompt to Hugging Face API for image generation
    response = requests.post(API_URL_GENERATE_AI, headers=headers, json={"inputs": prompt})
    if response.status_code == 200:
        # Convert image data to BytesIO
        image = Image.open(io.BytesIO(response.content))
        img_io = io.BytesIO()
        image.save(img_io, 'PNG')
        img_io.seek(0)
        return img_io  # Return image as BytesIO object
    else:
        return None
