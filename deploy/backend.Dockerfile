FROM python:3.14-slim
WORKDIR /app
COPY backend/requirements-dev.lock /tmp/base.lock
COPY backend/requirements-cloud.txt /tmp/cloud.lock
RUN pip install --no-cache-dir -r /tmp/base.lock -r /tmp/cloud.lock
COPY backend/app /app/app
COPY backend/migrations /app/migrations
COPY backend/alembic.ini /app/alembic.ini
RUN useradd --uid 10001 --create-home chord
USER chord
EXPOSE 8000
# Only the private Compose network can reach this port; ingress terminates TLS.
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers", "--forwarded-allow-ips=*", "--no-access-log"]
