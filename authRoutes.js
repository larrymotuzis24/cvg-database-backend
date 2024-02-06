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
};

const verifyAdmin = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(" ")[1]; // Assumes Bearer token
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        if (decoded.role !== 'admin') {
            return res.status(403).send('Access denied');
        }
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).send('Unauthorized');
    }
};

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

// Example of a GET endpoint to fetch all users
router.get('/users', async (req, res) => {
    try {
        const getUsersQuery = 'SELECT id, username, role FROM users'; 
        const result = await pool.query(getUsersQuery);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).send('Internal Server Error');
    }
});


router.post('/create-user', async (req, res) => {
    const { username, password, role } = req.body;

    // Basic validation
    if (!username || !password || !role) {
        return res.status(400).json({ message: 'Please provide username, password, and role.' });
    }

    try {
        // Check if user already exists
        const userExistsQuery = 'SELECT * FROM users WHERE username = $1';
        const existingUser = await pool.query(userExistsQuery, [username]);

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ message: 'User already exists.' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Insert the new user into the database
        const createUserQuery = 'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id, username, role';
        const newUser = await pool.query(createUserQuery, [username, hashedPassword, role]);

        res.status(201).json({ user: newUser.rows[0] });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.patch('/edit-user/:id', async (req, res) => {
    const { id } = req.params;
    const { username, password, role } = req.body;

    try {
        // Optional: Add validation for the input data

        let updateUserQuery = 'UPDATE users SET ';
        const updateValues = [];
        if (username) {
            updateValues.push(username);
            updateUserQuery += `username = $${updateValues.length}`;
        }
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 12);
            updateValues.push(hashedPassword);
            updateUserQuery += updateValues.length > 1 ? `, password = $${updateValues.length}` : `password = $${updateValues.length}`;
        }
        if (role) {
            updateValues.push(role);
            updateUserQuery += updateValues.length > 1 ? `, role = $${updateValues.length}` : `role = $${updateValues.length}`;
        }
        updateUserQuery += ` WHERE id = $${updateValues.length + 1}`;
        updateValues.push(id);

        await pool.query(updateUserQuery, updateValues);

        res.json({ message: 'User updated successfully' });
    } catch (error) {
        console.error('Edit user error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});




router.delete('/delete-user/:id', async (req, res) => {
    try {
        const { id } = req.params;

     
        const deleteUserQuery = 'DELETE FROM users WHERE id = $1 RETURNING *'; 
        const result = await pool.query(deleteUserQuery, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "User not found." });
        }

        res.json({ message: 'User deleted successfully', user: result.rows[0] });
    } catch (error) {
        console.error('Delete user route error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});



module.exports = router;
