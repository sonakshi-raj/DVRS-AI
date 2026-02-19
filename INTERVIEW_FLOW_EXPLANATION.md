# Interview Flow - Complete Technical Explanation

This document explains the complete flow of how the interview feature works from start to finish, covering frontend, backend, database, and all files involved.

---

## Table of Contents
1. [Starting the Interview](#1-starting-the-interview)
2. [Creating a Session](#2-creating-a-session)
3. [Starting the Session](#3-starting-the-session)
4. [Loading Questions](#4-loading-questions)
5. [Submitting Answers](#5-submitting-answers)
6. [Completing the Interview](#6-completing-the-interview)
7. [Viewing Results](#7-viewing-results)
8. [Complete File Reference](#8-complete-file-reference)

---

## 1. Starting the Interview

### User Action
User clicks **"Start New Interview"** button on the dashboard page.

### What Happens

#### File: `frontend/src/app/auth/dashboard/dashboard.html`
```html
<button class="btn-primary" (click)="startNewInterview()">Start New Interview</button>
```

#### File: `frontend/src/app/auth/dashboard/dashboard.ts`
```typescript
startNewInterview(): void {
  this.router.navigate(['/interview']);
}
```

**Explanation:** 
- The button triggers the `startNewInterview()` function
- This function uses Angular's Router to navigate to `/interview` route
- The page changes to the interview page

---

## 2. Creating a Session

### What Happens
When the interview page loads, it automatically creates a new interview session.

#### File: `frontend/src/app/auth/interview/interview.ts`

**Step 1: Component Initialization**
```typescript
ngOnInit(): void {
  this.route.queryParams.subscribe(params => {
    if (params['sessionId']) {
      // If there's a session ID in URL, load existing session
      this.sessionId = params['sessionId'];
      this.loadSession(this.sessionId);
    } else {
      // No session ID, create new session
      this.createNewSession();
    }
  });
}
```

**Step 2: Create New Session Function**
```typescript
createNewSession(): void {
  this.loading = true;  // Show loading spinner
  this.error = '';      // Clear any errors
  
  // Call the interview service to create session
  this.interviewService.createSession({}).subscribe({
    next: (response) => {
      if (response.success && response.data) {
        this.session = response.data;           // Store session data
        this.sessionId = response.data._id;     // Store session ID
        this.startInterview();                  // Start the interview
      }
    },
    error: (err) => {
      this.error = 'Failed to create interview session.';
      this.loading = false;
    }
  });
}
```

**Explanation:**
- When component loads (`ngOnInit`), it checks if there's a session ID in the URL
- If no session ID exists, it calls `createNewSession()`
- `createNewSession()` sets loading to true (shows spinner)
- It calls the `interviewService.createSession()` method

---

#### File: `frontend/src/app/service/interview.service.ts`

**Step 3: Service Makes HTTP Request**
```typescript
createSession(data: Partial<InterviewSession>): Observable<ApiResponse<InterviewSession>> {
  return this.http.post<ApiResponse<InterviewSession>>(
    `${this.apiUrl}/session`, 
    data, 
    { withCredentials: true }
  );
}
```

**Explanation:**
- The service creates an HTTP POST request
- URL: `http://localhost:5002/api/interview/session`
- `withCredentials: true` sends authentication cookies
- Request goes to the backend server

---

#### Backend Processing Starts Here

#### File: `backend/app.js`

**Step 4: Request Reaches Backend**
```javascript
app.use('/api/interview', interviewRoutes);
```

**Explanation:**
- Express server receives the POST request
- It matches the route `/api/interview/session`
- Routes to the interview route handler

---

#### File: `backend/routes/interview.js`

**Step 5: Route Handler**
```javascript
import { protect } from '../middleware/auth.js';
import { 
  createSession,
  // ... other imports
} from '../controllers/interviewController.js';

router.post('/session', protect, createSession);
```

**Explanation:**
- Route matches POST `/session`
- **FIRST:** Runs `protect` middleware (authentication check)
- **THEN:** Runs `createSession` controller function

---

#### File: `backend/middleware/auth.js`

**Step 6: Authentication Middleware**
```javascript
export const authMiddleware = async (req, res, next) => {
  try {
    // 1. Get JWT token from cookies
    const token = req.cookies.token;
    
    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    // 2. Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 3. Get user from database (without password)
    req.user = await User.findById(decoded.userId).select("-password");
    
    if (!req.user) {
      return res.status(401).json({ message: "User not found" });
    }
    
    // 4. User is authenticated, continue to next function
    next();
  } catch (error) {
    res.status(401).json({ message: "Not authorized, token failed" });
  }
};

export const protect = authMiddleware;
```

**Explanation:**
- Checks if JWT token exists in cookies
- Verifies the token is valid and not expired
- Finds the user in database using the ID from token
- Attaches user object to `req.user` for later use
- Calls `next()` to continue to the controller

---

#### File: `backend/controllers/interviewController.js`

**Step 7: Create Session Controller**
```javascript
export const createSession = async (req, res) => {
  try {
    // 1. Create new interview session in database
    const session = await InterviewSession.create({
      userId: req.user._id,           // From auth middleware
      status: 'pending',              // Initial status
      questions: [],                  // Empty questions array
      score: 0,                       // Initial score is 0
    });

    // 2. Send success response back to frontend
    res.status(201).json({
      success: true,
      data: session
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
```

**Explanation:**
- Creates a new document in MongoDB using InterviewSession model
- Sets `userId` from the authenticated user (`req.user._id`)
- Sets initial status as 'pending'
- Questions array is empty (will be filled as user answers)
- Returns the created session back to frontend

---

#### File: `backend/models/InterviewSession.js`

**Step 8: Database Model**
```javascript
const interviewSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending'
  },
  questions: [{
    question: String,
    answer: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  score: {
    type: Number,
    default: 0
  },
  startedAt: Date,
  completedAt: Date
}, {
  timestamps: true  // Adds createdAt and updatedAt automatically
});

const InterviewSession = mongoose.model('InterviewSession', interviewSessionSchema);
```

**Explanation:**
- Mongoose schema defines the structure of interview session documents
- MongoDB creates a new document with these fields
- Returns the document with a unique `_id` field

---

### Response Returns to Frontend

**Step 9: Frontend Receives Response**

Back to: `frontend/src/app/auth/interview/interview.ts`

```typescript
createNewSession(): void {
  this.interviewService.createSession({}).subscribe({
    next: (response) => {
      if (response.success && response.data) {
        this.session = response.data;         // Save session object
        this.sessionId = response.data._id;   // Save session ID
        this.startInterview();                // Move to next step
      }
    }
  });
}
```

**Explanation:**
- Frontend receives JSON response from backend
- Stores session data in component properties
- Automatically calls `startInterview()` to move to next step

---

## 3. Starting the Session

### What Happens
The session status changes from 'pending' to 'in-progress'.

#### File: `frontend/src/app/auth/interview/interview.ts`

**Step 1: Start Interview Function**
```typescript
startInterview(): void {
  if (!this.sessionId) {
    this.error = 'No session ID available.';
    return;
  }
  
  // Call service to start the session
  this.interviewService.startSession(this.sessionId).subscribe({
    next: (response) => {
      if (response.success && response.data) {
        this.session = response.data;      // Update session data
        this.loadCurrentQuestion();        // Load first question
      }
    },
    error: (err) => {
      this.error = 'Failed to start interview.';
      this.loading = false;
    }
  });
}
```

---

#### File: `frontend/src/app/service/interview.service.ts`

**Step 2: Service Makes HTTP Request**
```typescript
startSession(id: string): Observable<ApiResponse<InterviewSession>> {
  return this.http.put<ApiResponse<InterviewSession>>(
    `${this.apiUrl}/session/${id}/start`,
    {},
    { withCredentials: true }
  );
}
```

**Explanation:**
- Makes PUT request to `/api/interview/session/{sessionId}/start`
- Empty body `{}` because we're just updating status
- Sends authentication cookies

---

#### File: `backend/routes/interview.js`

**Step 3: Backend Route**
```javascript
router.put('/session/:id/start', protect, startSession);
```

---

#### File: `backend/controllers/interviewController.js`

**Step 4: Start Session Controller**
```javascript
export const startSession = async (req, res) => {
  try {
    const { id } = req.params;  // Get session ID from URL
    
    // 1. Find session in database and update it
    const session = await InterviewSession.findByIdAndUpdate(
      id,
      { 
        status: 'in-progress',       // Change status
        startedAt: new Date()        // Record start time
      },
      { new: true }  // Return updated document
    );

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // 2. Verify session belongs to logged-in user
    if (session.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // 3. Send updated session back
    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
```

**Explanation:**
- Finds the session in MongoDB by ID
- Updates status to 'in-progress'
- Sets `startedAt` timestamp
- Checks if session belongs to current user (security)
- Returns updated session to frontend

---

### Response Returns to Frontend

**Step 5: Frontend Receives Updated Session**

```typescript
startInterview(): void {
  this.interviewService.startSession(this.sessionId).subscribe({
    next: (response) => {
      this.session = response.data;      // Session now has status='in-progress'
      this.loadCurrentQuestion();        // Load first question
    }
  });
}
```

---

## 4. Loading Questions

### What Happens
The frontend loads questions from a predefined list (no backend call needed).

#### File: `frontend/src/app/auth/interview/interview.ts`

**Step 1: Question Array**
```typescript
defaultQuestions: string[] = [
  'Tell us about yourself and your background.',
  'Describe a challenging project you worked on recently.',
  'What are your strongest technical skills?',
  'How do you approach problem-solving when faced with a difficult bug?',
  'Where do you see yourself in the next 3-5 years?'
];

currentQuestionIndex: number = 0;  // Start with first question
```

**Step 2: Load Current Question Function**
```typescript
loadCurrentQuestion(): void {
  // Check if there are more questions
  if (this.currentQuestionIndex < this.defaultQuestions.length) {
    // Set current question from array
    this.currentQuestion = this.defaultQuestions[this.currentQuestionIndex];
    this.currentAnswer = '';    // Clear answer field
    this.loading = false;       // Hide loading spinner
  } else {
    // No more questions, complete the interview
    this.completeInterview();
  }
}
```

**Explanation:**
- Questions are stored in the frontend (not fetched from backend)
- `currentQuestionIndex` tracks which question we're on (starts at 0)
- Displays question to user
- User types answer in textarea

---

## 5. Submitting Answers

### What Happens
User types an answer and clicks "Next Question" button.

#### File: `frontend/src/app/auth/interview/interview.html`

```html
<textarea 
  [(ngModel)]="currentAnswer"   <!-- Two-way binding to currentAnswer -->
  placeholder="Type your answer here..."
  rows="8"
></textarea>

<button 
  class="btn-primary" 
  (click)="submitAnswer()"
  [disabled]="!currentAnswer.trim()"
>
  {{ isLastQuestion ? 'Finish Interview' : 'Next Question' }}
</button>
```

**Explanation:**
- User types in textarea
- `[(ngModel)]` keeps `currentAnswer` variable updated in real-time
- Button calls `submitAnswer()` when clicked
- Button is disabled if answer is empty

---

#### File: `frontend/src/app/auth/interview/interview.ts`

**Step 1: Submit Answer Function**
```typescript
submitAnswer(): void {
  // Validation: Check if answer is not empty
  if (!this.currentAnswer.trim()) {
    this.error = 'Please provide an answer before submitting.';
    return;
  }

  this.loading = true;
  this.error = '';

  // Call service to save question and answer
  this.interviewService.addQuestionAnswer(
    this.sessionId,
    this.currentQuestion,
    this.currentAnswer
  ).subscribe({
    next: (response) => {
      if (response.success && response.data) {
        this.session = response.data;        // Update session
        this.currentQuestionIndex++;         // Move to next question
        this.loadCurrentQuestion();          // Load next question
      }
    },
    error: (err) => {
      this.error = 'Failed to submit answer.';
      this.loading = false;
    }
  });
}
```

**Explanation:**
- Validates that answer is not empty
- Shows loading spinner
- Sends question and answer to backend
- After success, increments question index
- Loads next question (or completes if last question)

---

#### File: `frontend/src/app/service/interview.service.ts`

**Step 2: Service Makes HTTP Request**
```typescript
addQuestionAnswer(
  id: string, 
  question: string, 
  answer: string
): Observable<ApiResponse<InterviewSession>> {
  return this.http.post<ApiResponse<InterviewSession>>(
    `${this.apiUrl}/session/${id}/qa`,
    { question, answer },
    { withCredentials: true }
  );
}
```

**Explanation:**
- Makes POST request to `/api/interview/session/{sessionId}/qa`
- Sends JSON body with question and answer
- Format: `{ "question": "...", "answer": "..." }`

---

#### File: `backend/routes/interview.js`

**Step 3: Backend Route**
```javascript
router.post('/session/:id/qa', protect, addQuestionAnswer);
```

---

#### File: `backend/controllers/interviewController.js`

**Step 4: Add Question Answer Controller**
```javascript
export const addQuestionAnswer = async (req, res) => {
  try {
    const { id } = req.params;              // Session ID from URL
    const { question, answer } = req.body;  // Question and answer from body

    // 1. Find the session
    const session = await InterviewSession.findById(id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // 2. Security check: verify session belongs to user
    if (session.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // 3. Add question-answer pair to session's questions array
    session.questions.push({
      question,
      answer,
      timestamp: new Date()
    });

    // 4. Save updated session to database
    await session.save();

    // 5. Send updated session back to frontend
    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
```

**Explanation:**
- Finds the interview session in MongoDB
- Verifies the session belongs to the logged-in user
- Adds the question-answer pair to the `questions` array
- Saves the updated session to database
- Returns updated session to frontend

**Database State After This:**
```javascript
{
  _id: "abc123",
  userId: "user456",
  status: "in-progress",
  questions: [
    {
      question: "Tell us about yourself and your background.",
      answer: "I am a software developer with 5 years...",
      timestamp: "2026-02-17T10:30:00.000Z"
    }
    // More questions added as user progresses
  ],
  score: 0,
  startedAt: "2026-02-17T10:25:00.000Z"
}
```

---

### Response Returns to Frontend

**Step 5: Frontend Updates State**
```typescript
submitAnswer(): void {
  this.interviewService.addQuestionAnswer(...).subscribe({
    next: (response) => {
      this.session = response.data;        // Now has the new Q&A
      this.currentQuestionIndex++;         // From 0 to 1, 1 to 2, etc.
      this.loadCurrentQuestion();          // Shows next question
    }
  });
}
```

**This process repeats for all 5 questions.**

---

## 6. Completing the Interview

### What Happens
After answering the last question (question 5), the interview is completed.

#### File: `frontend/src/app/auth/interview/interview.ts`

**Step 1: Load Current Question Checks**
```typescript
loadCurrentQuestion(): void {
  if (this.currentQuestionIndex < this.defaultQuestions.length) {
    // Still have questions, load next one
    this.currentQuestion = this.defaultQuestions[this.currentQuestionIndex];
    this.currentAnswer = '';
    this.loading = false;
  } else {
    // No more questions (index is 5, array length is 5)
    this.completeInterview();
  }
}
```

**Step 2: Complete Interview Function**
```typescript
completeInterview(): void {
  this.loading = true;
  
  // Call service to mark session as complete
  this.interviewService.completeSession(this.sessionId).subscribe({
    next: (response) => {
      if (response.success) {
        this.loading = false;
        this.router.navigate(['/dashboard']);  // Redirect to dashboard
      }
    },
    error: (err) => {
      this.error = 'Failed to complete interview.';
      this.loading = false;
    }
  });
}
```

---

#### File: `frontend/src/app/service/interview.service.ts`

**Step 3: Service Makes HTTP Request**
```typescript
completeSession(id: string): Observable<ApiResponse<InterviewSession>> {
  return this.http.put<ApiResponse<InterviewSession>>(
    `${this.apiUrl}/session/${id}/complete`,
    {},
    { withCredentials: true }
  );
}
```

**Explanation:**
- Makes PUT request to `/api/interview/session/{sessionId}/complete`
- Empty body (just updating status)

---

#### File: `backend/routes/interview.js`

**Step 4: Backend Route**
```javascript
router.put('/session/:id/complete', protect, completeSession);
```

---

#### File: `backend/controllers/interviewController.js`

**Step 5: Complete Session Controller**
```javascript
export const completeSession = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Find and update session
    const session = await InterviewSession.findByIdAndUpdate(
      id,
      { 
        status: 'completed',           // Change status
        completedAt: new Date()        // Record completion time
      },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // 2. Security check
    if (session.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // 3. Send updated session back
    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
```

**Explanation:**
- Finds session in database
- Updates status to 'completed'
- Sets `completedAt` timestamp
- Returns updated session

**Final Database State:**
```javascript
{
  _id: "abc123",
  userId: "user456",
  status: "completed",              // ← Changed to completed
  questions: [
    { question: "...", answer: "...", timestamp: "..." },
    { question: "...", answer: "...", timestamp: "..." },
    { question: "...", answer: "...", timestamp: "..." },
    { question: "...", answer: "...", timestamp: "..." },
    { question: "...", answer: "...", timestamp: "..." }
  ],
  score: 0,
  startedAt: "2026-02-17T10:25:00.000Z",
  completedAt: "2026-02-17T10:35:00.000Z"  // ← Added
}
```

---

### Response Returns to Frontend

**Step 6: Frontend Redirects**
```typescript
completeInterview(): void {
  this.interviewService.completeSession(this.sessionId).subscribe({
    next: (response) => {
      if (response.success) {
        this.router.navigate(['/dashboard']);  // User goes to dashboard
      }
    }
  });
}
```

---

## 7. Viewing Results

### What Happens
User is redirected to dashboard where they can see all interview sessions.

#### File: `frontend/src/app/auth/dashboard/dashboard.ts`

**Step 1: Dashboard Loads Sessions**
```typescript
ngOnInit(): void {
  this.loadSessions();  // Load all sessions when page loads
}

loadSessions(): void {
  this.loading = true;
  
  this.interviewService.getAllSessions().subscribe({
    next: (response) => {
      if (response.success && response.data) {
        this.sessions = response.data;   // Store all sessions
        this.loading = false;
      }
    },
    error: (err) => {
      this.error = 'Failed to load sessions.';
      this.loading = false;
    }
  });
}
```

---

#### File: `frontend/src/app/service/interview.service.ts`

**Step 2: Service Gets All Sessions**
```typescript
getAllSessions(): Observable<ApiResponse<InterviewSession[]>> {
  return this.http.get<ApiResponse<InterviewSession[]>>(
    `${this.apiUrl}/sessions`,
    { withCredentials: true }
  );
}
```

---

#### File: `backend/routes/interview.js`

**Step 3: Backend Route**
```javascript
router.get('/sessions', protect, getAllSessions);
```

---

#### File: `backend/controllers/interviewController.js`

**Step 4: Get All Sessions Controller**
```javascript
export const getAllSessions = async (req, res) => {
  try {
    // 1. Find all sessions for the logged-in user
    const sessions = await InterviewSession.find({ 
      userId: req.user._id 
    }).sort({ createdAt: -1 });  // Newest first

    // 2. Send sessions array back
    res.json({
      success: true,
      data: sessions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
```

**Explanation:**
- Queries MongoDB for all sessions where `userId` matches current user
- Sorts by creation date (newest first)
- Returns array of all user's sessions

---

#### File: `frontend/src/app/auth/dashboard/dashboard.html`

**Step 5: Display Sessions**
```html
<div class="sessions-grid">
  <div class="session-card" *ngFor="let session of sessions">
    <div class="session-header">
      <h3>Interview Session</h3>
      <span class="status-badge" [class]="'status-' + session.status">
        {{ session.status }}
      </span>
    </div>
    
    <div class="session-details">
      <p><strong>Questions Answered:</strong> {{ session.questions.length }}</p>
      <p><strong>Score:</strong> {{ session.score }}%</p>
      <p><strong>Date:</strong> {{ session.createdAt | date: 'short' }}</p>
    </div>
    
    <div class="button-group">
      <button 
        *ngIf="session.status === 'in-progress'" 
        (click)="continueInterview(session._id)"
      >
        Continue
      </button>
      <button (click)="deleteSession(session._id)">Delete</button>
    </div>
  </div>
</div>
```

**Explanation:**
- Shows all sessions in a grid
- Each session card shows status, questions answered, score, date
- If status is 'in-progress', shows "Continue" button
- Has "Delete" button for each session

---

## 8. Complete File Reference

### Frontend Files

| File | Purpose |
|------|---------|
| `frontend/src/app/auth/dashboard/dashboard.ts` | Dashboard component logic (start interview, view sessions) |
| `frontend/src/app/auth/dashboard/dashboard.html` | Dashboard template (session list, buttons) |
| `frontend/src/app/auth/dashboard/dashboard.scss` | Dashboard styling |
| `frontend/src/app/auth/interview/interview.ts` | Interview component logic (questions, answers, flow) |
| `frontend/src/app/auth/interview/interview.html` | Interview template (question display, answer input) |
| `frontend/src/app/auth/interview/interview.scss` | Interview styling |
| `frontend/src/app/service/interview.service.ts` | HTTP service (API calls to backend) |
| `frontend/src/app/service/auth-service.ts` | Authentication service (login, logout, token) |
| `frontend/src/app/app.routes.ts` | Route configuration (URL to component mapping) |

### Backend Files

| File | Purpose |
|------|---------|
| `backend/app.js` | Main server file (Express setup, middleware, routes) |
| `backend/routes/interview.js` | Interview route definitions (URL to controller mapping) |
| `backend/routes/auth.js` | Authentication route definitions |
| `backend/controllers/interviewController.js` | Interview business logic (CRUD operations) |
| `backend/controllers/authController.js` | Authentication business logic (login, register) |
| `backend/middleware/auth.js` | Authentication middleware (JWT verification) |
| `backend/models/InterviewSession.js` | MongoDB schema for interview sessions |
| `backend/models/User.js` | MongoDB schema for users |
| `backend/config/database.js` | MongoDB connection configuration |

### Database Collections

| Collection | Purpose |
|------------|---------|
| `users` | Stores user accounts (email, password hash, name) |
| `interviewsessions` | Stores interview sessions (questions, answers, status) |

---

## Summary: Complete Flow Diagram

```
USER CLICKS "START INTERVIEW" BUTTON
            ↓
┌─────────────────────────────────────────────────────────────────┐
│ DASHBOARD (dashboard.ts)                                        │
│ ∟ startNewInterview() → router.navigate(['/interview'])        │
└─────────────────────────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────────────────────┐
│ INTERVIEW PAGE LOADS (interview.ts)                             │
│ ∟ ngOnInit() → createNewSession()                              │
└─────────────────────────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND SERVICE (interview.service.ts)                         │
│ ∟ POST http://localhost:5002/api/interview/session             │
└─────────────────────────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────────────────────┐
│ BACKEND ROUTE (interview.js)                                    │
│ ∟ router.post('/session', protect, createSession)              │
└─────────────────────────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────────────────────┐
│ AUTH MIDDLEWARE (auth.js)                                       │
│ ∟ Verify JWT token → Get user → Attach to req.user            │
└─────────────────────────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────────────────────┐
│ CONTROLLER (interviewController.js)                             │
│ ∟ InterviewSession.create({ userId, status: 'pending' })       │
└─────────────────────────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────────────────────┐
│ MONGODB DATABASE                                                 │
│ ∟ New document created in 'interviewsessions' collection       │
└─────────────────────────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────────────────────┐
│ RESPONSE BACK TO FRONTEND                                       │
│ ∟ { success: true, data: { _id, userId, status: 'pending' } } │
└─────────────────────────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────────────────────┐
│ INTERVIEW COMPONENT (interview.ts)                              │
│ ∟ startInterview() is called                                   │
└─────────────────────────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND SERVICE                                                 │
│ ∟ PUT http://localhost:5002/api/interview/session/{id}/start   │
└─────────────────────────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────────────────────┐
│ BACKEND UPDATES SESSION                                          │
│ ∟ InterviewSession.findByIdAndUpdate(                          │
│     { status: 'in-progress', startedAt: Date.now() }           │
│   )                                                              │
└─────────────────────────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────────────────────┐
│ INTERVIEW COMPONENT LOADS QUESTION                              │
│ ∟ loadCurrentQuestion() → Shows question 1                     │
└─────────────────────────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────────────────────┐
│ USER TYPES ANSWER AND CLICKS "NEXT QUESTION"                    │
│ ∟ submitAnswer() is called                                     │
└─────────────────────────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND SERVICE                                                 │
│ ∟ POST /api/interview/session/{id}/qa                          │
│   Body: { question: "...", answer: "..." }                     │
└─────────────────────────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────────────────────┐
│ BACKEND SAVES Q&A                                               │
│ ∟ session.questions.push({ question, answer, timestamp })      │
│ ∟ session.save()                                                │
└─────────────────────────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────────────────────┐
│ INTERVIEW COMPONENT                                              │
│ ∟ currentQuestionIndex++ → loadCurrentQuestion()               │
│ ∟ Shows question 2, then 3, 4, 5...                            │
└─────────────────────────────────────────────────────────────────┘
            ↓
            (REPEAT FOR ALL 5 QUESTIONS)
            ↓
┌─────────────────────────────────────────────────────────────────┐
│ AFTER QUESTION 5, NO MORE QUESTIONS                             │
│ ∟ completeInterview() is called                                │
└─────────────────────────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND SERVICE                                                 │
│ ∟ PUT /api/interview/session/{id}/complete                     │
└─────────────────────────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────────────────────┐
│ BACKEND COMPLETES SESSION                                        │
│ ∟ InterviewSession.findByIdAndUpdate(                          │
│     { status: 'completed', completedAt: Date.now() }           │
│   )                                                              │
└─────────────────────────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────────────────────┐
│ REDIRECT TO DASHBOARD                                            │
│ ∟ router.navigate(['/dashboard'])                              │
└─────────────────────────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────────────────────┐
│ DASHBOARD LOADS ALL SESSIONS                                     │
│ ∟ GET /api/interview/sessions                                  │
│ ∟ Shows completed session with all Q&A                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Concepts Explained

### 1. **Frontend vs Backend**
- **Frontend:** What you see in the browser (Angular code running in your browser)
- **Backend:** Server code (Node.js running on localhost:5002)
- They communicate via HTTP requests (like browsing a website)

### 2. **HTTP Methods**
- **GET:** Retrieve data (like viewing sessions)
- **POST:** Create new data (like creating session or adding Q&A)
- **PUT:** Update existing data (like starting or completing session)
- **DELETE:** Remove data (like deleting a session)

### 3. **Authentication Flow**
1. User logs in → Backend creates JWT token → Token stored in cookie
2. Every request sends cookie → Backend verifies token → Knows who you are
3. Backend checks if session belongs to you before allowing actions

### 4. **Observable Pattern (RxJS)**
```typescript
this.service.getData().subscribe({
  next: (response) => { 
    // This runs when data arrives successfully
  },
  error: (err) => { 
    // This runs if something goes wrong
  }
});
```
Think of it like ordering food delivery:
- You place an order (make HTTP request)
- You wait (Observable is pending)
- Food arrives (next callback runs) OR something went wrong (error callback runs)

### 5. **Database Operations**
- **Create:** `InterviewSession.create()` - Make new document
- **Read:** `InterviewSession.find()` - Get documents
- **Update:** `InterviewSession.findByIdAndUpdate()` - Change document
- **Delete:** `InterviewSession.findByIdAndDelete()` - Remove document

---

## Questions & Answers

**Q: Where are the questions stored?**
A: In the frontend component (`defaultQuestions` array). They're not fetched from backend.

**Q: Where are the answers stored?**
A: In MongoDB database, in the `interviewsessions` collection, in the `questions` array field.

**Q: How does the backend know who is logged in?**
A: The JWT token in the cookie contains the user ID. The auth middleware decodes it and loads the user.

**Q: What if I close the browser mid-interview?**
A: The session is saved in the database. When you return, you can continue from the dashboard by clicking "Continue" on the in-progress session.

**Q: Can I change the questions?**
A: Yes, edit the `defaultQuestions` array in `interview.ts`. No backend changes needed.

**Q: How is the score calculated?**
A: Currently it's set to 0. You would need to add AI/logic to evaluate answers and update the score field.

---

**This documentation covers the complete technical flow from button click to database storage and back to the user interface.**
