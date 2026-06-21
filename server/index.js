const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
app.get("/health", (req, res) => res.send("ok"));
app.listen(port, () => console.log(`Server listening on http://localhost:${port}`));
