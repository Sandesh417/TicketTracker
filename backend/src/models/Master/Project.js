const db = require("../../utils/db");

class Project {
  static createTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS Project (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE
      );
    `;
    db.run(sql, (err) => {
      if (err) console.error("Project table creation error:", err.message);
    });
  }

  static create(name, callback) {
    const sql = `INSERT INTO Project (name) VALUES (?)`;
    db.run(sql, [name], function (err) {
      callback(err, this ? this.lastID : null);
    });
  }

  static getAll(callback) {
    const sql = `SELECT * FROM Project`;
    db.all(sql, [], callback);
  }

  static getById(id, callback) {
    const sql = `SELECT * FROM Project WHERE id = ?`;
    db.get(sql, [id], callback);
  }

  static update(id, name, callback) {
    const sql = `UPDATE Project SET name = ? WHERE id = ?`;
    db.run(sql, [name, id], function (err) {
      callback(err, this.changes);
    });
  }

  static delete(id, callback) {
    const sql = `DELETE FROM Project WHERE id = ?`;
    db.run(sql, [id], function (err) {
      callback(err, this.changes);
    });
  }
}

module.exports = Project;
