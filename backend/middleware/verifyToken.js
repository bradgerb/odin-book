const jwt = require("jsonwebtoken");

function verifyToken(req, res, next) {
    const bearerHeader = req.headers['authorization'];
    if (!bearerHeader) {
        return res.status(401).json({ error: 'Access denied, no token provided' })
    }
    const token = bearerHeader.split(' ')[1];
    jwt.verify(token, process.env.jwtSecretKey, (err, decodedPayLoad) => {
        if (err) {
            console.log('jwt verify error, but token is provided:')
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
        req.user = decodedPayLoad;
        next();
    });
}

module.exports = verifyToken;