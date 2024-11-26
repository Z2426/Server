from flask import Flask
from controllers.user_controller import user_blueprint
from controllers.generateAI_controller import generate_ai
from dotenv import load_dotenv
import redis
import json
import threading
from task_processor import process_task  # Import hàm xử lý task
import os
from flask_cors import CORS
# Load environment variables from .env file
load_dotenv()
# Kết nối Redis
r = redis.StrictRedis(host='redis', port=6379, db=0)
app = Flask(__name__)
# Cấu hình CORS cho toàn bộ ứng dụng và cho phép tất cả các nguồn
CORS(app, resources={r"/*": {"origins": "*"}})

# Worker chạy trong nền để nhận và xử lý task
def worker():
    while True:
        # Lấy task từ hàng đợi Redis
        task_data = r.brpop('task_queue_suggest_service')  # Đợi và lấy task
        task = json.loads(task_data[1])  # Giải mã task
        process_task(task)  # Xử lý task

# Khởi động worker trong một thread riêng biệt
def start_worker():
    worker_thread = threading.Thread(target=worker)
    worker_thread.daemon = True  # Để worker tự động dừng khi app dừng
    worker_thread.start()
# Register blueprints (controllers)
app.register_blueprint(user_blueprint)
app.register_blueprint(generate_ai)
if __name__ == "__main__":
    start_worker() 
    app.run(debug=True, host="0.0.0.0", port=3009)  # Bind to 0.0.0.0