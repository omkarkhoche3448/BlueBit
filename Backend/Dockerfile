FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    PIP_NO_CACHE_DIR=1

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    postgresql-client \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY requirements.txt .

# Update pip and install dependencies with retries for network issues
RUN pip install --upgrade pip && \
    sed -i '/--hash=/d' requirements.txt && \
    # Install packages one by one with retries for better reliability
    grep -v '^//' requirements.txt | xargs -n 1 pip install --no-cache-dir --retries 5 || \
    # Fallback to bulk install if individual installation fails
    pip install --no-cache-dir -r requirements.txt --retries 5

# Copy project files
COPY . .

# Create directory for resume uploads if it doesn't exist
RUN mkdir -p resume

# Expose ports for app.py and microservice.py
EXPOSE 8000 5000

# Create an entrypoint script
RUN echo '#!/bin/bash\n\
if [ "$1" = "app" ]; then\n\
  python app.py\n\
elif [ "$1" = "microservice" ]; then\n\
  python microservice.py\n\
elif [ "$1" = "tests" ]; then\n\
  pytest -v\n\
else\n\
  echo "Unknown command: $1. Use app, microservice, or tests"\n\
  exit 1\n\
fi' > /app/entrypoint.sh && \
chmod +x /app/entrypoint.sh

# Set the entrypoint
ENTRYPOINT ["/app/entrypoint.sh"]

# Default command
CMD ["app"]
