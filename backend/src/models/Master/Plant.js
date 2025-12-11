const db = require("../../utils/db");

class Plant {
  static createTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS Plant (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE
      );
    `;
    db.run(sql, (err) => {
      if (err) console.error("Plant table creation error:", err.message);
    });
  }

  static create(name, callback) {
    const sql = `INSERT INTO Plant (name) VALUES (?)`;
    db.run(sql, [name], function (err) {
      callback(err, this ? this.lastID : null);
    });
  }

  static getAll(callback) {
    const sql = `SELECT * FROM Plant`;
    db.all(sql, [], callback);
  }

  static getById(id, callback) {
    const sql = `SELECT * FROM Plant WHERE id = ?`;
    db.get(sql, [id], callback);
  }

  static update(id, name, callback) {
    const sql = `UPDATE Plant SET name = ? WHERE id = ?`;
    db.run(sql, [name, id], function (err) {
      callback(err, this.changes);
    });
  }

  static delete(id, callback) {
    const sql = `DELETE FROM Plant WHERE id = ?`;
    db.run(sql, [id], function (err) {
      callback(err, this.changes);
    });
  }
}

module.exports = Plant;
