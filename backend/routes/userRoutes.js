const {Router} = require("express");
const userRoutes = Router();

const userController = require("../controllers/userController");
const verifyToken = require("../middleware/verifyToken");

userRoutes.delete('/:userId', verifyToken, userController.deleteUser);

module.exports = userRoutes;