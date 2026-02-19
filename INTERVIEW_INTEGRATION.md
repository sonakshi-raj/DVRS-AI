# Interview Session Integration

## Overview
The interview session functionality has been fully integrated between the backend and frontend. This allows users to conduct, manage, and track mock interview sessions.

## Backend API Endpoints

All interview endpoints are protected and require authentication.

### Base URL
```
http://localhost:5002/api/interview
```

### Endpoints

#### 1. Create Interview Session
- **POST** `/session`
- **Body**: 
  ```json
  {
    "resumeId": "optional-resume-id",
    "jobDescription": "optional-job-description"
  }
  ```
- **Response**: Returns the created session object

#### 2. Get All Sessions
- **GET** `/sessions`
- **Response**: Returns array of all user's interview sessions

#### 3. Get Session By ID
- **GET** `/session/:id`
- **Response**: Returns specific session details

#### 4. Update Session
- **PUT** `/session/:id`
- **Body**: Partial session data to update
- **Response**: Returns updated session

#### 5. Start Session
- **PUT** `/session/:id/start`
- **Response**: Updates session status to 'in-progress'

#### 6. Complete Session
- **PUT** `/session/:id/complete`
- **Response**: Updates session status to 'completed'

#### 7. Add Question & Answer
- **POST** `/session/:id/qa`
- **Body**: 
  ```json
  {
    "question": "Interview question",
    "answer": "Candidate's answer"
  }
  ```
- **Response**: Returns updated session with new Q&A

#### 8. Delete Session
- **DELETE** `/session/:id`
- **Response**: Confirmation message

## Frontend Components

### 1. Interview Service (`interview.service.ts`)
Located at: `frontend/src/app/service/interview.service.ts`

**Features:**
- TypeScript interfaces for type safety
- Full CRUD operations for interview sessions
- Observable-based HTTP calls
- Credentials support for authentication

**Main Methods:**
- `createSession()` - Create new interview session
- `getSessions()` - Fetch all sessions
- `getSessionById()` - Get specific session
- `updateSession()` - Update session data
- `startSession()` - Start interview
- `completeSession()` - Complete interview
- `addQuestionAnswer()` - Submit answer
- `deleteSession()` - Delete session

### 2. Interview Component (`interview.ts`)
Located at: `frontend/src/app/auth/interview/`

**Features:**
- Dynamic question loading
- Progress tracking
- Answer submission
- Session state management
- Error handling
- Loading states

**Functionality:**
- Automatically creates or loads sessions
- Displays questions one at a time
- Tracks progress with visual progress bar
- Validates answers before submission
- Redirects to dashboard on completion

### 3. Dashboard Component (`dashboard.ts`)
Located at: `frontend/src/app/auth/dashboard/`

**Features:**
- Display all interview sessions
- Session statistics (total, completed, average score)
- Start new interviews
- Continue in-progress interviews
- Delete sessions
- View completed session results

## Data Models

### InterviewSession Schema
```typescript
{
  _id: string;
  userId: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  resumeId?: string;
  jobDescription?: string;
  currentState: 'introduction' | 'resume-based' | 'follow-up' | 'deep-dive' | 'closing';
  questions: Array<{
    question: string;
    answer: string;
    timestamp: Date;
  }>;
  evaluation: {
    overallScore: number;
    confidenceLevel: number;
    dsaLevel: number;
    feedback: string;
  };
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}
```

## User Flow

### Starting a New Interview
1. User clicks "Start New Interview" on dashboard
2. Frontend calls `createSession()` API
3. Backend creates session with 'pending' status
4. User is redirected to interview page
5. Session status changes to 'in-progress'
6. First question is displayed

### During Interview
1. User types answer in textarea
2. Clicks "Next Question" or "Finish Interview"
3. Frontend calls `addQuestionAnswer()` API
4. Backend saves Q&A to session
5. Next question is loaded
6. Progress bar updates

### Completing Interview
1. After last question is answered
2. Frontend calls `completeSession()` API
3. Backend sets status to 'completed'
4. User redirected to dashboard
5. Results are displayed

### Managing Sessions
1. Dashboard displays all sessions
2. Sessions show status badges (pending, in-progress, completed)
3. In-progress sessions show "Continue" button
4. Completed sessions show evaluation scores
5. Any session can be deleted

## Styling

### Interview Component
- Clean, modern card-based design
- Progress bar with gradient
- Responsive layout
- Loading and error states
- Success screen on completion

### Dashboard
- Grid-based statistics cards
- Session list with status badges
- Color-coded status indicators
- Hover effects and transitions
- Mobile-responsive design

## Security

- All endpoints require authentication via JWT
- Cookies with httpOnly flag
- User can only access their own sessions
- Session ownership verified on every request

## Testing

Test files included:
- `interview.service.spec.ts` - Unit tests for interview service
- Covers all API methods
- Mocks HTTP requests
- Tests success and error scenarios

## Future Enhancements

Potential improvements:
1. AI-generated questions based on resume
2. Real-time evaluation during interview
3. Voice recording functionality
4. Video interview support
5. Peer interview matching
6. Interview scheduling
7. Performance analytics
8. Question difficulty levels
9. Industry-specific question banks
10. Interview feedback system

## Setup Instructions

### Backend
1. Ensure MongoDB is running
2. Interview routes are registered in `app.js`
3. Environment variables are configured
4. Start server: `npm start` or `node app.js`

### Frontend
1. Install dependencies: `npm install`
2. Ensure services are imported in components
3. Check base URL in `interview.service.ts` matches backend
4. Start development server: `ng serve`

## API Response Format

All API responses follow this format:
```json
{
  "success": true,
  "data": { ... },
  "count": 10,  // Optional for list endpoints
  "message": "..."  // Optional for errors
}
```

## Error Handling

Both frontend and backend implement comprehensive error handling:
- Frontend displays user-friendly error messages
- Backend returns appropriate HTTP status codes
- All errors are logged to console
- Failed requests don't crash the application

## Dependencies

### Backend
- express
- mongoose
- jsonwebtoken
- cookie-parser
- cors

### Frontend
- @angular/core
- @angular/common
- @angular/router
- @angular/forms
- rxjs

---

**Last Updated**: February 17, 2026
**Status**: ✅ Fully Integrated and Tested
