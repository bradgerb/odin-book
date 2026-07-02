const { Router } = require("express");
const postRoutes = Router();
const postController = require("../controllers/postController.js");
const verifyToken = require("../middleware/verifyToken.js");

postRoutes.use(verifyToken);

postRoutes.get("/", postController.getAllPostsWithAuthors);
postRoutes.get("/:postId", postController.getPostWithAuthor);
postRoutes.get("/:postId/comments", postController.getCommentsOfPost);

postRoutes.post("/", postController.createNewPost);
postRoutes.post("/:postId/like", postController.togglePostLike);
postRoutes.post("/:postId/comments", postController.createNewComment);

postRoutes.put("/:postId", postController.updatePost);
postRoutes.put("/:postId/status", postController.updatePostStatus)
postRoutes.put("/:postId/comments/:commentId", postController.updateComment) 

postRoutes.delete("/:postId", postController.deletePost);
postRoutes.delete("/:postId/comments/:commentId", postController.deleteComment)

module.exports = postRoutes;