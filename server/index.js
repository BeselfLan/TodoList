const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const {
    initializeDatabase,
    listDates,
    getItemsForDate,
    saveItemsForDate,
} = require('./database');

const app = express();
const port = process.env.PORT || 3000;

const JWT_SECRET = process.env.JWT_SECRET;
const SESSION_LIFETIME = '7d';

if (!JWT_SECRET) {
    console.error('JWT_SECRET is not set. Refusing to start.');
    process.exit(1);
}

const corsOptions = {
    origin: 'http://localhost:5173',
    optionSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());

app.get('/health', (req, res) => res.send('ok'));

const isValidDateString = (dateStr) => {
    if (typeof dateStr !== 'string') return false;

    const [year, month, day] = dateStr.split('/');

    if (!/^\d{4}$/.test(year) || !/^\d{2}$/.test(month) || !/^\d{2}$/.test(day)) {
        return false;
    }

    const date = new Date(Date.UTC(year, month - 1, day));
    return !isNaN(date.getTime()) &&
        year == date.getUTCFullYear() &&
        month == date.getUTCMonth() + 1 &&
        day == date.getUTCDate();
};

const normalizeDateKey = (rawKey) => {
    const parts = rawKey.includes('-') ? rawKey.split('-') : rawKey.split('/');
    if (parts.length !== 3) {
        throw new Error(`Invalid date key: ${rawKey}`);
    }

    let [year, month, day] = parts.map(String);
    month = month.padStart(2, '0');
    day = day.padStart(2, '0');

    const dateSlash = `${year}/${month}/${day}`;
    if (!isValidDateString(dateSlash)) {
        throw new Error(`Invalid date: ${dateSlash}. Expected format YYYY/MM/DD`);
    }

    return `${year}-${month}-${day}`;
};

const formatDateForClient = (dateKey) => dateKey.replace(/-/g, '/');
// Reads the session token issued by /auth/google and puts the verified
// user id on the request. Never trust a user id sent by the client.
const requireAuth = (req, res, next) => {
    const [scheme, token] = (req.get('authorization') || '').split(' ');

    if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({ status: 'error', message: 'Missing session token' });
    }

    try {
        req.userId = jwt.verify(token, JWT_SECRET).sub;
        next();
    } catch (err) {
        return res.status(401).json({ status: 'error', message: 'Invalid or expired session token' });
    }
};

app.get('/data', requireAuth, async (req, res) => {
    try {
        const userId = req.userId;
        const rows = await listDates(userId);
        res.json({ dates: rows.map((dateKey) => formatDateForClient(dateKey)) });
    } catch (err) {
        console.error('Failed to list dates:', err);
        res.status(500).json({ status: 'error', message: 'Failed to load dates from database' });
    }
});

app.post('/data', requireAuth, async (req, res) => {
    const payload = req.body;
    const userId = req.userId;

    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        return res.status(400).json({ status: 'error', message: 'Request body must be an object mapping date keys to arrays' });
    }

    const written = [];

    try {
        for (const [rawKey, items] of Object.entries(payload)) {
            const dateKey = normalizeDateKey(rawKey);
            const dateSlash = formatDateForClient(dateKey);

            if (!Array.isArray(items)) {
                throw new Error(`Expected an array of items for date ${rawKey}`);
            }

            for (const item of items) {
                if (item === null || typeof item !== 'object' || typeof item.id !== 'number' || typeof item.title !== 'string' || typeof item.content !== 'string') {
                    throw new Error(`Invalid item for date ${rawKey}`);
                }

                // completed is optional so older clients keep working; anything
                // other than a boolean is a bug worth rejecting.
                if (item.completed !== undefined && typeof item.completed !== 'boolean') {
                    throw new Error(`Invalid completed flag for date ${rawKey}`);
                }
            }

            await saveItemsForDate(userId, dateKey, items);
            written.push({ date: dateSlash, status: 'saved' });
        }

        res.json({ status: 'success', written });
    } catch (err) {
        console.error('Failed to write data:', err);
        res.status(500).json({ status: 'error', message: 'Failed to write data to database' });
    }
});

app.get('/data/:year/:month/:day', requireAuth, async (req, res) => {
    const { year, month, day } = req.params;
    const dateString = `${year}/${month}/${day}`;

    if (!isValidDateString(dateString)) {
        return res.status(400).json({
            status: 'error',
            message: 'Invalid date provided by client. Expected format YYYY/MM/DD',
        });
    }

    const dateKey = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

    try {
        const rows = await getItemsForDate(req.userId, dateKey);
        res.json(rows);
    } catch (err) {
        console.error('Failed to load items:', err);
        res.status(500).json({ status: 'error', message: 'Failed to load items from database' });
    }
});

app.post('/auth/google', async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ error: 'no token provided' });
    }

    console.log('Recieved Google Authentication Token.');
    console.log('Sending token to google ofr authentication');
    const url = `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(token)}`;
    const response = await fetch(url);
    const data = await response.json();

    console.log('successfully sent token to google');

    if ('error_description' in data || response.status !== 200) {
        console.log('ERROR: token format invalid')
        return res.status(401).json({ error: 'invalid token', details: data });
    }

    console.log('aud:', data.aud);
    console.log('expected:', process.env.VITE_GOOGLE_CLIENT_ID);

    if (data.aud !== process.env.VITE_GOOGLE_CLIENT_ID) {
        console.log("ERROR: token audience mismatch");
        return res.status(401).json({ error: 'token audience mismatch' });
    }

    console.log(`validated token! ${JSON.stringify(data)}`);
    const userId = data.email || data.sub;

    if (!userId) {
        return res.status(401).json({ error: 'token has no usable identity' });
    }

    // Google's token proved who they are; from here on the client uses our
    // own signed session token instead.
    const sessionToken = jwt.sign(
        { email: data.email || null },
        JWT_SECRET,
        { subject: userId, expiresIn: SESSION_LIFETIME },
    );

    res.json({
        ok: true,
        token: sessionToken,
        userId,
        email: data.email || null,
        message: 'Token Recieved and Validated',
    });
});

initializeDatabase()
    .then(() => {
        app.listen(port, () => console.log(`Server listening on http://localhost:${port}`));
    })
    .catch((err) => {
        console.error('Failed to initialize database:', err);
        process.exit(1);
    });
