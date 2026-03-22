import express from 'express';
import { body, validationResult } from 'express-validator';
import { Op } from 'sequelize';
import { CallRequest, User } from '../models/index.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/request', [
  body('callTime').isISO8601(),
  body('preferenceGender').optional().isIn(['male', 'female', 'non-binary', 'other', 'any']),
  body('preferenceAgeMin').optional().isInt({ min: 18 }),
  body('preferenceAgeMax').optional().isInt({ max: 120 }),
  body('suggestedContactName').optional().trim(),
  body('scenario').optional().isIn(['emergency', 'date-escape', 'work-meeting', 'other']),
  body('notes').optional().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const callRequest = await CallRequest.create({
      requesterId: req.user.id,
      ...req.body
    });

    const match = await findMatch(callRequest);

    if (match) {
      callRequest.callerId = match.id;
      callRequest.status = 'matched';
      callRequest.matchedAt = new Date();
      await callRequest.save();

      await callRequest.reload({
        include: [
          { model: User, as: 'requester', attributes: ['id', 'firstName', 'lastName', 'phoneNumber', 'age', 'gender'] },
          { model: User, as: 'caller', attributes: ['id', 'firstName', 'lastName', 'phoneNumber', 'age', 'gender'] }
        ]
      });

      return res.status(201).json({
        status: 'success',
        message: 'Match found!',
        callRequest
      });
    }

    res.status(201).json({
      status: 'success',
      message: 'Call request created, waiting for match',
      callRequest
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function findMatch(callRequest) {
  const query = {
    isAvailable: true,
    isActive: true,
    id: { [Op.ne]: callRequest.requesterId }
  };

  if (callRequest.preferenceGender && callRequest.preferenceGender !== 'any') {
    query.gender = callRequest.preferenceGender;
  }

  query.age = {
    [Op.gte]: callRequest.preferenceAgeMin || 18,
    [Op.lte]: callRequest.preferenceAgeMax || 120
  };

  const requester = await User.findByPk(callRequest.requesterId);
  const matches = await User.findAll({
    where: query,
    order: [['ratingAverage', 'DESC']]
  });

  for (const match of matches) {
    if (match.callForGenders && match.callForGenders.length > 0) {
      if (!match.callForGenders.includes('any') && !match.callForGenders.includes(requester.gender)) {
        continue;
      }
    }

    if (requester.age < match.callForAgeMin || requester.age > match.callForAgeMax) {
      continue;
    }

    return match;
  }

  return null;
}

router.get('/my-requests', async (req, res) => {
  try {
    const requests = await CallRequest.findAll({
      where: { requesterId: req.user.id },
      include: [
        { model: User, as: 'caller', attributes: ['id', 'firstName', 'lastName', 'phoneNumber', 'age', 'gender'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ status: 'success', count: requests.length, requests });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/my-calls', async (req, res) => {
  try {
    const calls = await CallRequest.findAll({
      where: { callerId: req.user.id },
      include: [
        { model: User, as: 'requester', attributes: ['id', 'firstName', 'lastName', 'phoneNumber', 'age', 'gender'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ status: 'success', count: calls.length, calls });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/pending', async (req, res) => {
  try {
    const pendingRequests = await CallRequest.findAll({
      where: {
        status: 'pending',
        callTime: { [Op.gte]: new Date() }
      },
      include: [
        { model: User, as: 'requester', attributes: ['id', 'firstName', 'lastName', 'age', 'gender'] }
      ],
      order: [['callTime', 'ASC']]
    });

    const matchableRequests = [];

    for (const request of pendingRequests) {
      let matches = true;

      if (request.preferenceGender && request.preferenceGender !== 'any' && req.user.gender !== request.preferenceGender) {
        matches = false;
      }

      const minAge = request.preferenceAgeMin || 18;
      const maxAge = request.preferenceAgeMax || 120;
      if (req.user.age < minAge || req.user.age > maxAge) {
        matches = false;
      }

      if (req.user.callForGenders && req.user.callForGenders.length > 0) {
        if (!req.user.callForGenders.includes('any') && !req.user.callForGenders.includes(request.requester.gender)) {
          matches = false;
        }
      }

      const requesterAge = request.requester.age;
      if (requesterAge < req.user.callForAgeMin || requesterAge > req.user.callForAgeMax) {
        matches = false;
      }

      if (matches) {
        matchableRequests.push(request);
      }
    }

    res.json({ status: 'success', count: matchableRequests.length, requests: matchableRequests });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/accept', async (req, res) => {
  try {
    const callRequest = await CallRequest.findByPk(req.params.id);

    if (!callRequest) {
      return res.status(404).json({ error: 'Call request not found' });
    }

    if (callRequest.status !== 'pending') {
      return res.status(400).json({ error: 'Call request is not available' });
    }

    callRequest.callerId = req.user.id;
    callRequest.status = 'matched';
    callRequest.matchedAt = new Date();
    await callRequest.save();

    await callRequest.reload({
      include: [
        { model: User, as: 'requester', attributes: ['id', 'firstName', 'lastName', 'phoneNumber', 'age', 'gender'] },
        { model: User, as: 'caller', attributes: ['id', 'firstName', 'lastName', 'phoneNumber', 'age', 'gender'] }
      ]
    });

    res.json({ status: 'success', callRequest });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/complete', [
  body('rating').optional().isInt({ min: 1, max: 5 }),
  body('feedback').optional().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const callRequest = await CallRequest.findByPk(req.params.id);

    if (!callRequest) {
      return res.status(404).json({ error: 'Call request not found' });
    }

    if (callRequest.requesterId !== req.user.id && callRequest.callerId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    callRequest.status = 'completed';
    callRequest.completedAt = new Date();

    if (req.body.rating && callRequest.callerId) {
      callRequest.rating = req.body.rating;
      callRequest.feedback = req.body.feedback;

      const caller = await User.findByPk(callRequest.callerId);
      const newCount = caller.ratingCount + 1;
      const newAverage = ((caller.ratingAverage * caller.ratingCount) + req.body.rating) / newCount;

      caller.ratingAverage = newAverage;
      caller.ratingCount = newCount;
      await caller.save();
    }

    await callRequest.save();

    res.json({ status: 'success', callRequest });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const callRequest = await CallRequest.findByPk(req.params.id);

    if (!callRequest) {
      return res.status(404).json({ error: 'Call request not found' });
    }

    if (callRequest.requesterId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (callRequest.status === 'completed') {
      return res.status(400).json({ error: 'Cannot cancel completed request' });
    }

    callRequest.status = 'cancelled';
    await callRequest.save();

    res.json({ status: 'success', message: 'Call request cancelled' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
