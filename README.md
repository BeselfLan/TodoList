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
   ```

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

To build and run all three services at once:

```bash
docker compose up --build
```

- Client: http://localhost:5173 (nginx serving the production build)
- Server: http://localhost:3000
- PostgreSQL: `localhost:5432`

`server/.env` must exist before running, since Compose loads it for the server service.

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
