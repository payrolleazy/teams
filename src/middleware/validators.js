import { body, validationResult } from 'express-validator';
import { convert } from 'html-to-text';

export function validateMeetingRequest(req, res, next) {
  const validations = [
    body('title')
      .notEmpty()
      .trim()
      .escape()
      .isLength({ max: 100 })
      .withMessage('Title must not exceed 100 characters'),
    
    body('startTime')
      .isISO8601()
      .withMessage('Start time must be a valid ISO 8601 date')
      .custom(value => {
        const startTime = new Date(value);
        const now = new Date();
        if (startTime < now) {
          throw new Error('Start time must be in the future');
        }
        return true;
      }),
    
    body('duration')
      .isInt({ min: 1, max: 1440 })
      .withMessage('Duration must be between 1 and 1440 minutes'),
    
    body('participants')
      .isArray()
      .notEmpty()
      .withMessage('At least one participant is required')
      .custom(participants => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return participants.every(email => emailRegex.test(email));
      })
      .withMessage('All participants must have valid email addresses'),

    body('emailBody')
      .optional()
      .custom((value, { req }) => {
        if (value) {
          // If HTML content is provided, ensure it has a plain text fallback
          if (value.html && !value.text) {
            req.body.emailBody.text = convert(value.html);
          }
          // If only plain text is provided, use it for both
          if (value.text && !value.html) {
            req.body.emailBody.html = value.text;
          }
          return true;
        }
        return true;
      })
      .withMessage('Invalid email body format')
  ];

  Promise.all(validations.map(validation => validation.run(req)))
    .then(() => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed',
          details: errors.array() 
        });
      }
      next();
    });
}

export function validateAuthRequest(req, res, next) {
  next();
}