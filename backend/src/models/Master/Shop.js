const db = require("../../utils/db");

class Shop {
  static createTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS Shop (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE,
        plantId INTEGER,
        FOREIGN KEY (plantId) REFERENCES Plant(id) ON DELETE SET NULL
      );
    `;
    db.run(sql, (err) => {
      if (err) console.error("Shop table creation error:", err.message);
    });
  }

  static create(name, plantId, callback) {
    const sql = `INSERT INTO Shop (name, plantId) VALUES (?, ?)`;
    db.run(sql, [name, plantId], function (err) {
      callback(err, this ? this.lastID : null);
    });
  }

  static getAll(callback) {
    const sql = `SELECT * FROM Shop`;
    db.all(sql, [], callback);
  }

  static getById(id, callback) {
    const sql = `SELECT * FROM Shop WHERE id = ?`;
    db.get(sql, [id], callback);
  }

  static update(id, name, plantId, callback) {
    const sql = `UPDATE Shop SET name = ?, plantId = ? WHERE id = ?`;
    db.run(sql, [name, plantId, id], function (err) {
      callback(err, this.changes);
    });
  }

  static delete(id, callback) {
    const sql = `DELETE FROM Shop WHERE id = ?`;
    db.run(sql, [id], function (err) {
      callback(err, this.changes);
    });
  }
}

module.exports = Shop;
