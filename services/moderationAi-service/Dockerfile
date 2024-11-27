# Stage 1: Build dependencies (build environment)
FROM python:3.8-slim AS build

# Set the working directory
WORKDIR /usr/src/app

# Install system dependencies required for building Python packages
RUN apt-get update && apt-get install -y \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    && apt-get clean

# Copy the requirements file first to leverage Docker cache
COPY ./services/moderationAi-service/requirements.txt ./requirements.txt

# Upgrade pip and install dependencies
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt --default-timeout=2000

# Stage 2: Production image
FROM python:3.8-slim

# Set the working directory
WORKDIR /usr/src/app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && apt-get clean

# Set environment variables
ENV HF_HOME=/root/.cache/huggingface/transformers 

# Create the cache directory in the container (if not exists)
RUN mkdir -p /root/.cache/huggingface/transformers

# Copy the application code and the installed dependencies from the build stage
COPY --from=build /usr/local/lib/python3.8/site-packages/ /usr/local/lib/python3.8/site-packages/
COPY --from=build /usr/local/bin/ /usr/local/bin/

# Copy the application code
COPY ./services/moderationAi-service ./services/moderationAi-service

# Verify Flask and OpenCV installation
RUN python -c "import flask; print(f'✅ Flask version: {flask.__version__}')" && \
    python -c "import cv2; print(f'✅ OpenCV imported successfully')"

# Set environment variable and expose the port
ENV PORT=3008
EXPOSE 3008

# Command to run the application
CMD ["python3", "services/moderationAi-service/app.py"]