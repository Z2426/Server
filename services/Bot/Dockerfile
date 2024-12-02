# Sử dụng image chính thức của Botpress
FROM botpress/server:v12.26.2

# Cài đặt các phụ thuộc (nếu cần)
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Chỉ định cổng mà Botpress sẽ chạy
EXPOSE 4000

# Chạy Botpress khi container khởi động
CMD ["npm", "start"]
