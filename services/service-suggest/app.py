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
    app.run(debug=True, host="0.0.0.0", port=3009)  # Bind to 0.0.0.0