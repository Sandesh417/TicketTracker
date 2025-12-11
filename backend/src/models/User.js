const db = require("../utils/db");
const bcrypt = require("bcrypt");

const saltRounds = 10;

class User {
  static createTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('Admin', 'Developer', 'User'))
      );
    `;
    db.run(sql, (err) => {
      if (err) console.error("Users table creation error:", err.message);
    });
  }

  static create(username, password, role, callback) {
    bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
      if (err) return callback(err);
      const sql = `INSERT INTO users (username, password, role) VALUES (?, ?, ?)`;
      db.run(sql, [username, hashedPassword, role], function (err) {
        callback(err, this ? this.lastID : null);
      });
    });
  }

  static getAll(callback) {
    const sql = `SELECT id, username, role FROM users ORDER BY id`;
    db.all(sql, [], callback);
  }

  static getById(id, callback) {
    const sql = `SELECT id, username, role FROM users WHERE id = ?`;
    db.get(sql, [id], callback);
  }

  static getByUsername(username, callback) {
    const sql = `SELECT * FROM users WHERE username = ?`;
    db.get(sql, [username], callback);
  }

  static update(id, username, role, password, callback) {
    if (password) {
      bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
        if (err) return callback(err);
        const sql = `UPDATE users SET username = ?, role = ?, password = ? WHERE id = ?`;
        db.run(sql, [username, role, hashedPassword, id], function (err) {
          callback(err, this.changes);
        });
      });
    } else {
      const sql = `UPDATE users SET username = ?, role = ? WHERE id = ?`;
      db.run(sql, [username, role, id], function (err) {
        callback(err, this.changes);
      });
    }
  }

  static delete(id, callback) {
    const sql = `DELETE FROM users WHERE id = ?`;
    db.run(sql, [id], function (err) {
      callback(err, this.changes);
    });
  }
}

module.exports = User;
