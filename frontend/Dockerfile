# Frontend React Dockerfile

# Etapa de construcción
FROM node:18-alpine as builder

# Configurar directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias (incluye dev para construir)
RUN npm install --silent

# Copiar código fuente
COPY . .

# Construir aplicación para producción
RUN npm run build

# Etapa de producción
FROM nginx:alpine

# Copiar configuración personalizada de nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Copiar archivos construidos desde la etapa de builder
COPY --from=builder /app/build /usr/share/nginx/html

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copiar script de inicio
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Exponer puerto
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

# Comando de inicio
CMD ["/start.sh"]




