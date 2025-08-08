require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/reset', authRoutes);
app.use("/api/uploads", express.static(path.join(__dirname, "/uploads/")));



app.listen(3006, () => {
  console.log("🚀 Backend + Frontend dispo sur http://localhost:3006");
});

