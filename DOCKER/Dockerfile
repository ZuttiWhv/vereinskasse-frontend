# STAGE 1: Build
FROM node:20-alpine AS build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY .. .
# Hier wird das produktive Bundle erstellt
RUN npm run build

# STAGE 2: Production
FROM nginx:stable-alpine AS production-stage
# Kopiere die gebauten Dateien aus Stage 1
COPY --from=build-stage /app/dist /usr/share/nginx/html
# Kopiere die Nginx-Konfiguration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]