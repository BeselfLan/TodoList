# -- Build stage --
FROM node:20-alpine AS build

WORKDIR /app

# Available to RUN steps below as an env var. Deliberately not promoted with
# ENV: that would bake an empty value into the image when no build arg is
# passed, and Vite lets real env vars win over .env files.
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_API_URL

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy and build
COPY . .
# .env is sourced for local builds, but sourcing it would also clobber any
# build arg passed above, silently ignoring what the caller asked for. So the
# args are stashed first and reapplied afterwards: an explicitly passed arg
# wins, and .env fills in whatever was left empty.
RUN ARG_CLIENT_ID="$VITE_GOOGLE_CLIENT_ID"; \
    ARG_API_URL="$VITE_API_URL"; \
    if [ -f .env ]; then set -a; . ./.env; set +a; fi; \
    export VITE_GOOGLE_CLIENT_ID="${ARG_CLIENT_ID:-$VITE_GOOGLE_CLIENT_ID}"; \
    export VITE_API_URL="${ARG_API_URL:-$VITE_API_URL}"; \
    npm run build

# -- Production image (nginx) --
FROM nginx:stable-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
