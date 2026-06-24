const express = require("express");
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;
const fs = require('fs');

const corsOptions = {
    origin: 'http://localhost:5173',
    optionSuccessStatus: 200
};

app.use(cors(corsOptions));

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

app.get("/data/:year/:month/:day", (req, res) => {
    // TODO: - for get requests, get the json from data and return it in req (store completed status for each todo item)
    //       - handle data updates (PUT & DELETE requests) from client
    //       - client will need to be modified to get default accordian cards from server

    // TODO:
    //      - Figure out how date stored in multiple dates are loaded (right now have to manually change date in clinet and only handles one date)
    //      - Figure out how to add/remove items stored in server.

    // open local file (to be replaced with database api call)

    const { year, month, day } = req.params;

    const isYearValid = /^\d{4}$/.test(year);
    const isMonthValid = /^\d{2}$/.test(month);
    const isDayValid = /^\d{2}$/.test(day);

    if (!isYearValid || !isMonthValid || !isDayValid) {
        return res.status(400).json({
            status: "error",
            message: "Invalid format. Expected /data/YYYY/MM/DD"
        });
    }

    // note: date will store month 0-indexed
    const date = new Date(Date.UTC(year, month - 1, day));

    // filter out invalid dates
    if (
        isNaN(date.getTime()) ||
        year != date.getUTCFullYear() ||
        month != date.getUTCMonth() + 1 ||
        day != date.getUTCDate()
    ) {
        return res.status(400).json({
            stats: 'error',
            message: 'Invalid date provided by client'
        });
    }

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
