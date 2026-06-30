const { prisma } = require('../lib/prisma.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

async function login(req, res) {
    const { username, password } = req.body;
    const loginError = 'Username/password combination not found';

    try {
        const user = await prisma.user.findUnique({
            where: {
                username: username,
            },
            select: {
                id: true,
                username: true,
                password: true,
                role: true
            }
        });

        if (!user) {
            return res.status(401).json({ error: loginError });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ error: loginError });
        }

        const userDetailsExceptPassword = {
            id: user.id,
            username: user.username,
            role: user.role
        }

        jwt.sign({ userId: user.id, role: user.role }, process.env.jwtSecretKey, { expiresIn: '1d' }, (err, token) => {
            if (err) return res.status(500).json({ error: 'Error generating JWT' });
            res.json({
                user: userDetailsExceptPassword,
                token: token
            })
        })
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error on log in' })
    }
}

async function logout(req, res) {
    res.json({ message: 'Successful log out' })
}

async function register(req, res) {
    const { username, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                username: username,
                password: hashedPassword,
            },
            select: {
                id: true,
                username: true,
            }
        });
        jwt.sign({ userId: user.id, role: 'USER' }, process.env.jwtSecretKey, { expiresIn: '1d' }, (err, token) => {
            if (err) return res.status(500).json({ error: 'Error generating JWT' });
            res.json({
                user: user,
                token: token
            })
        })
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error registering user' })
    }
}

async function getCurrentUser(req, res) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { id: true, username: true, role: true }
        })
        if (!user) return res.status(404).json({error: 'User not found'})
    } catch (err) {
        res.status(500).json({error: 'Error fetching user data'})
    }
}

module.exports = {
    login,
    logout,
    register,
    getCurrentUser
}