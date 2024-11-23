from transformers import AutoTokenizer, AutoModelForCausalLM
model_name = "facebook/opt-350m"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(model_name)
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
