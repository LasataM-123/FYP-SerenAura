const express = require('express');
const { tokenHandler } = require('../middlewares/tokenHandler');
const { validPatient } = require('../middlewares/validPatient');
const { addRecentSearch, getRecentSearches, deleteRecentSearch, suggestRecentSearch } = require('../controllers/recentSearchController');
const router = express.Router();

router.post('/add',tokenHandler,validPatient, addRecentSearch);
router.get('/get',tokenHandler,validPatient,getRecentSearches)
router.delete('/delete/:id',tokenHandler,validPatient,deleteRecentSearch);
router.get('/suggest',tokenHandler,validPatient, suggestRecentSearch);

module.exports = router;