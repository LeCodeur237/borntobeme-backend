const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid'); // For generating UUIDs
const dbPool = require('../db'); // Import MySQL connection pool

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           format: uuid
 *           description: The auto-generated UUID of the user.
 *           example: "60c72b2f9b1e8c001c8e4d8f"
 *         fullname:
 *           type: string
 *           example: "John Doe"
 *         email:
 *           type: string
 *           format: email
 *           example: "john.doe@example.com"
 *         datebirthday:
 *           type: string
 *           format: date
 *           example: "1990-01-15"
 *         linkphoto:
 *           type: string
 *           format: url
 *           nullable: true
 *           example: "https://example.com/photo.jpg"
 *         role:
 *           type: string
 *           enum: ['user', 'admin']
 *           example: "user"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of user creation.
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of last user update.
 *
 *     UserRegistrationInput:
 *       type: object
 *       required:
 *         - fullname
 *         - email
 *         - datebirthday
 *         - password
 *       properties:
 *         fullname:
 *           type: string
 *           example: "John Doe"
 *         email:
 *           type: string
 *           format: email
 *           example: "john.doe@example.com"
 *         datebirthday:
 *           type: string
 *           format: date
 *           example: "1990-01-15"
 *         linkphoto:
 *           type: string
 *           format: url
 *           nullable: true
 *           example: "https://example.com/photo.jpg"
 *         role:
 *           type: string
 *           enum: ['user', 'admin']
 *           default: 'user'
 *           example: "user"
 *         password:
 *           type: string
 *           format: password
 *           example: "P@$$wOrd123"
 *
 *     UserLoginInput:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: "john.doe@example.com"
 *         password:
 *           type: string
 *           format: password
 *           example: "P@$$wOrd123"
 *
 *     LoginSuccessResponse:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2MGM3YjIwMzYwZ..."
 *         user:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *               format: uuid
 *               example: "60c72b2f9b1e8c001c8e4d8f"
 *             email:
 *               type: string
 *               format: email
 *               example: "john.doe@example.com"
 *             fullname:
 *               type: string
 *               example: "John Doe"
 *             role:
 *               type: string
 *               enum: ['user', 'admin']
 *               example: "user"
 *
 *     ErrorResponse: # A more generic error response
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: A human-readable error message.
 *           example: "Invalid input"
 *         errors:
 *           type: array
 *           nullable: true
 *           items:
 *             type: object
 *             properties:
 *               field:
 *                 type: string
 *                 description: The field that caused the error.
 *                 example: "email"
 *               message:
 *                 type: string
 *                 description: The specific error message for the field.
 *                 example: "Email is already taken"
 *   securitySchemes:
 *     bearerAuth: # Defines JWT Bearer token authentication
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /api/borntobeme/auth/add-user:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: "Register a new user"
 *     description: "Creates a new user account in the system. Requires fullname, email, date of birth, and password. Role defaults to 'user' if not provided. Linkphoto is optional."
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserRegistrationInput'
 *     responses:
 *       '201':
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User registered successfully"
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       '400':
 *         description: Bad request (e.g., user already exists, missing fields, invalid data)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/add-user', async (req, res) => { // Removed authMiddleware for public registration
    try {
        const { fullname, email, datebirthday, linkphoto, role, password } = req.body;
        const userRole = role || 'user'; // Default role to 'user'

        // Basic validation (you might want to add more comprehensive validation)
        if (!fullname || !email || !password || !datebirthday) {
            return res.status(400).json({ message: 'Missing required fields: fullname, email, password, datebirthday' });
        }

        // Check if user already exists
        const [existingUsers] = await dbPool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const userId = uuidv4(); // Generate a new UUID for the user

        // Insert new user into the database
        const insertSql = `
            INSERT INTO users (id, fullname, email, datebirthday, linkphoto, role, password)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        await dbPool.query(insertSql, [
            userId,
            fullname,
            email,
            datebirthday, // Ensure this is in 'YYYY-MM-DD' format for MySQL DATE type
            linkphoto || null,
            userRole,
            hashedPassword
        ]);

        // Fetch the newly created user (excluding password) to return in the response
        const [newUserRows] = await dbPool.query('SELECT id, fullname, email, datebirthday, linkphoto, role, createdAt, updatedAt FROM users WHERE id = ?', [userId]);
        
        if (newUserRows.length === 0) {
            // This should ideally not happen if insert was successful
            console.error('Failed to retrieve newly registered user for ID:', userId);
            return res.status(500).json({ message: 'Error registering user: User not found after creation' });
        }

        const userResponse = {
            _id: newUserRows[0].id, // Match Swagger schema's _id
            ...newUserRows[0]
        };
        delete userResponse.id; // remove original id if _id is preferred

        res.status(201).json({ message: 'User registered successfully', user: userResponse });

    } catch (error) {
        console.error('Error registering user:', error);
        // MySQL specific error for duplicate entry (e.g., if unique constraint on email is violated)
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'User with this email already exists (DB constraint).' });
        }
        // Add more specific MySQL error handling if needed
        return res.status(500).json({ message: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/borntobeme/auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: "Authenticate a user"
 *     description: "Logs in an existing user using their email and password, and returns a JWT token upon successful authentication."
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserLoginInput'
 *     responses:
 *       '200':
 *         description: Authentication successful, token returned
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginSuccessResponse'
 *       '401':
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const [users] = await dbPool.query('SELECT id, email, password, fullname, role, linkphoto FROM users WHERE email = ?', [email]);

        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const user = users[0];

        // Check if user exists and password matches
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        // Ensure JWT_SECRET is set in your .env file
        const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({
            token,
            user: {
                _id: user.id, // Match Swagger schema's _id
                email: user.email,
                linkphoto: user.linkphoto,
                fullname: user.fullname,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
