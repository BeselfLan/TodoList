# -- Build stage --
FROM node:20-alpine AS build

WORKDIR /app

# Available to RUN steps below as an env var. Deliberately not promoted with
# ENV: that would bake an empty value into the image when no build arg is
# passed, and Vite lets real env vars win over .env files.
ARG VITE_GOOGLE_CLIENT_ID

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
