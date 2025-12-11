const db = require("../../utils/db");

class Line {
  static createTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS Line (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE,
        shopId INTEGER,
        FOREIGN KEY (shopId) REFERENCES Shop(id) ON DELETE SET NULL
      );
    `;
    db.run(sql, (err) => {
      if (err) console.error("Line table creation error:", err.message);
    });
  }

  static create(name, shopId, callback) {
    const sql = `INSERT INTO Line (name, shopId) VALUES (?, ?)`;
    db.run(sql, [name, shopId], function (err) {
      callback(err, this ? this.lastID : null);
    });
  }

  static getAll(callback) {
    const sql = `SELECT * FROM Line`;
    db.all(sql, [], callback);
  }

  static getById(id, callback) {
    const sql = `SELECT * FROM Line WHERE id = ?`;
    db.get(sql, [id], callback);
  }

  static update(id, name, shopId, callback) {
    const sql = `UPDATE Line SET name = ?, shopId = ? WHERE id = ?`;
    db.run(sql, [name, shopId, id], function (err) {
      callback(err, this.changes);
    });
  }

  static delete(id, callback) {
    const sql = `DELETE FROM Line WHERE id = ?`;
    db.run(sql, [id], function (err) {
      callback(err, this.changes);
    });
  }
}

module.exports = Line;
