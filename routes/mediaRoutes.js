const express = require('express');
const router = express.Router();
const { tokenHandler } = require('../middlewares/tokenHandler');
const { validPatient } = require('../middlewares/validPatient');
const { getRecommendations, filterByCategory, getIndividualMedia, searchContent,  } = require('../controllers/mediaController');

router.get('/get-recommendations',tokenHandler, validPatient,getRecommendations);

router.get('/filter', tokenHandler, validPatient, filterByCategory);

router.get('/individual/:id',tokenHandler, validPatient, getIndividualMedia);

router.get('/search',tokenHandler,validPatient,searchContent);
module.exports = router;
