const express = require('express');

const {ringConnection,send2fa} = require('./../controllers/camsAuthController');
const {getCameraRecording,notification,getLocation,getAllCams,getHistory,startStream,stream,getDevices} = require('./../controllers/ringControllers');

// const {streamLive} = require('./../controllers/ringControllers');

const router = express.Router();

router.route('/ring-connect').post(ringConnection);
router.route('/send-2fa').post(send2fa);
router.route('/ring-user-location').post(getLocation);
router.route('/get-all-Cams').post(getAllCams);
router.route('/get-cam-recording').post(getCameraRecording);
router.route('/ring-start-stream').post(startStream);
router.route('/notification').post(notification);
router.route('/ring-history').post(getHistory);
router.route('/ring-stream').get(stream);
router.route('/ring-devices').post(getDevices);
// router.route('/stream-live').get(streamLive);
module.exports = router;