# Todo List

A per-day todo list app with Google sign-in, built to learn React and full-stack development.
Each signed-in user gets their own lists, stored per date in PostgreSQL.

## Stack

**Frontend** (`client/`)

| | |
| --- | --- |
| Framework | React 19 |
| Routing | React Router |
| Build tool | Vite |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Auth | `@react-oauth/google` (Google OAuth) |
| Linting | ESLint |

**Backend** (`server/`)

| | |
| --- | --- |
| Runtime | Node.js |
| Framework | Express 5 |
| Database | PostgreSQL (via the `postgres` client) |
| Config | dotenv |

**Infrastructure**

| | |
| --- | --- |
| Containers | Docker Compose (postgres + server + client) |
| Prod web server | nginx (serves the built client) |

## Project structure

```
client/            React + Vite frontend
  src/components/  Home, LogIn, TodoList, Accordian, DateSelector
server/
  index.js         Express app and routes
  database/        PostgreSQL schema setup and queries
docker-compose.yml postgres, server, and client services
```

## Prerequisites

- Node.js 20+ and npm
- Docker + Docker Compose (for PostgreSQL, or for running the whole stack)
- A Google OAuth client ID from the [Google Cloud Console](https://console.cloud.google.com/apis/credentials)

## Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/BeselfLan/TodoList.git
   cd TodoList
   ```

2. Create `server/.env`:

   ```bash
   DATABASE_URL=postgres://todolist:todolist@localhost:5432/todolist
   VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
   JWT_SECRET=any-long-random-string
   PORT=3000
   CLIENT_ORIGIN=http://localhost:5173
   ```

   `CLIENT_ORIGIN` is the only browser origin allowed to call the API. It defaults to the
   Vite dev server, so it can be omitted locally, but it must be set to your real domain
   when deploying or the browser will block every request.

   The server signs session tokens with `JWT_SECRET` and refuses to start without it.
   Generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

3. Create `client/.env`:

   ```bash
   VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
   ```

   Both files are gitignored. The client ID must match in both, since the server verifies
   that the token audience matches its own `VITE_GOOGLE_CLIENT_ID`.

## Running in development

1. Start PostgreSQL:

   ```bash
   docker compose up -d postgres
   ```

   The server creates the `todo_items` table on startup, so there is no migration step.

2. Start the backend (http://localhost:3000):

   ```bash
   cd server
   npm install
   node index.js
   ```

3. Start the frontend (http://localhost:5173):

   ```bash
   cd client
   npm install
   npm run dev
   ```

Then open http://localhost:5173. The client calls the API at `http://localhost:3000`, and the
server only allows CORS requests from `http://localhost:5173`, so use those ports in development.

## Running with Docker

To build and run all three services at once, with live reload:

```bash
docker compose up --build
```

- Client: http://localhost:5173 (Vite dev server, hot module replacement)
- Server: http://localhost:3000 (`node --watch`, restarts on file change)
- PostgreSQL: `localhost:5432`

Compose automatically layers `docker-compose.override.yml` on top of `docker-compose.yml`.
The override bind-mounts `client/` and `server/` into their containers so edits on the host
take effect immediately.

`server/.env` must exist before running, since Compose loads it for the server service.

## Running in production

`docker-compose.prod.yml` builds the client for real, serves it with nginx, proxies the API
through that same nginx so the browser sees a single origin, and puts Caddy in front for
HTTPS. Name both files explicitly — this also keeps Compose from auto-loading the dev
override:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Requests flow like this:

```
browser ──443──> caddy ──> nginx ──┬─> /        built client from dist/
                                   └─> /api/*   Express (arrives as /data)
```

Only Caddy publishes ports. nginx, Express, and PostgreSQL are reachable only inside the
Compose network.

### Before the first deploy

1. Point your domain at the server with an `A` record (and `AAAA` if you have IPv6). Caddy
   cannot get a certificate until DNS resolves, so do this first.
2. Add `DOMAIN` to the root `.env`:

   ```bash
   DOMAIN=todo.example.com
   ```

   This is the single source of truth. Caddy requests a certificate for it, and the server's
   `CLIENT_ORIGIN` is derived from it as `https://$DOMAIN`, overriding the dev value in
   `server/.env`.
3. Add `https://your-domain` to the Authorized JavaScript origins of your Google OAuth
   client — sign-in fails without it.

Caddy obtains a Let's Encrypt certificate on first boot, redirects HTTP to HTTPS, and renews
automatically. Certificates live in the `caddy-data` volume; keep it, since Let's Encrypt
caps duplicate certificates at 5 per week.

To exercise the whole stack without a domain, set `DOMAIN=localhost`. Caddy then issues a
certificate from its own internal CA, so `curl -k https://localhost/` works end to end.

### Notes

Because the client and API share an origin, the browser never treats an API call as
cross-origin and CORS does not apply to the app's own requests. `CLIENT_ORIGIN` still
matters — it is what stops *other* sites from calling the API out of a visitor's browser.

The client is built with `VITE_API_URL=/api`. Vite inlines that at build time, so changing it
means rebuilding the image, not restarting the container.

If `/api/*` returns 502 while the site itself loads, the server container is down — check
`docker compose logs server`. nginx resolves the backend at request time, so it keeps serving
the static site instead of failing to start.

## Available scripts

Run these from `client/`:

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

The server has no build step — run it with `node index.js`.

## API

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/health` | Health check |
| `GET` | `/data` | List all dates that have items for the user |
| `POST` | `/data` | Save items, keyed by date (`YYYY/MM/DD` or `YYYY-MM-DD`) |
| `GET` | `/data/:year/:month/:day` | Get the items for one date |
| `POST` | `/auth/google` | Verify a Google access token and return the user ID |

Requests identify the user with an `x-user-id` header (or a `userId` query/body field);
requests without one fall back to the `anonymous` user.

## License

See [LICENSE](LICENSE).
