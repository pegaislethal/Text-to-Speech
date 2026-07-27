FROM nvidia/cuda:11.8.0-cudnn8-runtime-ubuntu22.04

# Install system dependencies & FFmpeg
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-dev \
    ffmpeg \
    libsndfile1 \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Upgrade pip & install requirements
COPY requirements.txt .
RUN pip3 install --no-cache-dir --upgrade pip
RUN pip3 install --no-cache-dir -r requirements.txt

# Copy service codebase
COPY . .

# Create storage and model directories
RUN mkdir -p app/models/voices storage/voice_dataset storage/temp

EXPOSE 8000

ENV MODEL_PATH=/app/app/models/voices
ENV STORAGE_URL=/app/storage
ENV CUDA_VISIBLE_DEVICES=0

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
