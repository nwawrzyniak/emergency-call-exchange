import express from 'express';
import { body, validationResult } from 'express-validator';
import { User } from '../models/index.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/me', async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });
    res.json({ status: 'success', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/me', [
  body('phoneNumber').optional().trim().notEmpty(),
  body('dateOfBirth').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Validate age if dateOfBirth is provided
    if (req.body.dateOfBirth) {
      const birthDate = new Date(req.body.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age < 18) {
        return res.status(400).json({ error: 'You must be at least 18 years old' });
      }
    }

    const allowedFields = ['phoneNumber', 'dateOfBirth'];
    const updates = {};

    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    await User.update(updates, { where: { id: req.user.id } });
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    res.json({ status: 'success', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/availability', [
  body('isAvailable').optional().isBoolean().toBoolean(),
  body('callForGenders').optional().isArray(),
  body('callForGenders.*').optional().isIn(['male', 'female', 'non-binary', 'other', 'any']),
  body('callForAgeMin').optional().isInt({ min: 18 }).toInt(),
  body('callForAgeMax').optional().isInt({ max: 120 }).toInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const updates = {};

    if (req.body.isAvailable !== undefined) updates.isAvailable = req.body.isAvailable;
    if (req.body.callForGenders !== undefined) updates.callForGenders = req.body.callForGenders;
    if (req.body.callForAgeMin !== undefined) updates.callForAgeMin = req.body.callForAgeMin;
    if (req.body.callForAgeMax !== undefined) updates.callForAgeMax = req.body.callForAgeMax;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields provided' });
    }

    await User.update(updates, { where: { id: req.user.id } });
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    res.json({ status: 'success', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', restrictTo('super-administrator', 'administrator', 'moderator'), async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] }
    });
    res.json({ status: 'success', count: users.length, users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id/role', restrictTo('super-administrator', 'administrator'), [
  body('role').isIn(['administrator', 'moderator', 'trusted-user', 'user'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { role } = req.body;

    if (req.user.role === 'administrator' && role === 'super-administrator') {
      return res.status(403).json({ error: 'Cannot promote to super-administrator' });
    }

    const [updated] = await User.update(
      { role },
      { where: { id: req.params.id } }
    );

    if (!updated) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });

    res.json({ status: 'success', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', restrictTo('super-administrator', 'administrator'), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'super-administrator' && req.user.role !== 'super-administrator') {
      return res.status(403).json({ error: 'Cannot delete super-administrator' });
    }

    await User.update({ isActive: false }, { where: { id: req.params.id } });

    res.json({ status: 'success', message: 'User deactivated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
