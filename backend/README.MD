# DVRS AI - Backend Interview Management System

Backend API for the DVRS AI Interview System, providing comprehensive interview management features.

## Features

### Interview Management
- Create and manage interview sessions
- Track interview status (pending, in-progress, completed)
- Store questions and answers with scoring
- Generate feedback for interview responses
- Session-based interview workflow

### Authentication & Authorization
- JWT-based authentication with httpOnly cookies
- Protected interview routes
- User session management
- Secure password hashing with bcryptjs

## API Endpoints

### Authentication Routes (\/api\)
- \POST /register\ - Register new user
- \POST /login\ - User login
- \GET /user\ - Get current user (protected)
- \POST /logout\ - User logout

### Interview Routes (\/api/interview\) - All Protected
- \POST /\ - Create new interview session
- \GET /\ - Get all user's interview sessions
- \GET /:id\ - Get specific interview session
- \PUT /:id\ - Update interview session
- \DELETE /:id\ - Delete interview session
- \PUT /:id/start\ - Start interview (change status to in-progress)
- \PUT /:id/complete\ - Complete interview (change status to completed)
- \POST /:id/qa\ - Add question/answer to interview

## Tech Stack

- Node.js & Express.js (ES6 Modules)
- MongoDB & Mongoose
- JWT Authentication
- bcryptjs for password hashing
- Cookie-based session management

## Installation

1. Install dependencies:
\\\ash
npm install
\\\

2. Create \.env\ file (copy from \.env.example\):
\\\ash
cp .env.example .env
\\\

3. Update \.env\ with your configuration:
\\\
PORT=5002
MONGODB_URI=mongodb://127.0.0.1:27017/LoginApp
JWT_SECRET=your_secure_jwt_secret
JWT_EXPIRE=1h
NODE_ENV=development
\\\

4. Start MongoDB:
\\\ash
mongod
\\\

5. Run the server:
\\\ash
npm start       # Production
npm run dev     # Development (with nodemon)
\\\

## Models

### User
- name (String, required)
- email (String, required, unique)
- mobile (String, required)
- password (String, required, hashed)
- timestamps

### InterviewSession
- userId (ObjectId, ref: 'User', required)
- status (Enum: pending, in-progress, completed)
- questionsAnswers (Array of Q&A objects with scores and feedback)
- totalScore (Number)
- maxScore (Number)
- feedback (String)
- timestamps

## Middleware

- \uth.js\ - JWT authentication middleware using cookies
- CORS enabled for frontend integration
- Cookie parser for httpOnly cookies
- Express JSON & URL encoded body parsing

## Project Structure

\\\
backend/
 config/
    database.js          # MongoDB connection
 controllers/
    authController.js    # Authentication logic
    interviewController.js  # Interview management (8 functions)
 middleware/
    auth.js             # JWT auth middleware
 models/
    User.js             # User schema
    InterviewSession.js # Interview session schema
 routes/
    auth.js             # Auth routes
    interview.js        # Interview routes (protected)
 .env.example            # Environment template
 package.json            # Dependencies
 server.js               # Express server setup
 README.MD               # This file
\\\

## Contributing

This backend integrates with the DVRS AI frontend and AI modules for a complete interview management system.
