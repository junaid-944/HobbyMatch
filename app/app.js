// Import required modules
const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const bcrypt = require("bcryptjs");

// Create express app
var app = express();

// Middleware setup
app.use(express.static("static"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Session setup
app.use(session({
    secret: 'hobbymatch_secret_key_2025',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Get the database functions
const db = require('./services/db');

// Use the Pug templating engine
app.set('view engine', 'pug');
app.set('views', './app/views');

// Middleware to check if user is logged in
function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        next();
    } else {
        res.redirect('/login');
    }
}

// ================= AUTH ROUTES =================

// Login page
app.get("/login", function(req, res) {
    res.render("auth/login");
});

// Login POST
app.post("/login", async function(req, res) {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.render("auth/login", { error: "Username and password required" });
    }

    try {
        const sql = 'SELECT * FROM users WHERE username = ?';
        const users = await db.query(sql, [username]);
        
        if (users.length === 0) {
            return res.render("auth/login", { error: "Invalid credentials" });
        }

        const user = users[0];
        const passwordMatch = await bcrypt.compare(password, user.password_hash);

        if (!passwordMatch) {
            return res.render("auth/login", { error: "Invalid credentials" });
        }

        // Set session
        req.session.userId = user.user_id;
        req.session.username = user.username;
        res.redirect("/dashboard");
    } catch (error) {
        console.error("Login error:", error);
        res.render("auth/login", { error: "An error occurred" });
    }
});

// Signup page
app.get("/signup", function(req, res) {
    res.render("auth/signup");
});

// Signup POST
app.post("/signup", async function(req, res) {
    const { username, email, password, location } = req.body;
    
    if (!username || !email || !password) {
        return res.render("auth/signup", { error: "All fields required" });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = 'INSERT INTO users (username, email, password_hash, location) VALUES (?, ?, ?, ?)';
        await db.query(sql, [username, email, hashedPassword, location || null]);
        
        res.redirect("/login?message=Account created! Please login.");
    } catch (error) {
        console.error("Signup error:", error);
        if (error.code === 'ER_DUP_ENTRY') {
            res.render("auth/signup", { error: "Username or email already exists" });
        } else {
            res.render("auth/signup", { error: "An error occurred" });
        }
    }
});

// Logout
app.get("/logout", function(req, res) {
    req.session.destroy();
    res.redirect("/login");
});

// ================= PROTECTED ROUTES (Require Login) =================

// Home/Dashboard
app.get("/", isAuthenticated, function(req, res) {
    res.redirect("/dashboard");
});

app.get("/dashboard", isAuthenticated, async function(req, res) {
    try {
        const users = await db.query('SELECT COUNT(*) as count FROM users');
        const hobbies = await db.query('SELECT COUNT(*) as count FROM hobbies');
        const matches = await db.query('SELECT COUNT(*) as count FROM matches');
        const messages = await db.query('SELECT COUNT(*) as count FROM messages');
        const reviews = await db.query('SELECT COUNT(*) as count FROM reviews');
        const events = await db.query('SELECT COUNT(*) as count FROM events');
        
        res.render("dashboard", {
            username: req.session.username,
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

// ================= USERS ROUTES =================

// List users with search
app.get("/users", isAuthenticated, async function(req, res) {
    try {
        const search = req.query.search || '';
        let sql = 'SELECT * FROM users';
        let params = [];

        if (search) {
            sql += ' WHERE username LIKE ? OR email LIKE ? OR location LIKE ?';
            params = [`%${search}%`, `%${search}%`, `%${search}%`];
        }

        const users = await db.query(sql, params);
        res.render("users", { users: users, search: search });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.send("Error loading users");
    }
});

// Add user form
app.get("/users/add", isAuthenticated, function(req, res) {
    res.render("users/add");
});

// Add user POST
app.post("/users/add", isAuthenticated, async function(req, res) {
    const { username, email, password, location } = req.body;
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = 'INSERT INTO users (username, email, password_hash, location) VALUES (?, ?, ?, ?)';
        await db.query(sql, [username, email, hashedPassword, location]);
        res.redirect("/users?message=User added successfully");
    } catch (error) {
        console.error("Error adding user:", error);
        res.render("users/add", { error: "Error adding user" });
    }
});

// Edit user form
app.get("/users/edit/:id", isAuthenticated, async function(req, res) {
    try {
        const sql = 'SELECT * FROM users WHERE user_id = ?';
        const users = await db.query(sql, [req.params.id]);
        if (users.length === 0) {
            return res.send("User not found");
        }
        res.render("users/edit", { user: users[0] });
    } catch (error) {
        console.error("Error fetching user:", error);
        res.send("Error loading user");
    }
});

// Edit user POST
app.post("/users/edit/:id", isAuthenticated, async function(req, res) {
    const { username, email, location } = req.body;
    
    try {
        const sql = 'UPDATE users SET username = ?, email = ?, location = ? WHERE user_id = ?';
        await db.query(sql, [username, email, location, req.params.id]);
        res.redirect("/users?message=User updated successfully");
    } catch (error) {
        console.error("Error updating user:", error);
        res.send("Error updating user");
    }
});

// Delete user
app.get("/users/delete/:id", isAuthenticated, async function(req, res) {
    try {
        const sql = 'DELETE FROM users WHERE user_id = ?';
        await db.query(sql, [req.params.id]);
        res.redirect("/users?message=User deleted successfully");
    } catch (error) {
        console.error("Error deleting user:", error);
        res.send("Error deleting user");
    }
});

// ================= HOBBIES ROUTES =================

// List hobbies with search
app.get("/hobbies", isAuthenticated, async function(req, res) {
    try {
        const search = req.query.search || '';
        let sql = 'SELECT * FROM hobbies';
        let params = [];

        if (search) {
            sql += ' WHERE hobby_name LIKE ?';
            params = [`%${search}%`];
        }

        const hobbies = await db.query(sql, params);
        res.render("hobbies", { hobbies: hobbies, search: search });
    } catch (error) {
        console.error("Error fetching hobbies:", error);
        res.send("Error loading hobbies");
    }
});

// Add hobby form
app.get("/hobbies/add", isAuthenticated, function(req, res) {
    res.render("hobbies/add");
});

// Add hobby POST
app.post("/hobbies/add", isAuthenticated, async function(req, res) {
    const { hobby_name } = req.body;
    
    try {
        const sql = 'INSERT INTO hobbies (hobby_name) VALUES (?)';
        await db.query(sql, [hobby_name]);
        res.redirect("/hobbies?message=Hobby added successfully");
    } catch (error) {
        console.error("Error adding hobby:", error);
        res.render("hobbies/add", { error: "Error adding hobby" });
    }
});

// Edit hobby form
app.get("/hobbies/edit/:id", isAuthenticated, async function(req, res) {
    try {
        const sql = 'SELECT * FROM hobbies WHERE hobby_id = ?';
        const hobbies = await db.query(sql, [req.params.id]);
        if (hobbies.length === 0) {
            return res.send("Hobby not found");
        }
        res.render("hobbies/edit", { hobby: hobbies[0] });
    } catch (error) {
        console.error("Error fetching hobby:", error);
        res.send("Error loading hobby");
    }
});

// Edit hobby POST
app.post("/hobbies/edit/:id", isAuthenticated, async function(req, res) {
    const { hobby_name } = req.body;
    
    try {
        const sql = 'UPDATE hobbies SET hobby_name = ? WHERE hobby_id = ?';
        await db.query(sql, [hobby_name, req.params.id]);
        res.redirect("/hobbies?message=Hobby updated successfully");
    } catch (error) {
        console.error("Error updating hobby:", error);
        res.send("Error updating hobby");
    }
});

// Delete hobby
app.get("/hobbies/delete/:id", isAuthenticated, async function(req, res) {
    try {
        const sql = 'DELETE FROM hobbies WHERE hobby_id = ?';
        await db.query(sql, [req.params.id]);
        res.redirect("/hobbies?message=Hobby deleted successfully");
    } catch (error) {
        console.error("Error deleting hobby:", error);
        res.send("Error deleting hobby");
    }
});

// ================= USER HOBBIES ROUTES =================

app.get("/user_hobbies", isAuthenticated, async function(req, res) {
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

// ================= MATCHES ROUTES =================

app.get("/matches", isAuthenticated, async function(req, res) {
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

// Add match form
app.get("/matches/add", isAuthenticated, async function(req, res) {
    try {
        const users = await db.query('SELECT * FROM users');
        res.render("matches/add", { users: users });
    } catch (error) {
        console.error("Error loading form:", error);
        res.send("Error loading form");
    }
});

// Add match POST
app.post("/matches/add", isAuthenticated, async function(req, res) {
    const { user1_id, user2_id } = req.body;
    
    try {
        const sql = 'INSERT INTO matches (user1_id, user2_id) VALUES (?, ?)';
        await db.query(sql, [user1_id, user2_id]);
        res.redirect("/matches?message=Match created successfully");
    } catch (error) {
        console.error("Error adding match:", error);
        res.send("Error adding match");
    }
});

// Delete match
app.get("/matches/delete/:id", isAuthenticated, async function(req, res) {
    try {
        const sql = 'DELETE FROM matches WHERE match_id = ?';
        await db.query(sql, [req.params.id]);
        res.redirect("/matches?message=Match deleted successfully");
    } catch (error) {
        console.error("Error deleting match:", error);
        res.send("Error deleting match");
    }
});

// ================= MESSAGES ROUTES =================

app.get("/messages", isAuthenticated, async function(req, res) {
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

// Add message form
app.get("/messages/add", isAuthenticated, async function(req, res) {
    try {
        const users = await db.query('SELECT * FROM users');
        res.render("messages/add", { users: users });
    } catch (error) {
        console.error("Error loading form:", error);
        res.send("Error loading form");
    }
});

// Add message POST
app.post("/messages/add", isAuthenticated, async function(req, res) {
    const { sender_id, receiver_id, message_text } = req.body;
    
    try {
        const sql = 'INSERT INTO messages (sender_id, receiver_id, message_text) VALUES (?, ?, ?)';
        await db.query(sql, [sender_id, receiver_id, message_text]);
        res.redirect("/messages?message=Message sent successfully");
    } catch (error) {
        console.error("Error sending message:", error);
        res.send("Error sending message");
    }
});

// Delete message
app.get("/messages/delete/:id", isAuthenticated, async function(req, res) {
    try {
        const sql = 'DELETE FROM messages WHERE message_id = ?';
        await db.query(sql, [req.params.id]);
        res.redirect("/messages?message=Message deleted successfully");
    } catch (error) {
        console.error("Error deleting message:", error);
        res.send("Error deleting message");
    }
});

// ================= REVIEWS ROUTES =================

app.get("/reviews", isAuthenticated, async function(req, res) {
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

// Add review form
app.get("/reviews/add", isAuthenticated, async function(req, res) {
    try {
        const users = await db.query('SELECT * FROM users');
        res.render("reviews/add", { users: users });
    } catch (error) {
        console.error("Error loading form:", error);
        res.send("Error loading form");
    }
});

// Add review POST
app.post("/reviews/add", isAuthenticated, async function(req, res) {
    const { reviewer_id, reviewed_user_id, rating, comments } = req.body;
    
    try {
        const sql = 'INSERT INTO reviews (reviewer_id, reviewed_user_id, rating, comments) VALUES (?, ?, ?, ?)';
        await db.query(sql, [reviewer_id, reviewed_user_id, rating, comments]);
        res.redirect("/reviews?message=Review added successfully");
    } catch (error) {
        console.error("Error adding review:", error);
        res.send("Error adding review");
    }
});

// Delete review
app.get("/reviews/delete/:id", isAuthenticated, async function(req, res) {
    try {
        const sql = 'DELETE FROM reviews WHERE review_id = ?';
        await db.query(sql, [req.params.id]);
        res.redirect("/reviews?message=Review deleted successfully");
    } catch (error) {
        console.error("Error deleting review:", error);
        res.send("Error deleting review");
    }
});

// ================= EVENTS ROUTES =================

app.get("/events", isAuthenticated, async function(req, res) {
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

// Add event form
app.get("/events/add", isAuthenticated, async function(req, res) {
    try {
        const users = await db.query('SELECT * FROM users');
        res.render("events/add", { users: users });
    } catch (error) {
        console.error("Error loading form:", error);
        res.send("Error loading form");
    }
});

// Add event POST
app.post("/events/add", isAuthenticated, async function(req, res) {
    const { event_name, event_date, location, created_by } = req.body;
    
    try {
        const sql = 'INSERT INTO events (event_name, event_date, location, created_by) VALUES (?, ?, ?, ?)';
        await db.query(sql, [event_name, event_date, location, created_by]);
        res.redirect("/events?message=Event added successfully");
    } catch (error) {
        console.error("Error adding event:", error);
        res.send("Error adding event");
    }
});

// Edit event form
app.get("/events/edit/:id", isAuthenticated, async function(req, res) {
    try {
        const users = await db.query('SELECT * FROM users');
        const sql = 'SELECT * FROM events WHERE event_id = ?';
        const events = await db.query(sql, [req.params.id]);
        if (events.length === 0) {
            return res.send("Event not found");
        }
        res.render("events/edit", { event: events[0], users: users });
    } catch (error) {
        console.error("Error fetching event:", error);
        res.send("Error loading event");
    }
});

// Edit event POST
app.post("/events/edit/:id", isAuthenticated, async function(req, res) {
    const { event_name, event_date, location, created_by } = req.body;
    
    try {
        const sql = 'UPDATE events SET event_name = ?, event_date = ?, location = ?, created_by = ? WHERE event_id = ?';
        await db.query(sql, [event_name, event_date, location, created_by, req.params.id]);
        res.redirect("/events?message=Event updated successfully");
    } catch (error) {
        console.error("Error updating event:", error);
        res.send("Error updating event");
    }
});

// Delete event
app.get("/events/delete/:id", isAuthenticated, async function(req, res) {
    try {
        const sql = 'DELETE FROM events WHERE event_id = ?';
        await db.query(sql, [req.params.id]);
        res.redirect("/events?message=Event deleted successfully");
    } catch (error) {
        console.error("Error deleting event:", error);
        res.send("Error deleting event");
    }
});

// Start server
app.listen(3000, function(){
    console.log(`Server running at http://127.0.0.1:3000/`);
    console.log(`Login: http://127.0.0.1:3000/login`);
});