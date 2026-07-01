const { prisma } = require("../lib/prisma.js");
const { isAuthorized } = require("../utils/permissions.js");
const { sanitizePostBody } = require("../utils/sanitizePostBody.js");

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
                    select: { comments: true }
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
        const shaped = commentsOfPost.map(c => ({
            id: c.id,
            body: c.content,
            publishedDate: c.publishedDate,
            updatedAt: c.updatedAt,
            authorId: c.authorId,
            author: c.author
        }));
        res.json({ comments: shaped });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching comments' })
    }
}

async function createNewPost(req, res) {
    try {
        const { content } = req.body;
        const authorId = req.user?.userId;

        if (!authorId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        if (!content || typeof content !== 'string' || !content.trim()) {
            return res.status(400).json({ error: 'Post content cannot be empty' });
        }

        const newPost = await prisma.post.create({
            data: {
                content: sanitizePostBody(content),
                authorId: Number(authorId)
            },
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
        })
        res.json({ post: newPost });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error creating post' });
    }
}

async function createNewComment(req, res) {
    try {
        const { commentBody } = req.body;
        const authorId = req.user?.userId;

        if (!authorId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        if (!commentBody || typeof commentBody !== 'string' || !commentBody.trim()) {
            return res.status(400).json({ error: 'Comment content cannot be empty' });
        }

        const newComment = await prisma.comment.create({
            data: {
                postId: Number(req.params.postId),
                content: commentBody,
                authorId: Number(authorId)
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
                content: req.body.content,
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
                content: req.body.commentBody,
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