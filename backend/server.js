require('dotenv').config();
const fs = require("fs");
const path = require("path");

const app = require('./app');
const User = require("./src/models/User");
const Shop = require("./src/models/Master/Shop");
const Plant = require("./src/models/Master/Plant");
const Line = require("./src/models/Master/Line");
const Machine = require("./src/models/Master/Machine");
const Project = require("./src/models/Master/Project");
const Ticket = require("./src/models/Ticket");

const PORT = process.env.PORT || 3001;


User.createTable();
Shop.createTable();
Machine.createTable();
Plant.createTable();
Line.createTable();
Project.createTable();
Ticket.createTable();  


app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});

