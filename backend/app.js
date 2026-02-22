import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";
import resumeRoutes from "./routes/resume.js";
import interviewRoutes from "./routes/interview.js";
import path from "path";
import bcrypt from "bcryptjs";
import cors from "cors";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
dotenv.config();

const app = express();

app.use(cors({origin: 'http://localhost:4200', credentials: true}));
app.use(express.json());
app.use(cookieParser());

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/LoginApp";
const JWT_SECRET = process.env.JWT_SECRET;
// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));
//Register API
app.post("/api/register", async(req, res)=>{
    try{
        const {name, email, mobile, password} = req.body;
        if(!name || !email || !mobile|| !password)
            return res.status(400).json({status:"error", msg:"Please enter all fields"});
        const existingUser = await User.findOne({email});
        if(existingUser)
            return res.status(400).json({status:"error", msg:"User with this email already exists"});
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            name,
            email,
            mobile,
            password: hashedPassword,
        });
        await newUser.save();
        return res.status(201).json({status:"Success", msg:"User registered successfully"});
    } catch(error){
        console.error("Error in /api/register:", error);
        return res.status(500).json({msg: error.message});

    }
})

app.post("/api/login", async(req, res)=>{
    try{
        const {email, password} = req.body;
        if(!email || !password)
            return res.status(400).json({status:"error", msg:"Please enter all fields"});
        const existingUser = await User.findOne({email});
        if(!existingUser)
            return res.status(400).json({status:"error", msg:"User does not exist"});
        const isPasswordValid = await bcrypt.compare(password, existingUser.password);
        if(!isPasswordValid)
            return res.status(401).json({status:"error", msg:"Invalid credentials"});
        const token = jwt.sign({userId: existingUser._id, email: existingUser.email}, JWT_SECRET, {expiresIn: "1h"});
        res.cookie("token", token, {httpOnly: true, secure: false, sameSite: "lax", maxAge: 3600000});
        return res.status(200).json({status:"Success", msg:"Login successful", token});
    } catch(error){
        console.error("Error in /api/login:", error);
        return res.status(500).json({msg: error.message});
    }
})
app.get("/api/user", async(req, res)=>{
    try{
        const token = req.cookies.token;        
        if(!token)
            return res.status(401).json({status:"error", msg:"No Tokens Found!!"});          
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId).select("-password");       
        if(!user)   
            return res.status(404).json({status:"error", msg:"User not found"});        
        return res.status(200).json({status:"Success", user});
    } catch(error){
        console.error("Error in /api/user:", error);
        return res.status(500).json({msg: error.message});
    }   
})
app.post("/api/logout", (req, res)=>{
    res.clearCookie("token", {httpOnly: true, secure: false, sameSite: "lax"});
    return res.status(200).json({status:"Success", msg:"Logged out successfully"});
});
const PORT = process.env.PORT || 5000;
app.use("/uploads", express.static("uploads"));
app.use("/api/resume", resumeRoutes);
app.use("/api/interview", interviewRoutes);
app.listen(PORT, () => console.log(`Server running on ${PORT}`)); 