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
  body('firstName').optional().trim().notEmpty(),
  body('lastName').optional().trim().notEmpty(),
  body('phoneNumber').optional().trim().notEmpty(),
  body('age').optional().isInt({ min: 18 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const allowedFields = ['firstName', 'lastName', 'phoneNumber', 'age'];
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
  body('isAvailable').isBoolean(),
  body('callForGenders').optional().isArray(),
  body('callForAgeMin').optional().isInt({ min: 18 }),
  body('callForAgeMax').optional().isInt({ max: 120 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const updates = {};
    
    if (req.body.isAvailable !== undefined) updates.isAvailable = req.body.isAvailable;
    if (req.body.callForGenders) updates.callForGenders = req.body.callForGenders;
    if (req.body.callForAgeMin) updates.callForAgeMin = req.body.callForAgeMin;
    if (req.body.callForAgeMax) updates.callForAgeMax = req.body.callForAgeMax;

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
