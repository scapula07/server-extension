const express = require('express');

const {streamLive} = require('./../controllers/ringControllers');

const router = express.Router();


router.route('/stream-live').get(streamLive);
module.exports = router;