require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const serverRoutes = require('./server'); // Import routes from server.js

const app = express();
app.use(express.json());
app.use(cors());
app.use('/uploads', express.static('uploads')); // Serve uploaded images as static files


// Middleware




const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

// Database connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Database@0786',
  database: 'data',
  port: 3306,
});

db.connect((err) => {
  if (err) {
    console.error('MySQL connection error:', err);
    process.exit(1);
  }
  console.log('MySQL connected...');
});

// User Registration (Signup)
app.post('/signup', (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  bcrypt.hash(password, 10, (err, hash) => {
    if (err) return res.status(500).json({ error: 'Error hashing password' });

    const query = 'INSERT INTO loginApi (email, password, name) VALUES (?, ?, ?)';
    db.query(query, [email, hash, name], (err, result) => {
      if (err) return res.status(400).json({ error: 'Database error during registration' });
      res.status(201).json({ message: 'User registered successfully!' });
    });
  });
});

// User Login
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const query = 'SELECT * FROM loginApi WHERE email = ?';
  db.query(query, [email], (err, results) => {
    if (err) {
      console.error('Database error:', err); // Log error for debugging
      return res.status(500).json({ message: 'Internal server error.' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = results[0];
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) {
        console.error('Bcrypt error:', err); // Log error for debugging
        return res.status(500).json({ message: 'Internal server error.' });
      }

      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { id: user.id, name: user.name },
        JWT_SECRET,
        { expiresIn: '2h' }
      );

      return res.json({ token, name: user.name });
    });
  });
});

// Use the routes from server.js
app.use('/api', serverRoutes);

// Start the server
app.listen(8000, () => console.log('Server running on http://localhost:8000'));
