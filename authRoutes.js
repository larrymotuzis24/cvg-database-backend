const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = require('express').Router();
const pool = require('./db'); // Make sure this is correctly importing your database pool
require('dotenv').config();

const SECRET_KEY = process.env.SECRET_KEY; // Ensure this is set in your environment

// Function to authenticate user
async function authenticateUser(username, providedPassword) {
    try {
        const userQuery = 'SELECT * FROM users WHERE username = $1';
        const userResult = await pool.query(userQuery, [username]);

        if (userResult.rows.length === 0) {
            return null; // No user found
        }

        const user = userResult.rows[0];

        // Compare provided password with hashed password in database
        const isMatch = await bcrypt.compare(providedPassword, user.password);

        if (!isMatch) {
            return null; // Password does not match
        }

        // Exclude the password from the user object before returning
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    } catch (error) {
        console.error('Error in authenticateUser:', error);
        throw new Error('Error in authenticateUser: ' + error.message);
    }
}

// Function to generate token
function generateToken(user) {
    const payload = {
        id: user.id,
        username: user.username,
        role: user.role
    };
    return jwt.sign(payload, SECRET_KEY, { expiresIn: '24h' });
}

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await authenticateUser(username, password);

        if (!user) {
            return res.status(401).send('Authentication failed');
        }

        const token = generateToken(user);
        res.json({ user, token });
    } catch (error) {
        console.error('Login route error:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
