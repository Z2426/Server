from flask import Flask
from controllers.content_controller import content_bp

app = Flask(__name__)

# Đăng ký blueprint cho content
app.register_blueprint(content_bp)

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=3008)  # Bind to 0.0.0.0