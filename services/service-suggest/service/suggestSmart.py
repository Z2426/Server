from transformers import AutoTokenizer, AutoModelForCausalLM
import requests
import io
from PIL import Image
from dotenv import load_dotenv  # Import the dotenv library
import os
model_name = "facebook/opt-350m"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(model_name)
# Load environment variables from the .env file
load_dotenv()
# Access the API URL and API Key from environment variables
API_URL_GENERATE_AI = os.getenv("API_URL_GENERATE_AI")
TOKEN_HUFACE = os.getenv("TOKEN_HUGEFACE")
# API Key và URL của Hugging Face
API_URL_GENERATE_AI = "https://api-inference.huggingface.co/models/ZB-Tech/Text-to-Image"
TOKEN_HUFACE = "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"  # Thay bằng API key của bạn
headers = {"Authorization": f"Bearer {TOKEN_HUFACE}"}
# Hàm gửi yêu cầu tới Hugging Face API
def generate_image(prompt):
    response = requests.post(API_URL_GENERATE_AI, headers=headers, json={"inputs": prompt})
    if response.status_code == 200:
        # Chuyển dữ liệu ảnh thành BytesIO để trả về
        image = Image.open(io.BytesIO(response.content))
        img_io = io.BytesIO()
        image.save(img_io, 'PNG')
        img_io.seek(0)
        return img_io  # Trả về đối tượng BytesIO
    else:
        return None
# Hàm xử lý sinh văn bản từ prompt
def generate_text(prompt):
    print(prompt)
    # Mã hóa đoạn gợi ý đầu vào
    inputs = tokenizer(prompt, return_tensors="pt")
    # Tạo nội dung dựa trên đầu vào
    output = model.generate(
        inputs["input_ids"],
        max_length=200,
        num_return_sequences=1,
        no_repeat_ngram_size=2,
        temperature=0.3,
        top_k=50,
        top_p=0.95,
        do_sample=False
    )
    # Giải mã đầu ra thành văn bản
    generated_text = tokenizer.decode(output[0], skip_special_tokens=True)
    return generated_text
