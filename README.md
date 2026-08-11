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
| Testing | Vitest + Testing Library |
| Linting | ESLint |

**Backend** (`server/`)

| | |
| --- | --- |
| Runtime | Node.js |
| Framework | Express 5 |
| Database | PostgreSQL (via the `postgres` client) |
| Sessions | JWT (`jsonwebtoken`), issued after Google verifies the user |
| Rate limiting | `express-rate-limit` on the sign-in route |
| Testing | Vitest + supertest |
| Config | dotenv |

**Infrastructure**

| | |
| --- | --- |
| Containers | Docker Compose (postgres + server + client, plus caddy in production) |
| Prod web server | nginx — serves the built client and proxies `/api/*` to the server |
| TLS | Caddy — automatic Let's Encrypt certificates and HTTP→HTTPS redirect |

## Project structure

```
client/
  src/components/            Home, LogIn, TodoList, Accordian, DateSelector
  src/tests/                 Component and routing tests
  Dockerfile                 Two stages: Vite build, then nginx serving the result
  nginx.conf                 Serves the built client, proxies /api/* to the server
server/
  index.js                   Entrypoint: opens the database, then starts listening
  app.js                     Express app and routes, built by a factory so tests
                             can inject a fake database
  database/                  PostgreSQL schema setup and queries
  tests/                     API tests
Caddyfile                    TLS and HTTPS redirect, production only
docker-compose.yml           Base: postgres, server, client
docker-compose.override.yml  Development: live reload. Loaded automatically
docker-compose.prod.yml      Production: built client, Caddy, no exposed app ports
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

2. Create `.env` in the repository root. Docker Compose reads this one to fill in the
   `${...}` placeholders in `docker-compose.yml`, so any `docker compose` command fails
   without it:

   ```bash
   POSTGRES_DB=todolist
   POSTGRES_USER=todolist
   POSTGRES_PASSWORD=generate-your-own
   ```

   Generate the password with `openssl rand -hex 24`. `DOMAIN` also belongs here, but only
   matters in production — see [Running in production](#running-in-production).

3. Create `server/.env`. This is the file the Node process itself loads, via dotenv:

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

4. Create `client/.env`:

   ```bash
   VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
   ```

   All three `.env` files are gitignored. The client ID must match in `server/.env` and
   `client/.env`, since the server verifies that the token audience matches its own
   `VITE_GOOGLE_CLIENT_ID`.

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

All three ports are published on `127.0.0.1` rather than every interface, so nothing is
reachable from the network. On a remote machine, forward the port over SSH instead:

```bash
ssh -L 5173:localhost:5173 you@your-server
```

Both `.env` and `server/.env` must exist before running: Compose reads the first for the
Postgres credentials and passes the second to the server service.

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

`POST /auth/google` is capped at 10 requests per IP per 15 minutes. It is the only
unauthenticated route and it calls Google on every request, so an uncapped one lets anyone
use this server to hammer Google's tokeninfo endpoint. Counting per IP only works because
`TRUST_PROXY=2` tells Express how many proxies (Caddy, then nginx) sit in front of it —
without that, every request looks like it came from nginx and one visitor's burst would
lock out everyone.

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
| `npm test` | Run the component and routing tests in watch mode |
| `npm run test:run` | Run them once and exit |

And from `server/`:

| Command | Description |
| --- | --- |
| `npm start` | Start the API (`node index.js`) |
| `npm test` | Run the API tests in watch mode |
| `npm run test:run` | Run them once and exit |

The server has no build step.

## Testing

```bash
cd server && npm run test:run
cd client && npm run test:run
```

Neither suite needs a database or a network. `server/app.js` exports a factory rather than a
ready-made app, so the tests call `createApp({ db })` with a fake database — the real
`./database` module is never imported, and `server/tests/setup.js` refuses to run if
`DATABASE_URL` points anywhere that isn't local.

## API

| Method | Route | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/health` | — | Health check |
| `POST` | `/auth/google` | — | Exchange a Google access token for a session token |
| `GET` | `/data` | Bearer | List all dates that have items for the signed-in user |
| `POST` | `/data` | Bearer | Save items, keyed by date (`YYYY/MM/DD` or `YYYY-MM-DD`) |
| `GET` | `/data/:year/:month/:day` | Bearer | Get the items for one date |

Sign-in works in two steps. The client sends its Google access token to `/auth/google`, which
verifies it with Google and checks that the audience matches `VITE_GOOGLE_CLIENT_ID`. It then
returns a session token — a JWT this server signs itself with `JWT_SECRET`, valid for 7 days.
Every later request carries it:

```
Authorization: Bearer <token>
```

The user id is read from that token's `sub` claim and never from anything else the client
sends, so a request cannot ask for another user's data. Requests with no token, a token
signed with a different secret, or an expired one get a `401` and never reach the database.

`/auth/google` allows 10 requests per IP per 15 minutes; going over returns `429`.

In production every route sits behind `/api`, since nginx strips that prefix before
forwarding — `GET https://your-domain/api/data` arrives at Express as `GET /data`. Running
the server directly, there is no prefix.

## License

See [LICENSE](LICENSE).
