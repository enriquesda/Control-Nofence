# ── Etapa 1: Build del frontend ──────────────────────
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# ── Etapa 2: Imagen final (FastAPI monolítico) ───────
FROM python:3.11-slim
WORKDIR /app

# Instalar dependencias de Python
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el código del backend a la raíz
COPY backend/ .

# Copiamos el build de React desde la etapa anterior
# Esto creará una carpeta 'dist' accesible por main.py
COPY --from=frontend-build /app/dist ./dist

# Directorio para los datos persistentes (CSV)
RUN mkdir -p /app/data

# Fly.io espera tráfico en el puerto 8080
EXPOSE 8080

# Arrancamos Uvicorn sirviendo el backend (que ahora incluye el frontend)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
