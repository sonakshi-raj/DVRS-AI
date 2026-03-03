# DVRS-AI  
### Digital Virtual Resume-Oriented Screening using AI

DVRS-AI is an AI-powered interview evaluation system that automates resume-based interviews using structured rubric scoring and deterministic confidence analysis.

It integrates resume parsing, AI-generated question creation, answer evaluation, behavioral analysis, and interview summarization into a scalable and explainable platform.

---

##  Motivation

Traditional interviews suffer from:

- Subjective evaluation
- Inconsistent scoring
- Lack of structured feedback
- Scalability challenges
- Bias introduced by individual interviewers

DVRS-AI addresses these issues through a standardized, rubric-based AI evaluation framework.

---

##  Objectives

- Automate interview evaluation using structured rubric scoring
- Ensure fair, consistent, and explainable assessment
- Analyze both technical knowledge and communication confidence
- Provide actionable feedback
- Enable scalable interview processes

---

#  Core Features

## 1. Resume-Based Interview Workflow

- Resume upload and parsing
- Dynamic AI-generated questions
- Session-based interview management
- Persistent interview state tracking


## 2. AI-Based Answer Evaluation

Each answer is evaluated using a weighted rubric model:

| Dimension                | Weight |
|--------------------------|--------|
| Technical Accuracy       | 40%    |
| Depth of Explanation     | 25%    |
| Clarity of Communication | 20%    |
| Relevance                | 15%    |


- Each dimension is normalized (1–10 scale)
- Answers are classified as: GOOD, AVERAGE, or BAD


## 3. Overall Interview Score

- Each question produces an independent score
- Overall score = Average of all question scores
- Prevents a single weak response from dominating the result


## 4. Deterministic Confidence Analysis

Confidence is derived using explainable indicators:

- Voice Clarity (speech rate)
- Speech Pace consistency
- Eye Contact approximation
- Facial Confidence (LLM clarity/depth signals)


#  System Architecture

## Interview Flow

1. Candidate uploads resume
2. Resume is parsed and normalized
3. AI generates contextual questions
4. Candidate records video/audio response
5. Audio extracted and transcribed (Whisper)
6. LLM evaluates answer using rubric
7. Scores and feedback generated
8. Results stored and displayed in dashboard

---

#  Tech Stack

## Frontend
- Angular

## Backend
- Node.js
- Express.js
- JWT Authentication
- MongoDB & Mongoose

## AI Services
- HuggingFace API
- Whisper API (Speech-to-Text)
- LLM
- LangChain

## Version Control
- GitHub

---

#  Installation Guide

## 1. Clone Repository

```bash
git clone https://github.com/your-username/DVRS-AI.git
cd DVRS-AI
```

## 2. Backend Setup

```bash
cd backend
npm install
```
Create .env file

```bash
PORT=5002
MONGODB_URI=mongodb://127.0.0.1:27017/DVRS
JWT_SECRET=your_secret_key
JWT_EXPIRE=1h
NODE_ENV=development
```
Start MongoDB locally.

Run backend:
```bash
npm run dev
```

## 2. Frontend Setup

```bash
cd frontend
npm install
ng serve
```
Open in browser:
```bash
http://localhost:4200
```
---
##  Team

- Dipraa Arora  
- Vedasree Kanikicharla  
- Rohini Badabagni  
- Sonakshi Raj  
