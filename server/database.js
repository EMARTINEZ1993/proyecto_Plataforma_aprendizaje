const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = process.env.DB_PATH
    ? path.resolve(process.env.DB_PATH)
    : path.resolve(__dirname, 'mlquest_v2.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initDb();
    }
});

function initDb() {
    db.serialize(() => {
        // Users Table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT,
            userid TEXT UNIQUE,
            useremail TEXT UNIQUE,
            userficha TEXT,
            role TEXT DEFAULT 'student',
            points INTEGER DEFAULT 0,
            level INTEGER DEFAULT 1,
            energy INTEGER DEFAULT 100,
            streak INTEGER DEFAULT 0,
            max_streak INTEGER DEFAULT 0,
            total_answered INTEGER DEFAULT 0,
            total_correct INTEGER DEFAULT 0,
            quiz_order TEXT,
            quiz_index INTEGER DEFAULT 0,
            last_login DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Backward-compatible migration for existing databases.
        db.all("PRAGMA table_info(users)", [], (err, columns) => {
            if (err) {
                console.error('Error reading users schema', err.message);
                return;
            }

            const existingColumnNames = new Set(columns.map((column) => column.name));
            const requiredColumns = [
                { name: 'last_login', definition: 'DATETIME' },
                { name: 'userid', definition: 'TEXT' },
                { name: 'useremail', definition: 'TEXT' },
                { name: 'userficha', definition: 'TEXT' },
                { name: 'quiz_order', definition: 'TEXT' },
                { name: 'quiz_index', definition: 'INTEGER DEFAULT 0' }
            ];

            const missingColumns = requiredColumns.filter((column) => !existingColumnNames.has(column.name));

            const addColumnsSequentially = (index = 0) => {
                if (index >= missingColumns.length) {
                    createIndexesSafely();
                    return;
                }

                const column = missingColumns[index];
                db.run(`ALTER TABLE users ADD COLUMN ${column.name} ${column.definition}`, (alterErr) => {
                    if (alterErr) {
                        console.error(`Error adding ${column.name} column`, alterErr.message);
                    }
                    addColumnsSequentially(index + 1);
                });
            };

            const createIndexesSafely = () => {
                db.run("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_userid_unique ON users(userid)", (idxErr) => {
                    if (idxErr) console.error('Error creating idx_users_userid_unique', idxErr.message);
                });
                db.run("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_useremail_unique ON users(useremail)", (idxErr) => {
                    if (idxErr) console.error('Error creating idx_users_useremail_unique', idxErr.message);
                });
            };

            addColumnsSequentially();
        });

        // User Items (Shop Purchases)
        db.run(`CREATE TABLE IF NOT EXISTS user_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            item_id TEXT,
            purchase_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )`);

        // Quiz History
        db.run(`CREATE TABLE IF NOT EXISTS quiz_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            score INTEGER,
            incorrect INTEGER,
            attempt_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )`);

        // Create default teacher account if not exists
        const teacherUser = 'profesor';
        const teacherPass = 'admin123';
        const teacherRole = 'teacher';
        
        db.get("SELECT * FROM users WHERE username = ?", [teacherUser], (err, row) => {
            if (!row) {
                const hashedPassword = bcrypt.hashSync(teacherPass, 8);
                db.run("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", 
                    [teacherUser, hashedPassword, teacherRole], (err) => {
                        if(err) console.log(err);
                        else console.log("Default teacher account created: profesor / admin123");
                    });
            }
        });
    });
}

module.exports = db;
