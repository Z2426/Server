from flask import Flask
from controllers.user_controller import user_blueprint
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)

# Register blueprints (controllers)
app.register_blueprint(user_blueprint)

if __name__ == "__main__":
    # Get the port from the environment variable, default to 5000 if not set
    port = os.getenv("FLASK_RUN_PORT", 5000)
    app.run(debug=True, port=int(port))
