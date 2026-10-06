FROM node:22-alpine AS frontend-builder
WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

FROM python:3.12-slim AS runtime
COPY --from=ghcr.io/astral-sh/uv:0.11.19 /uv /uvx /bin/

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/app/.venv/bin:$PATH"

WORKDIR /app
COPY backend/pyproject.toml backend/uv.lock ./
RUN uv sync --frozen

COPY backend/app ./app
COPY backend/entrypoint.sh ./entrypoint.sh
COPY data ./data
COPY --from=frontend-builder /frontend/dist ./frontend_dist

RUN chmod +x ./entrypoint.sh

EXPOSE 8000
CMD ["./entrypoint.sh"]
