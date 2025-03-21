import express from 'express';
import { validateMeetingRequest } from '../middleware/validators.js';
import { authenticateToken } from '../middleware/auth.js';
import { createTeamsMeeting } from '../services/meetingService.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

router.post('/create', authenticateToken, validateMeetingRequest, async (req, res) => {
  try {
    const { title, startTime, duration, participants } = req.body;
    const accessToken = req.token;

    const meeting = await createTeamsMeeting({
      accessToken,
      title,
      startTime,
      duration,
      participants
    });

    res.json({
      joinUrl: meeting.joinUrl,
      meetingId: meeting.id,
      startTime: meeting.startDateTime,
      endTime: meeting.endDateTime
    });
  } catch (error) {
    logger.error('Error creating meeting:', error);
    res.status(500).json({ error: 'Failed to create meeting' });
  }
});

export { router as meetingRouter };