const db = require('../utils/db');

function formatNumber(num) {
  return 'TKT' + String(num).padStart(3, '0');
}

const Ticket = {
  createTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS Tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticketNumber TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        requestorName TEXT NOT NULL,
        mobileNumber TEXT DEFAULT '',
        projectId INTEGER NOT NULL,
        plantId INTEGER NOT NULL,
        shopId INTEGER,
        lineId INTEGER,
        machine TEXT,
        explanation TEXT NOT NULL,
        drfLink TEXT DEFAULT '',
        azureLink TEXT DEFAULT '',
        status TEXT DEFAULT 'created',
        assignedTo TEXT,
        assignedDate DATETIME,
        priority TEXT DEFAULT 'Medium',
        adminReview INTEGER DEFAULT 0,
        createdAt TEXT DEFAULT (datetime('now')),
        closedAt TEXT,
        remark TEXT DEFAULT '',
        history TEXT DEFAULT '[]',
        attachments TEXT DEFAULT '[]'
      )
    `;
    db.run(sql, (err) => {
      if (err) {
        console.error('Error creating Tickets table:', err);
      } else {
        console.log('Tickets table created successfully');
        this.migrateColumns();
      }
    });
  },

  migrateColumns() {
    db.all(`PRAGMA table_info(Tickets)`, (err, columns) => {
      if (err) {
        console.error('Error checking Tickets schema:', err);
        return;
      }
      
      const columnNames = columns.map(col => col.name);
      
      if (!columnNames.includes('adminReview')) {
        db.run(`ALTER TABLE Tickets ADD COLUMN adminReview INTEGER DEFAULT 0`, (err) => {
          if (err && !err.message.includes('duplicate column name')) {
            console.error('Error adding adminReview column:', err);
          } 
        });
      }
      
      if (!columnNames.includes('assignedDate')) {
        db.run(`ALTER TABLE Tickets ADD COLUMN assignedDate DATETIME`, (err) => {
          if (err && !err.message.includes('duplicate column name')) {
            console.error('Error adding assignedDate column:', err);
          } 
        });
      }

      if (!columnNames.includes('title')) {
        db.run(`ALTER TABLE Tickets ADD COLUMN title TEXT NOT NULL DEFAULT ''`, (err) => {
          if (err && !err.message.includes('duplicate column name')) {
            console.error('Error adding title column:', err);
          } 
        });
      }

      if (!columnNames.includes('drfLink')) {
        db.run(`ALTER TABLE Tickets ADD COLUMN drfLink TEXT DEFAULT ''`, (err) => {
          if (err && !err.message.includes('duplicate column name')) {
            console.error('Error adding drfLink column:', err);
          } 
        });
      }

      if (!columnNames.includes('azureLink')) {
        db.run(`ALTER TABLE Tickets ADD COLUMN azureLink TEXT DEFAULT ''`, (err) => {
          if (err && !err.message.includes('duplicate column name')) {
            console.error('Error adding azureLink column:', err);
          } 
        });
      }
    });
  },

  async create(data) {
    const ticketNumber = await generateNumber();
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO Tickets (ticketNumber, title, requestorName, mobileNumber, projectId, plantId,
          shopId, lineId, machine, explanation, drfLink, azureLink, status, assignedTo, assignedDate, priority,
          adminReview, createdAt, closedAt, remark, history, attachments)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), NULL, ?, ?, ?)
      `;
      
      // Sanitize mobileNumber - convert null/undefined to empty string
      const mobileNumber = data.mobileNumber?.toString().trim() || '';
      const machine = data.machine?.toString().trim() || '';
      
      const params = [
        ticketNumber,
        data.title || '',
        data.requestorName || '',
        mobileNumber,
        data.projectId,
        data.plantId,
        data.shopId || null,
        data.lineId || null,
        machine || null,
        data.explanation || '',
        data.drfLink || '',
        data.azureLink || '',
        data.status || 'created',
        data.assignedTo || null,
        data.assignedDate || null,
        data.priority || 'Medium',
        0,
        data.remark || '',
        JSON.stringify(data.history || []),
        JSON.stringify(data.attachments || [])
      ];
      
      console.log('=== MODEL CREATE PARAMS ===');
      console.log('ticketNumber:', ticketNumber);
      console.log('mobileNumber:', params[3], 'type:', typeof params[3]);
      console.log('shopId:', params[6], 'type:', typeof params[6]);
      console.log('lineId:', params[7], 'type:', typeof params[7]);
      console.log('machine:', params[8], 'type:', typeof params[8]);
      console.log('===========================');
      
      db.run(sql, params, function(err) {
        if (err) {
          console.error('Error inserting ticket:', err);
          reject(err);
          return;
        }
        resolve({
          id: this.lastID,
          ticketNumber,
          title: data.title || '',
          requestorName: data.requestorName || '',
          mobileNumber: mobileNumber,
          projectId: data.projectId,
          plantId: data.plantId,
          shopId: data.shopId || null,
          lineId: data.lineId || null,
          machine: machine || null,
          explanation: data.explanation || '',
          drfLink: data.drfLink || '',
          azureLink: data.azureLink || '',
          status: data.status || 'created',
          assignedTo: data.assignedTo || null,
          assignedDate: data.assignedDate || null,
          priority: data.priority || 'Medium',
          adminReview: 0,
          createdAt: new Date().toISOString(),
          closedAt: null,
          remark: data.remark || '',
          history: [],
          attachments: data.attachments || []
        });
      });
    });
  },

  getAll({ search = '' } = {}) {
    let sql = `
      SELECT Tickets.*,
        Project.name AS projectName,
        Plant.name AS plantName,
        Shop.name AS shopName,
        Line.name AS lineName
      FROM Tickets
      LEFT JOIN Project ON Tickets.projectId = Project.id
      LEFT JOIN Plant ON Tickets.plantId = Plant.id
      LEFT JOIN Shop ON Tickets.shopId = Shop.id
      LEFT JOIN Line ON Tickets.lineId = Line.id
    `;
    let params = [];
    if (search) {
      sql += ` WHERE ticketNumber LIKE ? OR requestorName LIKE ? OR explanation LIKE ? OR title LIKE ?`;
      const pattern = `%${search}%`;
      params = [pattern, pattern, pattern, pattern];
    }
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) {
          console.error('Error fetching tickets:', err);
          return reject(err);
        }
        rows.forEach(row => {
          row.title = row.title || '';
          row.drfLink = row.drfLink || '';
          row.azureLink = row.azureLink || '';
          try { 
            row.history = JSON.parse(row.history);
            row.history = row.history.map(comment => ({
              ...comment,
              attachments: comment.attachments || []
            }));
          } catch (e) { 
            console.error('Error parsing history:', e);
            row.history = []; 
          }
          try { 
            row.attachments = JSON.parse(row.attachments); 
          } catch (e) { 
            console.error('Error parsing attachments:', e);
            row.attachments = []; 
          }
        });
        resolve(rows);
      });
    });
  },

  getByTicketNumber(ticketNumber) {
    const sql = `
      SELECT Tickets.*,
        Project.name AS projectName,
        Plant.name AS plantName,
        Shop.name AS shopName,
        Line.name AS lineName
      FROM Tickets
      LEFT JOIN Project ON Tickets.projectId = Project.id
      LEFT JOIN Plant ON Tickets.plantId = Plant.id
      LEFT JOIN Shop ON Tickets.shopId = Shop.id
      LEFT JOIN Line ON Tickets.lineId = Line.id
      WHERE ticketNumber = ?
    `;
    return new Promise((resolve, reject) => {
      db.get(sql, [ticketNumber], (err, row) => {
        if (err) {
          console.error('Error fetching ticket by number:', err);
          return reject(err);
        }
        if (!row) return resolve(null);
        row.title = row.title || '';
        row.drfLink = row.drfLink || '';
        row.azureLink = row.azureLink || '';
        try { 
          row.history = JSON.parse(row.history);
          row.history = row.history.map(comment => ({
            ...comment,
            attachments: comment.attachments || []
          }));
        } catch (e) { 
          console.error('Error parsing history:', e);
          row.history = []; 
        }
        try { 
          row.attachments = JSON.parse(row.attachments); 
        } catch (e) { 
          console.error('Error parsing attachments:', e);
          row.attachments = []; 
        }
        resolve(row);
      });
    });
  },

  update(ticketNumber, updateFields) {
    const keys = Object.keys(updateFields);
    if (!keys.length) return Promise.resolve(false);
    
    const fields = keys.map(k => `${k} = ?`).join(', ');
    const values = keys.map(k =>
      ['history', 'attachments'].includes(k) ? JSON.stringify(updateFields[k]) : updateFields[k]
    );
    values.push(ticketNumber);
    const sql = `UPDATE Tickets SET ${fields} WHERE ticketNumber = ?`;
    return new Promise((resolve, reject) => {
      db.run(sql, values, function(err) {
        if (err) {
          console.error('Error updating ticket:', err);
          return reject(err);
        }
        resolve(this.changes > 0);
      });
    });
  },

  addHistoryComment(ticketNumber, text, user, attachments = []) {
    return this.getByTicketNumber(ticketNumber).then(ticket => {
      if (!ticket) throw new Error('Ticket not found');
      
      const comment = {
        id: Date.now(),
        text: text || '',
        date: new Date().toISOString(),
        user: user || ticket.assignedTo || 'N/A',
        attachments: attachments || []
      };
      
      const updatedHistory = [...(ticket.history || []), comment];
      const sql = `UPDATE Tickets SET history = ? WHERE ticketNumber = ?`;
      
      return new Promise((resolve, reject) => {
        db.run(sql, [JSON.stringify(updatedHistory), ticketNumber], function(err) {
          if (err) {
            console.error('Error updating ticket history:', err);
            return reject(err);
          }
          resolve(comment);
        });
      });
    });
  },

  editHistoryComment(ticketNumber, commentId, newText, user) {
    return this.getByTicketNumber(ticketNumber).then(ticket => {
      if (!ticket) throw new Error('Ticket not found');
      const updatedHistory = (ticket.history || []).map(c =>
        c.id === commentId ? { ...c, text: newText, user, editedAt: new Date().toISOString() } : c
      );
      const sql = `UPDATE Tickets SET history = ? WHERE ticketNumber = ?`;
      return new Promise((resolve, reject) => {
        db.run(sql, [JSON.stringify(updatedHistory), ticketNumber], function(err) {
          if (err) {
            console.error('Error editing ticket history:', err);
            return reject(err);
          }
          resolve();
        });
      });
    });
  },

  deleteHistoryComment(ticketNumber, commentId) {
    return this.getByTicketNumber(ticketNumber).then(ticket => {
      if (!ticket) throw new Error('Ticket not found');
      const updatedHistory = (ticket.history || []).filter(c => c.id !== commentId);
      const sql = `UPDATE Tickets SET history = ? WHERE ticketNumber = ?`;
      return new Promise((resolve, reject) => {
        db.run(sql, [JSON.stringify(updatedHistory), ticketNumber], function(err) {
          if (err) {
            console.error('Error deleting ticket history:', err);
            return reject(err);
          }
          resolve();
        });
      });
    });
  },

  updateRemark(ticketNumber, remarkText) {
    const sql = `UPDATE Tickets SET remark = ? WHERE ticketNumber = ?`;
    return new Promise((resolve, reject) => {
      db.run(sql, [remarkText, ticketNumber], function(err) {
        if (err) {
          console.error('Error updating remark:', err);
          return reject(err);
        }
        resolve(this.changes > 0);
      });
    });
  },

  delete(ticketNumber) {
    return new Promise((resolve, reject) => {
      db.run(`DELETE FROM Tickets WHERE ticketNumber = ?`, [ticketNumber], function(err) {
        if (err) {
          console.error('Error deleting ticket:', err);
          return reject(err);
        }
        resolve(this.changes > 0);
      });
    });
  },
};

// FIXED: Generate ticket number based on existing tickets, not just ID
async function generateNumber() {
  return new Promise((resolve, reject) => {
    // Query the highest ticket number from the database
    db.get(
      `SELECT ticketNumber FROM Tickets ORDER BY id DESC LIMIT 1`,
      [],
      (err, row) => {
        if (err) {
          console.error('Error getting max ticket number:', err);
          reject(err);
          return;
        }
        
        let next = 1;
        if (row && row.ticketNumber) {
          // Extract number from TKT001 format and increment
          const currentNum = parseInt(row.ticketNumber.replace('TKT', ''), 10);
          next = isNaN(currentNum) ? 1 : currentNum + 1;
        }
        
        const newTicketNumber = formatNumber(next);
        console.log('Generated ticket number:', newTicketNumber);
        resolve(newTicketNumber);
      }
    );
  });
}

module.exports = Ticket;
