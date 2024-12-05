import redis
import json
import logging
from service.content_model import classify_post, check_content_sensitivity  # Giả sử bạn có hàm kiểm tra nhạy cảm
from models.database import post_collection
from bson.objectid import ObjectId

# Cấu hình logging để ghi log vào console
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Kết nối Redis
r = redis.StrictRedis(host='redis', port=6379, db=0)

def publish_task_status(task_id, status, message, result=None):
    """
    Hàm gửi thông báo trạng thái task qua Redis.
    """
    message_data = {
        'status': status,
        'task_id': task_id,
        'message': message
    }
    if result:
        message_data['result'] = result
    r.publish(task_id, json.dumps(message_data))

def send_to_another_queue(task, queue_name):
    """
    Gửi task vào hàng đợi khác trong Redis.
    """
    r.lpush(queue_name, json.dumps(task))

def handle_classify_post(task_id, post_id, text_content, image_url):
    """
    Xử lý task 'classifyPost', phân loại bài đăng và cập nhật kết quả vào MongoDB.
    """
    # Đảm bảo ít nhất một đầu vào (text hoặc image) được cung cấp
    if not text_content and not image_url:
        message = "Cần cung cấp nội dung văn bản hoặc URL ảnh."
        logging.warning(message)
        publish_task_status(task_id, 'failed', message)
        return

    logging.info(f"Phân loại bài đăng cho task {task_id}")
    result_classify_post = classify_post(text_content=text_content, image_url=image_url)

    # Cập nhật bài post với kết quả phân loại và thêm trạng thái
    update_result = post_collection.update_one(
        {"_id": ObjectId(post_id)},
        {"$set": {
            "category": result_classify_post['predicted_topic'],  # Cập nhật trường category
            "status": "approved"  # Thêm trường status
        }}
    )

    # Kiểm tra kết quả cập nhật
    if update_result.matched_count > 0:
        logging.info(f"Bài post {post_id} đã được cập nhật thành công.")
        publish_task_status(task_id, 'success', 'Phân loại bài đăng thành công', result_classify_post)
    else:
        message = f"Không tìm thấy bài post với ID: {post_id}"
        logging.warning(message)
        publish_task_status(task_id, 'failed', message)

def handle_check_content_sensitivity(task_id, text_content, image_url):
    """
    Xử lý kiểm tra nội dung nhạy cảm (text hoặc image).
    """
    logging.info(f"Đang kiểm tra nội dung nhạy cảm cho task {task_id}")
    result = check_content_sensitivity(text_content=text_content, image_url=image_url)
    
    if result:
        # Log khi phát hiện nội dung nhạy cảm
        logging.warning(f"Nội dung nhạy cảm được phát hiện cho task {task_id}.")
        # Gửi thông báo về Redis
        publish_task_status(task_id, 'failed', 'Nội dung nhạy cảm được phát hiện.')
        return True  # Phát hiện nhạy cảm
    else:
        logging.info(f"Nội dung không nhạy cảm cho task {task_id}")
        return False  # Không phát hiện nhạy cảm

def process_task(task):
    try:
        # Log thông tin task nhận được
        logging.info(f"Task nhận được: {task}")
        
        task_id = task.get('task_id')
        action = task.get('action')
        data = task.get('data', {})
        
        post_id = data.get('post_id')
        user_id = data.get('user_id')
        text_content = data.get('text')
        image_url = data.get('image_url')

        logging.info(f"Task ID: {task_id}, Action: {action}, User ID: {user_id}, Text Content: {text_content}, Image URL: {image_url}")

        # Thông báo bắt đầu xử lý task qua Redis
        publish_task_status(task_id, 'in_progress', f"Đang xử lý task {task_id}...")

        if action == 'checkContentSensitivity':
            # Kiểm tra nội dung nhạy cảm trước khi phân loại
            is_sensitive = handle_check_content_sensitivity(task_id, text_content, image_url)
            logging.info(f"Giá trị của is_sensitive: {is_sensitive}")
            if is_sensitive:
                task['action'] = 'processvioletpost'  # Thay đổi action của task
                # Nếu phát hiện nhạy cảm, gửi vào hàng đợi 'processreport'
                send_to_another_queue(task, 'process_post')
                logging.info(f"Task {task_id} đã được chuyển vào hàng đợi 'process_post' để xử lý nội dung nhạy cảm.")
                return  # Dừng xử lý thêm nếu phát hiện nhạy cảm
            handle_classify_post(task_id, post_id, text_content, image_url)
        else:
            message = f"Hành động {action} không hợp lệ cho task {task_id}"
            logging.warning(message)
            publish_task_status(task_id, 'failed', message)

    except Exception as e:
        logging.error(f"Đã xảy ra lỗi khi xử lý task {task.get('task_id')}: {e}", exc_info=True)
        publish_task_status(task.get('task_id'), 'failed', f"Đã xảy ra lỗi trong quá trình xử lý: {str(e)}")
