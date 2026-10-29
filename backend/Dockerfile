# ==============================================================================
# STAGE 1: BUILDER
# Uses Chainguard Python dev image with package manager and compilers
# ==============================================================================
FROM cgr.dev/chainguard/python:latest-dev AS builder

USER root

# Install essential compilation headers for native C/C++ extensions
RUN apk update && apk add --no-cache \
    build-base \
    libpq-dev \
    libffi-dev \
    openssl-dev \
    git

WORKDIR /build

# Create isolated production virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Upgrade pip, setuptools, wheel within the venv
RUN pip install --no-cache-dir --upgrade pip setuptools wheel hatchling

# Copy project definition first to maximize Docker layer caching
COPY pyproject.toml ./

# Install project dependencies directly into /opt/venv
RUN pip install --no-cache-dir .

# ==============================================================================
# STAGE 2: PRODUCTION RUNTIME (DISTROLESS)
# Minimal Chainguard Python runtime: 0 CVEs, nonroot (65532), no shell/package manager
# ==============================================================================
FROM cgr.dev/chainguard/python:latest AS runtime

LABEL maintainer="Mettu Karl Referral Hospital ICT <ict-support@mettukarl.gov.et>"
LABEL security.hardened="chainguard-wolfi"
LABEL org.opencontainers.image.source="https://github.com/endus2512/Mettu_karl_HMIS"
LABEL org.opencontainers.image.description="Mettu Karl HMIS Backend API Service"

WORKDIR /app

# Copy the pre-built virtualenv with all compiled dependencies from builder
COPY --from=builder --chown=65532:65532 /opt/venv /opt/venv

# Copy application source code and migrations
COPY --chown=65532:65532 app/ ./app/
COPY --chown=65532:65532 alembic/ ./alembic/
COPY --chown=65532:65532 alembic.ini ./

# Set environment variables for the nonroot user and venv execution
ENV PATH="/opt/venv/bin:$PATH" \
    PYTHONPATH="/app" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Chainguard distroless defaults to nonroot (UID 65532)
USER 65532

EXPOSE 8000

# Distroless Note: Since curl/sh are absent, use native Python HTTP probe for Docker healthchecks
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD ["python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:8000/health', timeout=2).read()"]

# Run production Uvicorn server
ENTRYPOINT ["uvicorn", "app.main:app", \
            "--host", "0.0.0.0", \
            "--port", "8000", \
            "--workers", "4", \
            "--loop", "uvloop", \
            "--http", "httptools", \
            "--access-log", \
            "--log-level", "info"]
