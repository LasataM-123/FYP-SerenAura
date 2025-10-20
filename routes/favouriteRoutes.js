const express = require('express');
const router = express.Router();
const { tokenHandler } = require('../middlewares/tokenHandler');
const { validPatient } = require('../middlewares/validPatient');
const { addFavourite, getFavourites, removeFavourite, checkFavourite } = require('../controllers/favouriteController');

router.post('/add',tokenHandler, validPatient, addFavourite);
router.get('/get',tokenHandler, validPatient, getFavourites);
router.delete('/remove/:id',tokenHandler,validPatient, removeFavourite);
router.get('/check/:mediaId',tokenHandler, validPatient, checkFavourite);

module.exports = router;