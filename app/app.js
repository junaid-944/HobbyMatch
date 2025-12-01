// Import express.js
const express = require("express");

// Create express app
var app = express();

// Add static files location
app.use(express.static("static"));

// Get the functions in the db.js file to use
const db = require('./services/db');

// Use the Pug templating engine
app.set('view engine', 'pug');
app.set('views', './app/views');

// Create a route for root - /
app.get("/", function(req, res) {
    res.render("main");
});

// Route to display all users
app.get("/users", async function(req, res) {
    try {
        const sql = 'SELECT * FROM users';
        const users = await db.query(sql);
        res.render("users", { users: users });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.send("Error loading users");
    }
});

// Route to display all hobbies
app.get("/hobbies", async function(req, res) {
    try {
        const sql = 'SELECT * FROM hobbies';
        const hobbies = await db.query(sql);
        res.render("hobbies", { hobbies: hobbies });
    } catch (error) {
        console.error("Error fetching hobbies:", error);
        res.send("Error loading hobbies");
    }
});

// Route to display user hobbies
app.get("/user_hobbies", async function(req, res) {
    try {
        const sql = `SELECT u.user_id, u.username, GROUP_CONCAT(h.hobby_name SEPARATOR ', ') AS hobbies 
                     FROM users u 
                     LEFT JOIN user_hobbies uh ON u.user_id = uh.user_id 
                     LEFT JOIN hobbies h ON uh.hobby_id = h.hobby_id 
                     GROUP BY u.user_id`;
        const userHobbies = await db.query(sql);
        res.render("user_hobbies", { userHobbies: userHobbies });
    } catch (error) {
        console.error("Error fetching user hobbies:", error);
        res.send("Error loading user hobbies");
    }
});

// Route to display all matches
app.get("/matches", async function(req, res) {
    try {
        const sql = `SELECT m.match_id, u1.username AS user1, u2.username AS user2, m.matched_on 
                     FROM matches m 
                     JOIN users u1 ON m.user1_id = u1.user_id 
                     JOIN users u2 ON m.user2_id = u2.user_id`;
        const matches = await db.query(sql);
        res.render("matches", { matches: matches });
    } catch (error) {
        console.error("Error fetching matches:", error);
        res.send("Error loading matches");
    }
});

// Route to display all messages
app.get("/messages", async function(req, res) {
    try {
        const sql = `SELECT m.message_id, u1.username AS sender, u2.username AS receiver, m.message_text, m.sent_at 
                     FROM messages m 
                     JOIN users u1 ON m.sender_id = u1.user_id 
                     JOIN users u2 ON m.receiver_id = u2.user_id
                     ORDER BY m.sent_at DESC`;
        const messages = await db.query(sql);
        res.render("messages", { messages: messages });
    } catch (error) {
        console.error("Error fetching messages:", error);
        res.send("Error loading messages");
    }
});

// Route to display all reviews
app.get("/reviews", async function(req, res) {
    try {
        const sql = `SELECT r.review_id, u1.username AS reviewer, u2.username AS reviewed_user, r.rating, r.comments, r.created_at 
                     FROM reviews r 
                     JOIN users u1 ON r.reviewer_id = u1.user_id 
                     JOIN users u2 ON r.reviewed_user_id = u2.user_id
                     ORDER BY r.created_at DESC`;
        const reviews = await db.query(sql);
        res.render("reviews", { reviews: reviews });
    } catch (error) {
        console.error("Error fetching reviews:", error);
        res.send("Error loading reviews");
    }
});

// Route to display all events
app.get("/events", async function(req, res) {
    try {
        const sql = `SELECT e.event_id, e.event_name, e.event_date, e.location, u.username AS created_by 
                     FROM events e 
                     LEFT JOIN users u ON e.created_by = u.user_id
                     ORDER BY e.event_date ASC`;
        const events = await db.query(sql);
        res.render("events", { events: events });
    } catch (error) {
        console.error("Error fetching events:", error);
        res.send("Error loading events");
    }
});

// Route for dashboard showing all data
app.get("/dashboard", async function(req, res) {
    try {
        const users = await db.query('SELECT COUNT(*) as count FROM users');
        const hobbies = await db.query('SELECT COUNT(*) as count FROM hobbies');
        const matches = await db.query('SELECT COUNT(*) as count FROM matches');
        const messages = await db.query('SELECT COUNT(*) as count FROM messages');
        const reviews = await db.query('SELECT COUNT(*) as count FROM reviews');
        const events = await db.query('SELECT COUNT(*) as count FROM events');
        
        res.render("dashboard", {
            usersCount: users[0].count,
            hobbiesCount: hobbies[0].count,
            matchesCount: matches[0].count,
            messagesCount: messages[0].count,
            reviewsCount: reviews[0].count,
            eventsCount: events[0].count
        });
    } catch (error) {
        console.error("Error loading dashboard:", error);
        res.send("Error loading dashboard");
    }
});

// Start server on port 3000
app.listen(3000, function(){
    console.log(`Server running at http://127.0.0.1:3000/`);
    console.log(`Dashboard: http://127.0.0.1:3000/dashboard`);
});