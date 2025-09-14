FROM python:3.11-slim
WORKDIR /srv
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY app.py .
COPY services/ ./services/

# Use PORT environment variable provided by Cloud Run
ENV PORT=8080
EXPOSE 8080

# BUCKET env is injected at deploy time
CMD exec gunicorn --bind :$PORT --workers 1 --threads 4 --timeout 300 --preload app:app
