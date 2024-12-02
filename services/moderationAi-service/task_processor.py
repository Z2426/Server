import redis
import json
import logging
from service.content_model import classify_post
from models.database import post_collection  # Đảm bảo đúng tên file kết nối
from bson.objectid import ObjectId  # Import để làm việc với ObjectId trong MongoDB

# Cấu hình logging để ghi log vào console
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Kết nối Redis
r = redis.StrictRedis(host='redis', port=6379, db=0)

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

        # In ra toàn bộ thông tin để kiểm tra
        logging.info(f"Task ID: {task_id}")
        logging.info(f"Action: {action}")
        logging.info(f"User ID: {user_id}")
        logging.info(f"Text Content: {text_content}")
        logging.info(f"Image URL: {image_url}")
        logging.info(f"Full Task Data: {task}")

        logging.info(f"Đang xử lý task {task_id} với hành động {action}")
        
        # Thông báo bắt đầu xử lý task qua Redis
        r.publish(task_id, json.dumps({
            'status': 'in_progress',
            'message': f"Đang xử lý task {task_id}..."
        }))

        if action == 'classifyPost':
            # Đảm bảo ít nhất một đầu vào (text hoặc image) được cung cấp
            if not text_content and not image_url:
                logging.warning(f"Không có nội dung văn bản hoặc ảnh cho task {task_id}")
                r.publish(task_id, json.dumps({
                    'status': 'failed',
                    'message': "Cần cung cấp nội dung văn bản hoặc URL ảnh"
                }))
                return

            # Gọi hàm classify_post với text và/hoặc image
            logging.info(f"Phân loại bài đăng cho task {task_id}")
            result_classify_post = classify_post(text_content=text_content, image_url=image_url)

            # Cập nhật bài post với kết quả phân loại
            update_result = post_collection.update_one(
                {"_id": ObjectId(post_id)},  # Tìm bài post theo ID
                {"$set": {"catatablog": result_classify_post['predicted_topic']}}  # Cập nhật trường category
            )

            # Kiểm tra kết quả cập nhật
            if update_result.matched_count > 0:
                logging.info(f"Bài post {post_id} đã được cập nhật thành công.")
                r.publish(task_id, json.dumps({
                    'status': 'success',
                    'task_id': task_id,
                    'result': result_classify_post
                }))
            else:
                logging.warning(f"Không tìm thấy bài post với ID: {post_id}")
                r.publish(task_id, json.dumps({
                    'status': 'failed',
                    'message': f"Không tìm thấy bài post với ID: {post_id}"
                }))

        else:
            # Thông báo nếu action không hợp lệ
            logging.warning(f"Hành động {action} không hợp lệ cho task {task_id}")
            r.publish(task_id, json.dumps({
                'status': 'failed',
                'message': f"Hành động {action} không hợp lệ"
            }))

    except Exception as e:
        logging.error(f"Đã xảy ra lỗi khi xử lý task {task_id}: {e}", exc_info=True)
        # Gửi thông báo lỗi về Redis
        r.publish(task_id, json.dumps({
            'status': 'failed',
            'task_id': task_id,
            'message': f"Đã xảy ra lỗi trong quá trình xử lý: {str(e)}"
        }))
