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
// const postRoutes = require("./routes/postRoutes");
// const publicPostRoutes = require("./routes/publicPostRoutes");
const authRoutes = require("./routes/authRoutes");
// const userRoutes = require("./routes/userRoutes");

// app.use("/posts", publicPostRoutes);
// app.use("/admin/posts", postRoutes);
app.use("/auth", authRoutes);
// app.use("/users", userRoutes);

app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: `Cannot find ${req.originalUrl} on this server!`
    });
});

const PORT = 3000;
app.listen(3000, (error) => {
  if (error) {
    throw error;
  }
  console.log(`Odin book - listening on port ${PORT}!`);
});