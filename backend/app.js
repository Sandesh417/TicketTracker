const express = require("express");
const cors = require("cors");
const path = require("path"); 
const bodyParser = require("body-parser");

// Import routes with error checking
console.log('Loading routes...');

let plantRoutes, projectRoutes, shopRoutes, lineRoutes, machineRoutes, userRoutes, ticketRoutes;

try {
  plantRoutes = require("./src/routes/Master Routes/plantRoutes");
  console.log('✅ plantRoutes loaded:', typeof plantRoutes);
} catch(e) {
  console.error('❌ Error loading plantRoutes:', e.message);
}

try {
  projectRoutes = require("./src/routes/Master Routes/projectRoutes");
  console.log('✅ projectRoutes loaded:', typeof projectRoutes);
} catch(e) {
  console.error('❌ Error loading projectRoutes:', e.message);
}

try {
  shopRoutes = require("./src/routes/Master Routes/shopRoutes");
  console.log('✅ shopRoutes loaded:', typeof shopRoutes);
} catch(e) {
  console.error('❌ Error loading shopRoutes:', e.message);
}

try {
  lineRoutes = require("./src/routes/Master Routes/lineRoutes");
  console.log('✅ lineRoutes loaded:', typeof lineRoutes);
} catch(e) {
  console.error('❌ Error loading lineRoutes:', e.message);
}

try {
  machineRoutes = require("./src/routes/Master Routes/machineRoutes");
  console.log('✅ machineRoutes loaded:', typeof machineRoutes);
} catch(e) {
  console.error('❌ Error loading machineRoutes:', e.message);
}

try {
  userRoutes = require("./src/routes/userRoutes");
  console.log('✅ userRoutes loaded:', typeof userRoutes);
} catch(e) {
  console.error('❌ Error loading userRoutes:', e.message);
}

try {
  ticketRoutes = require("./src/routes/ticketsRoutes");
  console.log('✅ ticketRoutes loaded:', typeof ticketRoutes);
} catch(e) {
  console.error('❌ Error loading ticketRoutes:', e.message);
}

const app = express();

app.use(cors({
  origin: 'http://localhost:5174',
  credentials: true,
}));

app.use(bodyParser.json());

app.use('/uploads', express.static(path.join(__dirname, 'src/uploads')));
app.use('/api/uploads', express.static(path.join(__dirname, 'src/uploads')));

if (plantRoutes && typeof plantRoutes === 'function') {
  app.use("/api/master/plant", plantRoutes);
}
if (projectRoutes && typeof projectRoutes === 'function') {
  app.use("/api/master/project", projectRoutes);
}
if (shopRoutes && typeof shopRoutes === 'function') {
  app.use("/api/master/shop", shopRoutes);
}
if (lineRoutes && typeof lineRoutes === 'function') {
  app.use("/api/master/line", lineRoutes);
}
if (machineRoutes && typeof machineRoutes === 'function') {
  app.use("/api/master/machine", machineRoutes);
}
if (userRoutes && typeof userRoutes === 'function') {
  app.use("/api/users", userRoutes);
}
if (ticketRoutes && typeof ticketRoutes === 'function') {
  app.use("/api/tickets", ticketRoutes);
}

module.exports = app;
