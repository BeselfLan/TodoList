// Entrypoint: everything that binds a port or opens a connection lives here,
// so app.js stays importable by tests without starting a server.
const createApp = require('./app');
const { initializeDatabase } = require('./database');

const port = process.env.PORT || 3000;
const app = createApp();

initializeDatabase()
    .then(() => {
        app.listen(port, () => console.log(`Server listening on http://localhost:${port}`));
    })
    .catch((err) => {
        console.error('Failed to initialize database:', err);
        process.exit(1);
    });
