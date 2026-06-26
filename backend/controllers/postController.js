const { prisma } = require("../lib/prisma.js");
const { isAuthorized } = require("../utils/permissions.js");
const { sanitizePostBody } = require("../utils/sanitizePostBody.js");
//go back and update all res.json to return objects e.g. posts: postsWithAuthors

async function getAllPostsWithAuthors(req, res) {
    try {
        const postsWithAuthors = await prisma.post.findMany({
            include: {
                author: {
                    select: {
                        id: true,
                        username: true
                    }
                },
                _count: {
                    select: { comments: true }
                }
            }
        });
        res.json({
            posts: postsWithAuthors
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching posts' })
    }
}

async function getPostWithAuthor(req, res) {
    try {
        const postWithAuthor = await prisma.post.findUnique({
            where: { id: Number(req.params.postId) },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true
                    }
                },
                _count: {
                    select: { comments: true } //maybe move this to getcomments?
                }
            }
        })
        if (!postWithAuthor) {
            return res.status(404).json({ error: 'Post not found' });
        }
        res.json({ post: postWithAuthor });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching post' })
    }
}

async function getCommentsOfPost(req, res) {
    try {
        const commentsOfPost = await prisma.comment.findMany({
            where: { postId: Number(req.params.postId) },
            include: {
                author: {
                    select: { username: true }
                }
            }
        });
        res.json({ comments: commentsOfPost });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching comments' })
    }
}

async function createNewPost(req, res) {
    try {
        const { title, postBody } = req.body;
        const authorId = req.user.userId //from login/register jwt.sign({ userId: user.id }
        const newPost = await prisma.post.create({
            data: {
                title: title,
                body: sanitizePostBody(postBody),
                authorId: authorId
            }
        })
        res.json({ post: newPost });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error creating post' });
    }
}

async function createNewComment(req, res) {
    try {
        const { commentBody } = req.body; //destructuring const commentBody = req.body.commentBody;
        const authorId = req.user.userId //from login/register jwt.sign({ userId: user.id }
        const newComment = await prisma.comment.create({
            data: {
                postId: Number(req.params.postId),
                body: commentBody,
                authorId: authorId
            }
        });
        res.json({ comment: newComment })
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error creating comment' })
    }
}

async function updatePost(req, res) {
    try {
        const updatedPost = await prisma.post.update({
            where: {
                id: Number(req.params.postId)
            },
            data: {
                title: req.body.title,
                body: req.body.postBody,
            }
        });
        res.json(updatedPost);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error updating post' })
    }
}

async function updatePostStatus(req, res) {
    try {
        let updatedPostStatus = await prisma.post.update({
            where: {
                id: Number(req.params.postId),
            },
            data: {
                publishedDate: new Date()
            }
        });
        res.json(updatedPostStatus);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error updating post status' })
    }
}

async function updateComment(req, res) {
    const commentId = Number(req.params.commentId);
    try {
        const comment = await prisma.comment.findUnique({ where: { id: commentId } });
        if (!comment) return res.status(404).json({ error: 'Comment not found' });
        if (!isAuthorized(req.user, comment)) return res.status(403).json({ error: 'You can only edit your own comments' });
        const updatedComment = await prisma.comment.update({
            where: {
                id: commentId,
            },
            data: {
                body: req.body.commentBody,
            }
        });
        res.json({ comment: updatedComment });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error updating comment' })
    }
}

async function deletePost(req, res) {
    try {
        const deletedPost = await prisma.post.delete({
            where: {
                id: Number(req.params.postId)
            }
        });
        res.json({ deletedPost: deletedPost });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error deleting post' })
    }
}

async function deleteComment(req, res) {
    const commentId = Number(req.params.commentId);
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    if (!isAuthorized(req.user, comment)) return res.status(403).json({ error: 'You can only edit your own comments' });

    try {
        const deletedComment = await prisma.comment.delete({
            where: {
                id: commentId,
            }
        });
        res.json({ deletedComment: deletedComment });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error deleting comment' })
    }
}

module.exports = {
    getAllPostsWithAuthors,
    getPostWithAuthor,
    getCommentsOfPost,
    createNewPost,
    createNewComment,
    updatePost,
    updatePostStatus,
    updateComment,
    deleteComment,
    deletePost
}