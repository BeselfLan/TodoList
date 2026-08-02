# -- Build stage --
FROM node:20-alpine AS build

WORKDIR /app

ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID}

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy and build
COPY . .
RUN if [ -f .env ]; then set -a; . ./.env; set +a; fi && npm run build

# -- Production image (nginx) --
FROM nginx:stable-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
