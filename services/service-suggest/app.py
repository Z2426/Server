import os
import json
import threading
import redis
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
from controllers.user_controller import user_blueprint
from controllers.generateAI_controller import generate_ai
from task_processor import process_task
load_dotenv()
r = redis.StrictRedis(
    host=os.getenv('REDIS_HOST', 'localhost'), 
    port=int(os.getenv('REDIS_PORT', 6379)),   
    db=int(os.getenv('REDIS_DB', 0))           
)
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
def worker():
    while True:
        task_data = r.brpop('task_queue_suggest_service')
        task = json.loads(task_data[1])
        process_task(task)
def start_worker():
    worker_thread = threading.Thread(target=worker)
    worker_thread.daemon = True
    worker_thread.start()
app.register_blueprint(user_blueprint)
app.register_blueprint(generate_ai)
if __name__ == "__main__":
    host = os.getenv('FLASK_HOST', '0.0.0.0')
    port = int(os.getenv('SUGGEST_PORT', 3009))
    start_worker()
    app.run(debug=True, host=host, port=port)
