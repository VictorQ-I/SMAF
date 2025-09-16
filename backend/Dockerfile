# Backend NestJS Dockerfile
FROM node:18-alpine

# Configurar variables de entorno
ENV NODE_ENV=production

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci --omit=dev && npm cache clean --force

# Copiar código fuente
COPY . .

# Construir aplicación
RUN npm run build

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Cambiar propietario de archivos
RUN chown -R nestjs:nodejs /app
USER nestjs

# Exponer puerto
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node --version || exit 1

# Comando para ejecutar la aplicación
CMD ["node", "dist/main"]




