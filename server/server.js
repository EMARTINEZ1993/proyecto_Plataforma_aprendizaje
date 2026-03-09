const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;
const SECRET_KEY = 'super_secret_key_mlquest'; // In prod, use env var

const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map((origin) => origin.trim())
    : null;

app.use(cors({
    origin: allowedOrigins || true
}));
app.use(express.json());

const normalizeIdentifier = (raw) => (typeof raw === 'string' ? raw.trim() : '');

// Middleware to verify token
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ message: 'No token provided' });

    jwt.verify(token.split(' ')[1], SECRET_KEY, (err, decoded) => {
        if (err) return res.status(500).json({ message: 'Failed to authenticate token' });
        req.userId = decoded.id;
        req.userRole = decoded.role;
        next();
    });
};

// Auth Routes
app.post('/api/register', (req, res) => {
    const { username, identifier, password, userid, useremail, userficha } = req.body;
    const resolvedUsername = normalizeIdentifier(username || identifier);
    const resolvedUserId = normalizeIdentifier(userid);
    const resolvedUserEmail = normalizeIdentifier(useremail).toLowerCase();
    const resolvedUserFicha = normalizeIdentifier(userficha);
    
    if (!resolvedUsername || !password || !resolvedUserId || !resolvedUserEmail || !resolvedUserFicha) {
        return res.status(400).json({ message: 'Missing required registration fields.' });
    }

    const hashedPassword = bcrypt.hashSync(password, 8);
    
    db.run(
        "INSERT INTO users (username, password, userid, useremail, userficha) VALUES (?, ?, ?, ?, ?)",
        [resolvedUsername, hashedPassword, resolvedUserId, resolvedUserEmail, resolvedUserFicha],
        function(err) {
            if (err) {
                if (String(err.message).includes('users.userid')) {
                    return res.status(409).json({ message: 'Document already registered.' });
                }
                if (String(err.message).includes('users.useremail')) {
                    return res.status(409).json({ message: 'Email already registered.' });
                }
                if (String(err.message).includes('users.username')) {
                    return res.status(409).json({ message: 'Username already registered.' });
                }
                return res.status(500).json({ message: 'Error registering user.' });
            }
        
            const token = jwt.sign({ id: this.lastID, role: 'student' }, SECRET_KEY, { expiresIn: 86400 }); // 24 hours
            res.status(200).json({
                auth: true,
                token,
                user: {
                    id: this.lastID,
                    username: resolvedUsername,
                    userid: resolvedUserId,
                    useremail: resolvedUserEmail,
                    userficha: resolvedUserFicha,
                    role: 'student',
                    points: 0,
                    level: 1
                }
            });
        }
    );
});

app.post('/api/login', (req, res) => {
    const { username, identifier, password } = req.body;
    const loginIdentifier = normalizeIdentifier(username || identifier);

    if (!loginIdentifier || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }
    
    db.get(
        "SELECT * FROM users WHERE LOWER(username) = LOWER(?) OR LOWER(COALESCE(useremail, '')) = LOWER(?) OR COALESCE(userid, '') = ?",
        [loginIdentifier, loginIdentifier, loginIdentifier],
        (err, user) => {
        if (err) return res.status(500).json({ message: 'Error on server.' });
        if (!user) return res.status(404).json({ message: 'User not found.' });
        
        const passwordIsValid = bcrypt.compareSync(password, user.password);
        if (!passwordIsValid) return res.status(401).json({ auth: false, token: null, message: 'Invalid password' });
        
        const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: 86400 });
        db.run("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?", [user.id], (updateErr) => {
            if (updateErr) console.error('Error updating last_login:', updateErr.message);
            res.status(200).json({ auth: true, token, user });
        });
    });
});

// User Data Routes
app.get('/api/user', verifyToken, (req, res) => {
    db.get("SELECT id, username, userid, useremail, userficha, role, points, level, energy, streak, max_streak, total_answered, total_correct, quiz_order, quiz_index FROM users WHERE id = ?", [req.userId], (err, user) => {
        if (err) return res.status(500).json({ message: 'Error finding user.' });
        if (!user) return res.status(404).json({ message: 'User not found.' });
        res.status(200).json(user);
    });
});

// Quiz State Routes (persist order/index between sessions/devices)
app.get('/api/quiz-state', verifyToken, (req, res) => {
    db.get("SELECT quiz_order, quiz_index FROM users WHERE id = ?", [req.userId], (err, row) => {
        if (err) return res.status(500).json({ message: 'Error fetching quiz state.' });
        if (!row) return res.status(404).json({ message: 'User not found.' });

        let order = null;
        if (row.quiz_order) {
            try {
                const parsed = JSON.parse(row.quiz_order);
                if (Array.isArray(parsed)) order = parsed;
            } catch (parseErr) {
                order = null;
            }
        }

        res.status(200).json({
            order,
            index: Number.isInteger(row.quiz_index) ? row.quiz_index : 0
        });
    });
});

