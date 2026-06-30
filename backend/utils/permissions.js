function isAuthorized(user, targetCommentOrPost) {
    if (user.role === "ADMIN") return true;
    if (user.userId === targetCommentOrPost.authorId) return true;
    return false;
}

module.exports = {isAuthorized};