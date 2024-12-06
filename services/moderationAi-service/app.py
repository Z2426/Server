import os
import json
import threading
import redis
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
from controllers.content_controller import content_bp
from task_processor import process_task  

# Load environment variables from the .env file
load_dotenv()

# Configure Redis connection using environment variables
r = redis.StrictRedis(
    host=os.getenv('REDIS_HOST', 'localhost'),  # Default to localhost if not provided
    port=int(os.getenv('REDIS_PORT', 6379)),    # Default to 6379 if not provided
    db=int(os.getenv('REDIS_DB', 0))            # Default to DB 0 if not provided
)

# Initialize Flask application
app = Flask(__name__)

# Enable CORS for all routes
CORS(app, resources={r"/*": {"origins": os.getenv('FRONTEND_URL', 'http://localhost:3000')}})

# Worker function to continuously process tasks from Redis
def worker():
    while True:
        task_data = r.brpop('content_processing_queue')  # Block until a task is available
        task = json.loads(task_data[1])  # Decode task
        process_task(task)  # Process the task

# Start the worker in a separate thread
def start_worker():
    worker_thread = threading.Thread(target=worker)
    worker_thread.daemon = True  # Make it a daemon so it exits with the app
    worker_thread.start()

# Register blueprint for content processing
app.register_blueprint(content_bp)

# Run the Flask app with configurable host and port from environment variables
if __name__ == "__main__":
    host = os.getenv('FLASK_HOST', '0.0.0.0')  
    port = int(os.getenv('MODERATION_SERVICE_PORT', 3008)) 
    start_worker()  # Start the task worker
    app.run(debug=True, host=host, port=port)  