app.post('/api/quiz-state', verifyToken, (req, res) => {
    const { order, index } = req.body;

    if (!Array.isArray(order) || !Number.isInteger(index) || index < 0) {
        return res.status(400).json({ message: 'Invalid quiz state payload.' });
    }

    db.run(
        "UPDATE users SET quiz_order = ?, quiz_index = ? WHERE id = ?",
        [JSON.stringify(order), index, req.userId],
        (err) => {
            if (err) return res.status(500).json({ message: 'Error saving quiz state.' });
            res.status(200).json({ message: 'Quiz state saved.' });
        }
    );
});

// Update Progress (Points, Level, Energy, Stats)
app.post('/api/progress', verifyToken, (req, res) => {
    const { points, level, energy, streak, maxStreak, totalAnswered, totalCorrect } = req.body;
    
    console.log('Updating progress for user:', req.userId, req.body);
    
    db.run("UPDATE users SET points = ?, level = ?, energy = ?, streak = ?, max_streak = ?, total_answered = ?, total_correct = ? WHERE id = ?", 
        [points, level, energy, streak, maxStreak, totalAnswered, totalCorrect, req.userId], 
        (err) => {
            if (err) {
                console.error('Error updating progress:', err);
                return res.status(500).json({ message: 'Error updating progress.' });
            }
            
            // Return updated user object to keep client in sync
            db.get("SELECT * FROM users WHERE id = ?", [req.userId], (err, user) => {
                 res.status(200).json({ message: 'Progress updated.', user });
            });
        });
});

// Record Quiz Attempt (Detailed History)
app.post('/api/quiz-history', verifyToken, (req, res) => {
    const { score, incorrect } = req.body;
    db.run("INSERT INTO quiz_history (user_id, score, incorrect) VALUES (?, ?, ?)", 
        [req.userId, score, incorrect], 
        (err) => {
            if (err) return res.status(500).json({ message: 'Error saving history.' });
            res.status(200).json({ message: 'History saved.' });
        });
});

// Shop: Buy Item
app.post('/api/shop/buy', verifyToken, (req, res) => {
    const { itemId, cost } = req.body;
    
    // Check points first
    db.get("SELECT points FROM users WHERE id = ?", [req.userId], (err, row) => {
        if (err || !row) return res.status(500).json({ message: 'Error checking points.' });
        
        if (row.points < cost) return res.status(400).json({ message: 'Not enough points.' });
        
        // Deduct points
        const newPoints = row.points - cost;
        db.run("UPDATE users SET points = ? WHERE id = ?", [newPoints, req.userId], (err) => {
            if (err) return res.status(500).json({ message: 'Error deducting points.' });
            
            // Add item
            // Check if already owned
            db.get("SELECT * FROM user_items WHERE user_id = ? AND item_id = ?", [req.userId, itemId], (err, item) => {
                 if (item) {
                     // Already owned, just refund? Or just do nothing.
                     // But we already deducted points.
                     // Assuming frontend prevents this.
                 }
                 
                 db.run("INSERT INTO user_items (user_id, item_id) VALUES (?, ?)", [req.userId, itemId], (err) => {
                    if (err) return res.status(500).json({ message: 'Error adding item.' });
                    res.status(200).json({ message: 'Item purchased.', newPoints });
                });
            });
        });
    });
});

// Get User Items
app.get('/api/shop/items', verifyToken, (req, res) => {
    db.all("SELECT item_id FROM user_items WHERE user_id = ?", [req.userId], (err, rows) => {
        if (err) return res.status(500).json({ message: 'Error fetching items.' });
        res.status(200).json(rows.map(row => row.item_id)); // Returns array of IDs
    });
});

// Teacher Dashboard Route
app.get('/api/teacher/students', verifyToken, (req, res) => {
    if (req.userRole !== 'teacher') return res.status(403).json({ message: 'Access denied.' });
    
    const query = `
        SELECT 
            u.id, u.username, u.userid, u.useremail, u.userficha, u.points, u.level, u.streak, u.max_streak, u.total_answered, u.last_login, u.created_at,
            (SELECT COUNT(*) FROM quiz_history WHERE user_id = u.id) as sessions_count
        FROM users u
        WHERE u.role = 'student'
    `;
    
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ message: 'Error fetching students.' });
        res.status(200).json(rows);
    });
});

// Teacher: Reset student password to a temporary code
app.post('/api/teacher/students/:studentId/reset-password', verifyToken, (req, res) => {
    if (req.userRole !== 'teacher') return res.status(403).json({ message: 'Access denied.' });

    const studentId = Number(req.params.studentId);
    if (!Number.isInteger(studentId) || studentId <= 0) {
        return res.status(400).json({ message: 'Invalid student id.' });
    }

    db.get("SELECT id FROM users WHERE id = ? AND role = 'student'", [studentId], (err, row) => {
        if (err) return res.status(500).json({ message: 'Error validating student.' });
        if (!row) return res.status(404).json({ message: 'Student not found.' });

        const tempPassword = String(crypto.randomInt(100000, 1000000));
        const hashedPassword = bcrypt.hashSync(tempPassword, 8);

        db.run("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, studentId], (updateErr) => {
            if (updateErr) return res.status(500).json({ message: 'Error resetting password.' });
            res.status(200).json({ message: 'Password reset successful.', tempPassword });
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
