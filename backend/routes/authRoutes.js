const { Router } = require("express");
const authRoutes = Router();
const authController = require("../controllers/authController.js");
const verifyToken = require("../middleware/verifyToken.js");

authRoutes.post("/login", authController.login);
authRoutes.post("/register", authController.register);
authRoutes.post("/logout", authController.logout);
authRoutes.post("/currentUser", verifyToken, authController.getCurrentUser);

module.exports = authRoutes;