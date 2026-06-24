const express = require("express");
const app = express();
const cors = require('cors');
const allowedOrigins = [
  "http://localhost:5173",
  "https://book-api-frontend.vercel.app",
];
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());
const adminPostRoutes = require("./routes/adminPostRoutes");
const publicPostRoutes = require("./routes/publicPostRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");

app.use("/posts", publicPostRoutes);
app.use("/admin/posts", adminPostRoutes);
app.use("/auth", authRoutes);
app.use("/users", userRoutes)

const PORT = 3000;
app.listen(3000, (error) => {
  if (error) {
    throw error;
  }
  console.log(`Odin book - listening on port ${PORT}!`);
});