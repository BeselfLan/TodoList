# TodoList

A full-stack daily planner where you sign in with Google and keep a separate todo list for every day.

I built it end to end, from the user interface to the production server. I wrote a React and
TypeScript frontend, a REST API with Node.js and Express, and a PostgreSQL database. I added
Google sign-in with my own token-based sessions and automated tests for both the frontend and
the API. I then put the whole app in Docker containers and deployed it to a Linux server, where
it runs on its own domain over HTTPS.

**Live at [2dolist.org](https://2dolist.org)**

![React](https://img.shields.io/badge/React_19-20232A?logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Express_5-339933?logo=nodedotjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)

## Features

- **Google sign-in.** Each user's lists are private to them.
- **A list per day.** Step between dates and plan ahead.
- **Expandable items** with a title and notes, which you can check off and drag to reorder.
- **Saved to PostgreSQL**, so lists carry over between devices and sessions.

## Tech stack

| Area           | Tools                                                  |
| -------------- | ------------------------------------------------------ |
| Frontend       | React 19, TypeScript, React Router, Tailwind CSS, Vite |
| Backend        | Node.js, Express 5, PostgreSQL                         |
| Auth           | Google OAuth, JSON Web Tokens                          |
| Testing        | Vitest, Testing Library, supertest                     |
| Infrastructure | Docker Compose, nginx, Caddy (HTTPS)                   |

## Engineering highlights

- **Secure sessions.** The server checks the Google sign-in with Google, then issues its own
  signed JWT. Every request takes the user ID from that token, so no one can read another
  user's data.
- **Rate limiting.** The sign-in route is limited per IP address. The server is configured to
  see visitors' real IP addresses behind the two proxies.
- **Minimal attack surface.** The browser talks to a single origin. nginx serves the app and
  forwards `/api` to Express. The API and database are never exposed to the internet.
- **Testable by design.** The Express app is built by a factory that accepts a database, so
  the API tests use a fake database and need no setup.
- **Containerized.** One Docker Compose setup runs development (with live reload) and
  production. Caddy handles HTTPS with automatic Let's Encrypt certificates.

```
browser ──HTTPS──> Caddy ──> nginx ──┬─> /       React app
                                     └─> /api/*  Express ──> PostgreSQL
```

## Running locally

**Requirements:** Docker, and a Google OAuth client ID from the
[Google Cloud Console](https://console.cloud.google.com/apis/credentials).

1. Clone the repo:

   ```bash
   git clone https://github.com/BeselfLan/TodoList.git
   cd TodoList
   ```
2. Create the three `.env` files. All are gitignored. Use the same client ID in both places.

   ```bash
   # .env
   POSTGRES_DB=todolist
   POSTGRES_USER=todolist
   POSTGRES_PASSWORD=change-me              # openssl rand -hex 24

   # server/.env
   VITE_GOOGLE_CLIENT_ID=your-id.apps.googleusercontent.com
   JWT_SECRET=change-me                     # any long random string
   CLIENT_ORIGIN=http://localhost:5173

   # client/.env
   VITE_GOOGLE_CLIENT_ID=your-id.apps.googleusercontent.com
   ```
3. Start everything:

   ```bash
   docker compose up --build
   ```

   Then open http://localhost:5173. Code changes reload automatically.

## Testing

```bash
cd server && npm run test:run   # API tests
cd client && npm run test:run   # component and routing tests
```

## Deployment

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

The production setup builds the client, serves it from nginx, and publishes no ports of its
own. A Caddy reverse proxy on the host handles HTTPS and routes the domain to it over a
shared Docker network.

For a new domain:

1. Set `DOMAIN` in the root `.env`.
2. Add a matching site block to the Caddy config.
3. Add `https://<domain>` to the OAuth client's authorized JavaScript origins in Google Cloud.

## API

| Method   | Route                       | Description                                 |
| -------- | --------------------------- | ------------------------------------------- |
| `POST` | `/auth/google`            | Exchange a Google token for a session token |
| `GET`  | `/data`                   | List the dates that have items              |
| `POST` | `/data`                   | Save items for a date                       |
| `GET`  | `/data/:year/:month/:day` | Get the items for one date                  |

Every `/data` route requires `Authorization: Bearer <token>`. In production, routes are
served under `/api`.

## License

[MIT](LICENSE)
