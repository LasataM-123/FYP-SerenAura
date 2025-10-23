const express = require('express');
const router = express.Router();

const {
  createOrUpdateMood,
  getCalendarMoodEntries,
  getMonthlyInsights,
  getTodayMood,
} = require('../controllers/moodController');
const { tokenHandler } = require('../middlewares/tokenHandler');
const { validPatient } = require('../middlewares/validPatient');

router.post('/add-update', tokenHandler, validPatient, createOrUpdateMood);
router.get('/calendar', tokenHandler, validPatient, getCalendarMoodEntries);
router.get('/insights', tokenHandler, validPatient, getMonthlyInsights);
router.get('/today', tokenHandler, validPatient, getTodayMood);

module.exports = router;
