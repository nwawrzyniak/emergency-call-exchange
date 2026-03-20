const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

router.post('/register', [
  body('userName').trim().notEmpty(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').trim().notEmpty(),
  body('lastName').trim().notEmpty(),
  body('phoneNumber').trim().notEmpty(),
  body('age').isInt({ min: 18 }),
  body('gender').isIn(['male', 'female', 'non-binary', 'other'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userName, email, password, firstName, lastName, phoneNumber, age, gender } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const existingUserName = await User.findOne({ where: { userName } });
    if (existingUserName) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    const userCount = await User.count();
    const role = userCount === 0 ? 'super-administrator' : 'user';

    const user = await User.create({
      userName,
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      age,
      gender,
      role
    });

    const token = signToken(user.id);

    res.status(201).json({
      status: 'success',
      token,
      user: {
        id: user.id,
        userName: user.userName,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        age: user.age,
        gender: user.gender
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Incorrect email or password' });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'Your account has been deactivated' });
    }

    const token = signToken(user.id);

    res.json({
      status: 'success',
      token,
      user: {
        id: user.id,
        userName: user.userName,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        age: user.age,
        gender: user.gender
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
