import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// @desc    Register a new user
// @route   POST /api/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;

    if (!name || !email || !mobile || !password) {
      return res.status(400).json({ status: 'error', msg: 'Please enter all fields' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ status: 'error', msg: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      email,
      mobile,
      password: hashedPassword
    });

    await newUser.save();
    return res.status(201).json({ status: 'Success', msg: 'User registered successfully' });
  } catch (error) {
    console.error('Error in /api/register:', error);
    return res.status(500).json({ msg: error.message });
  }
};

// @desc    Login user
// @route   POST /api/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ status: 'error', msg: 'Please enter all fields' });
    }

    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res.status(400).json({ status: 'error', msg: 'User does not exist' });
    }

    const isPasswordValid = await bcrypt.compare(password, existingUser.password);
    if (!isPasswordValid) {
      return res.status(401).json({ status: 'error', msg: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: existingUser._id, email: existingUser.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 3600000
    });

    return res.status(200).json({ status: 'Success', msg: 'Login successful', token });
  } catch (error) {
    console.error('Error in /api/login:', error);
    return res.status(500).json({ msg: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/user
// @access  Private
const getMe = async (req, res) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ status: 'error', msg: 'No Tokens Found!!' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(404).json({ status: 'error', msg: 'User not found' });
    }

    return res.status(200).json({ status: 'Success', user });
  } catch (error) {
    console.error('Error in /api/user:', error);
    return res.status(500).json({ msg: error.message });
  }
};

// @desc    Logout user
// @route   POST /api/logout
// @access  Private
const logoutUser = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: false,
    sameSite: 'lax'
  });
  return res.status(200).json({ status: 'Success', msg: 'Logged out successfully' });
};

export { registerUser, loginUser, getMe, logoutUser };
