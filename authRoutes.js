const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const  pool  = require('./db');
require('dotenv').config({ path: __dirname + '/.env.development' });





const SECRET_KEY = process.env.SECRET_KEY ; // Use environment variable
console.log(SECRET_KEY)

// Function to authenticate user
async function authenticateUser(username, providedPassword) {
    try {
        const userQuery = 'SELECT * FROM users WHERE username = $1';
        const userResult = await pool.query(userQuery, [username]);

        if (userResult.rows.length === 0) {
            return null;
        }

        const user = userResult.rows[0];

        // Compare provided password with hashed password in database
        const isMatch = await bcrypt.compare(providedPassword, user.password);

        if (!isMatch) {
            return null;
        }

        // Exclude the password from the user object before returning
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    } catch (error) {
        throw new Error('Error authenticating user: ' + error.message);
    }
}


// Function to generate token
exports.generateToken = (user) => {
    const payload = {
        id: user.id,
        username: user.username,
        role: user.role // Include the user's role
    };
    return jwt.sign(payload, SECRET_KEY, { expiresIn: '24h' });
};

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await authenticateUser(username, password);

        if (!user) {
            return res.status(401).send('Authentication failed');
        }

        const token = exports.generateToken(user);
        res.send({ user, token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).send('Server error');
    }
});

module.exports = router;
