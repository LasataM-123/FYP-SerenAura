const express = require('express');
const { tokenHandler } = require('../middlewares/tokenHandler');
const { validPatient } = require('../middlewares/validPatient');
const { createPlaylist, getUserPlaylists, getPlaylistById, addMediaToPlaylist, removeMediaFromPlaylist, deletePlaylist, checkMediaInPlaylist } = require('../controllers/playlistController');
const router = express.Router();

router.post('/create', tokenHandler, validPatient, createPlaylist);
router.get('/',tokenHandler, validPatient, getUserPlaylists);
router.get('/get/:id',tokenHandler, validPatient, getPlaylistById);
router.post('/add/:playlistId',tokenHandler, validPatient, addMediaToPlaylist);
router.delete('/remove/:playlistId/:junctionId',tokenHandler,validPatient, removeMediaFromPlaylist);
router.delete('/delete/:id', tokenHandler,validPatient, deletePlaylist);
router.post('/check/:mediaId',tokenHandler, validPatient, checkMediaInPlaylist);

module.exports = router;