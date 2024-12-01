from flask import Flask
from controllers.content_controller import content_bp
from flask_cors import CORS
import redis
import json
import threading
from task_processor import process_task  # Import hàm xử lý task
app = Flask(__name__)
# Cấu hình CORS cho toàn bộ ứng dụng và cho phép tất cả các nguồn
# Cấu hình CORS cho phép frontend từ localhost:3006
r = redis.StrictRedis(host='redis', port=6379, db=0)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})

# Worker chạy trong nền để nhận và xử lý task
def worker():
    while True:
        # Lấy task từ hàng đợi Redis
        task_data = r.brpop('task_classify_post')  # Đợi và lấy task
        task = json.loads(task_data[1])  # Giải mã task
        process_task(task)  # Xử lý task

# Khởi động worker trong một thread riêng biệt
def start_worker():
    worker_thread = threading.Thread(target=worker)
    worker_thread.daemon = True  # Để worker tự động dừng khi app dừng
    worker_thread.start()
# Đăng ký blueprint cho content
app.register_blueprint(content_bp)
if __name__ == "__main__":
    start_worker() 
    app.run(debug=True, host="0.0.0.0", port=3008)  # Bind to 0.0.0.0