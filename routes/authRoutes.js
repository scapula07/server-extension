const express = require('express');

const {ringConnection,send2fa} = require('./../controllers/camsAuthController');


// const {streamLive} = require('./../controllers/ringControllers');

const router = express.Router();

router.route('/ring-connect').get(ringConnection);
router.route('/send-2fa').post(send2fa);

module.exports = router;