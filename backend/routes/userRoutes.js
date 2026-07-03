const {Router} = require("express");
const userRoutes = Router();

const userController = require("../controllers/userController");
const friendController = require("../controllers/friendController");
const verifyToken = require("../middleware/verifyToken");

userRoutes.delete('/:userId', verifyToken, userController.deleteUser);

userRoutes.get('/search', verifyToken, friendController.searchUsers);
userRoutes.get('/friend-requests', verifyToken, friendController.getPendingRequests);
userRoutes.post('/friend-requests', verifyToken, friendController.sendFriendRequest);
userRoutes.post('/friend-requests/:requestId/accept', verifyToken, friendController.acceptFriendRequest);
userRoutes.post('/friend-requests/:requestId/reject', verifyToken, friendController.rejectFriendRequest);
userRoutes.delete('/friend-requests/:requestId', verifyToken, friendController.cancelFriendRequest);
userRoutes.get('/friends', verifyToken, friendController.getFriends);
userRoutes.delete('/friends/:friendId', verifyToken, friendController.removeFriend);

module.exports = userRoutes;