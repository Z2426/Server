import logging
from service.handleFindUser import detect_person_using_mtcnn, suggest_friend_logic, add_or_update_embedding
from utils.image_utils import load_image_from_url
import redis
import json

# Cấu hình logging để ghi log vào console
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Kết nối Redis
r = redis.StrictRedis(host='redis', port=6379, db=0)

def process_task(task):
    task_id = task['task_id']
    action = task['action']
    data = task['data']
    user_id = data['user_id']
    image_url = data['image_url']
    try:
        logging.info(f"Đang xử lý task {task_id} với hành động {action}")
        image = load_image_from_url(image_url)
        
        if image is None:
            logging.warning(f"Không thể tải ảnh từ URL: {image_url}")
            r.publish(task_id, json.dumps({
                'status': 'failed',
                'message': "Không thể tải ảnh từ URL"
            }))
            return  # Dừng lại nếu ảnh không tải được

        has_person = detect_person_using_mtcnn(image)
        
        if not has_person:
            # Nếu không có người trong ảnh, dừng lại và trả về kết quả thất bại
            logging.warning(f"Không phát hiện người trong ảnh: {task_id}")
            r.publish(task_id, json.dumps({
                'status': 'failed',
                'message': "Không phát hiện người trong ảnh"
            }))
            return  # Dừng lại

        # Nếu có người trong ảnh, tiếp tục xử lý các hành động tiếp theo
        logging.info(f"Phát hiện người trong ảnh, tiếp tục xử lý theo action: {task_id}")
        
        if action == 'embed_image':
            logging.info(f"Đang nhúng ảnh cho task {task_id}")
            embed_result = add_or_update_embedding(user_id, image)  # Nhúng ảnh
            logging.info(f"Kết quả nhúng ảnh: {embed_result}")
            r.publish(task_id, json.dumps(embed_result))

        elif action == 'suggest_friend_by_image':
            logging.info(f"Đang xử lí tìm bạn qua ảnh cho task {task_id}")
            suggestion_result = suggest_friend_logic(user_id, image)  # Gợi ý kết bạn
            logging.info(f"Kết quả gợi ý kết bạn: {suggestion_result}")
            r.publish(task_id, json.dumps(suggestion_result))

        else:
            logging.warning(f"Action không hợp lệ: {action} cho task {task_id}")
            r.publish(task_id, json.dumps({
                'status': 'failed',
                'message': f"Action {action} không hợp lệ"
            }))
    
    except Exception as e:
        logging.error(f"Đã xảy ra lỗi khi xử lý task {task_id}: {e}", exc_info=True)
        # Gửi thông báo lỗi về Redis
        r.publish(task_id, json.dumps({
            'status': 'failed',
            'message': f"Đã xảy ra lỗi trong quá trình xử lý: {str(e)}"
        }))
