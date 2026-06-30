const express = require("express");
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;
const fs = require('fs');
const path = require('path');

const corsOptions = {
    origin: 'http://localhost:5173',
    optionSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

app.get("/health", (req, res) => res.send("ok"));

app.get("/data", (req, res) => {
    fs.readFile('data/toLoad.json', 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({
                status: 'error',
                message: `unexpected server error: data/toLoad.json not found`
            });
        }
        res.json(JSON.parse(data));
    });
});

const isValidDateString = (dateStr) => {
    if (typeof dateStr !== 'string') return false;
    
    const [year, month, day] = dateStr.split('/');
    
    // Check format
    if (!/^\d{4}$/.test(year) || 
        !/^\d{2}$/.test(month) || 
        !/^\d{2}$/.test(day)) {
        return false;
    }
    
    // Check if it's an actual valid date
    const date = new Date(Date.UTC(year, month - 1, day));
    return !isNaN(date.getTime()) &&
           year == date.getUTCFullYear() &&
           month == date.getUTCMonth() + 1 &&
           day == date.getUTCDate();
}

app.post("/data", async (req, res) => {
    // Expect payload: object mapping date keys (YYYY-MM-DD or YYYY/MM/DD) -> array of items
    const payload = req.body;

    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        return res.status(400).json({ status: 'error', message: 'Request body must be an object mapping date keys to arrays' });
    }

    const toLoadPath = path.join('data', 'toLoad.json');
    let toLoad = { dates: [] };
    try {
        const raw = await fs.promises.readFile(toLoadPath, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.dates)) toLoad.dates = parsed.dates;
    } catch (err) {
        // If file doesn't exist or is invalid, we'll create it later
    }

    const written = [];

    try {
        for (const [rawKey, items] of Object.entries(payload)) {
            // accept YYYY-MM-DD or YYYY/MM/DD
            const parts = rawKey.includes('-') ? rawKey.split('-') : rawKey.split('/');
            if (parts.length !== 3) {
                return res.status(400).json({ status: 'error', message: `Invalid date key: ${rawKey}` });
            }
            let [year, month, day] = parts.map(String);
            month = month.padStart(2, '0');
            day = day.padStart(2, '0');

            const dateSlash = `${year}/${month}/${day}`;
            if (!isValidDateString(dateSlash)) {
                return res.status(400).json({ status: 'error', message: `Invalid date: ${dateSlash}. Expected format YYYY/MM/DD` });
            }

            if (!Array.isArray(items)) {
                return res.status(400).json({ status: 'error', message: `Expected an array of items for date ${rawKey}` });
            }

            for (const item of items) {
                if (item === null || typeof item !== 'object' || typeof item.id !== 'number' || typeof item.title !== 'string' || typeof item.content !== 'string') {
                    return res.status(400).json({ status: 'error', message: `Invalid item for date ${rawKey}` });
                }
            }

            const yearNum = String(Number(year));
            const monthNum = String(Number(month));
            const dayNum = String(Number(day));
            const dirPath = path.join('data', yearNum, monthNum, dayNum);
            await fs.promises.mkdir(dirPath, { recursive: true });

            const filePath = path.join(dirPath, 'testFile.json');
            await fs.promises.writeFile(filePath, JSON.stringify(items, null, 2), 'utf8');

            if (!toLoad.dates.includes(dateSlash)) toLoad.dates.push(dateSlash);

            written.push({ date: dateSlash, file: filePath });
        }

        // persist updated toLoad.json
        await fs.promises.mkdir(path.join('data'), { recursive: true });
        await fs.promises.writeFile(toLoadPath, JSON.stringify(toLoad, null, 2), 'utf8');

        res.json({ status: 'success', written });
    } catch (err) {
        console.error('Failed to write data files:', err);
        res.status(500).json({ status: 'error', message: 'Failed to write data files' });
    }
});

app.get("/data/:year/:month/:day", (req, res) => {
    // TODO: - for get requests, get the json from data and return it in req (store completed status for each todo item)
    //       - handle data updates (PUT & DELETE requests) from client
    //       - client will need to be modified to get default accordian cards from server

    // TODO:
    //      - Figure out how date stored in multiple dates are loaded (right now have to manually change date in clinet and only handles one date)
    //      - Figure out how to add/remove items stored in server.

    // TODO:
    //      - Add a button to save the todolist

    // open local file (to be replaced with database api call)

    const { year, month, day } = req.params;
    const dateString = `${year}/${month}/${day}`;

    if (!isValidDateString(dateString)) {
        return res.status(400).json({
            status: 'error',
            message: 'Invalid date provided by client. Expected format YYYY/MM/DD'
        });
    }

    // note: date will store month 0-indexed
    const date = new Date(Date.UTC(year, month - 1, day));

    fs.readFile(`data/${date.getUTCFullYear()}/${date.getUTCMonth() + 1}/${date.getUTCDate()}/testFile.json`, 'utf8',  (err, data) => {
        if (err) {
            return res.status(500).json({
                status: 'error',
                message: `unexpected server error: data/${date.getUTCFullYear()}/${date.getUTCMonth() + 1}/${date.getUTCDate()}/testFile.json not found`
            });
        }
        res.json(JSON.parse(data));
    });
});

app.listen(port, () => console.log(`Server listening on http://localhost:${port}`));
