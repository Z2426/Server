# Sử dụng hình ảnh Python 3.11
FROM python:3.11

# Thiết lập thư mục làm việc
WORKDIR /usr/src/app

# Cập nhật pip lên phiên bản mới nhất
RUN pip install --upgrade pip

# Sao chép file requirements.txt vào container
COPY ./services/moderation-service/requirements.txt .

# Cài đặt các thư viện cần thiết
RUN pip install --no-cache-dir -r requirements.txt

# Sao chép toàn bộ mã nguồn vào container
COPY ./services/moderation-service .

# Thiết lập biến môi trường cho Flask
ENV FLASK_APP=app.py

# Mở cổng cho ứng dụng
EXPOSE 5000

# Chạy ứng dụng
CMD ["flask", "run", "--host=0.0.0.0"]
