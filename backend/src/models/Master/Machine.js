const db = require("../../utils/db");

class Machine {
  static createTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS Machine (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE,
        lineId INTEGER,
        FOREIGN KEY (lineId) REFERENCES Line(id) ON DELETE SET NULL
      );
    `;
    db.run(sql, (err) => {
      if (err) console.error("Machine table creation error:", err.message);
    });
  }

  static create(name, lineId, callback) {
    const sql = `INSERT INTO Machine (name, lineId) VALUES (?, ?)`;
    db.run(sql, [name, lineId], function (err) {
      callback(err, this ? this.lastID : null);
    });
  }

  static getAll(callback) {
    const sql = `SELECT * FROM Machine`;
    db.all(sql, [], callback);
  }

  static getById(id, callback) {
    const sql = `SELECT * FROM Machine WHERE id = ?`;
    db.get(sql, [id], callback);
  }

  static update(id, name, lineId, callback) {
    const sql = `UPDATE Machine SET name = ?, lineId = ? WHERE id = ?`;
    db.run(sql, [name, lineId, id], function (err) {
      callback(err, this.changes);
    });
  }

  static delete(id, callback) {
    const sql = `DELETE FROM Machine WHERE id = ?`;
    db.run(sql, [id], function (err) {
      callback(err, this.changes);
    });
  }
}

module.exports = Machine;
