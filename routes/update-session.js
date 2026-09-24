const db = require('../db'); // '../db' goes up one level to find db.js in your root folder

async function run() {
    try {
        // We use db.query directly because db.js already exports a promise pool!
        await db.query("UPDATE live_sessions SET zoom_meeting_id = '123456789' WHERE session_id = 1");
        console.log("Successfully updated session 1 with Zoom Meeting ID: 123456789!");
        process.exit(0);
    } catch (err) {
        console.error("Error updating session:", err);
        process.exit(1);
    }
}

run();