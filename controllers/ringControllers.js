const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
require('dotenv').config();
const fs = require("fs");
const  { RingApi } =require('ring-client-api')
const  { promisify } =require('util')
const admin = require("firebase-admin");
const axios = require('axios');
const  { mkdir, rm } =require( 'node:fs/promises')
    path = require('path'),
    express = require('express')


    function sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

exports.getLocation = async (req, res, next) => {
  const {uid } = req.body;
  const db=admin.firestore();
  const user= (await db.collection("users").doc(uid).get()).data()
    console.log(user)
const ringApi = new RingApi({
  refreshToken:user.token
})

    const locations = await ringApi.getLocations()
    // console.log(locations,"locations")
    const location = locations[0]
    console.log(location,"location")

    res.status(200).json({
        status: 'success',
        message:location.locationDetails.address
      });

    
     
}


exports.getHistory = async (req, res, next) => {
    const {uid } = req.body;
    const db=admin.firestore();
    const user= (await db.collection("users").doc(uid).get()).data()
    console.log(user)
    const ringApi = new RingApi({
    refreshToken:user.token
     })
  
    const locations = await ringApi.getLocations()
    // console.log(locations,"locations")
    const location = locations[0]
    const history =await location.getHistory()
    console.log(history,"history")
  
    res.status(200).json({
        status: 'success',
        message:location.locationDetails.address
      });

    
     
}


exports.getAllCams= async (req, res, next) => {
  
    const {uid } = req.body
     console.log(uid)
    const db=admin.firestore();
    const user= (await db.collection("users").doc(uid).get()).data()
   
    const ringApi = new RingApi({
        refreshToken:user.token
      })

    const locations = await ringApi.getLocations()
  
    const location = locations[0]
    const cams=[]
     console.log( location.cameras)
      location.cameras.forEach(async(camera)=>{
        let  imageBuffer
      try{
         imageBuffer =await camera.getSnapshot() 
      }catch(e){
        imageBuffer=""
        console.log(e)
      }
       
    
        const {id,kind,description,device_id,health,battery_life}=camera.initialData
        
       const cam= {
        id,kind,description,device_id,health,battery_life,imageBuffer
        
       }
         cams.push(cam)
         if(cams.length=== location.cameras.length){
          res.status(200).json({
            status: 'success',
            message:cams
          });
         }
       
    
         
        
    })
   


   
    
     
}


exports.getCameraRecording = async (req, res, next) => {

      const {uid,camId } = req.body;
      console.log(camId)
      const db=admin.firestore();
      const user= (await db.collection("users").doc(uid).get()).data()
     
      const ringApi = new RingApi({
         refreshToken:user.token
       })
  
    const locations = await ringApi.getLocations()

    const location = locations[0]
     console.log(location.cameras)
    const camera = location.cameras.find(cam=>
      cam.initialData.id=== Number(camId))
   
    
    const event =await camera.getEvents({
      limit: 10,
      // kind: 'ding',
      state: 'accepted'
    })
    
    const eventsWithRecordings = event.events.filter(
      (event) => event.recording_status === 'ready'
      )

    const recordings=[]

    eventsWithRecordings.forEach(async(recording)=>{
      console.log(recording,"recording")
      let url
      try{
        url =await camera.getRecordingUrl(
          recording.ding_id_str,
          {
            transcoded: true, 
          }
        )
        console.log(url,"url")

     }catch(e){
      url=""
       console.log(e)
     }
     const {created_at,event_id,kind}=recording
     const record={event_id,created_at,url,kind}
     recordings.push(record)
     if(recordings.length=== eventsWithRecordings.length){
      res.status(200).json({
        status: 'success',
        message:recordings
      });
     }
    })
    
  }


exports.streamLive = async (req, res, next) => {
  
    // [camera] = await ringApi.getCameras()
    const locations = await ringApi.getLocations()
    const camera = locations[0].cameras[1]

    if (!camera) {
        console.log('No cameras found')
        return
      }
    
      const app = express()
      const publicOutputDirectory = path.join('public', 'output')
    
 
        if (!(await promisify(fs.exists)(publicOutputDirectory))) {
            await promisify(fs.mkdir)(publicOutputDirectory)
        }
      
      console.log("starting stream")
      const sipSession = await camera.streamVideo({
        output: [
          '-preset',
          'veryfast',
          '-g',
          '25',
          '-sc_threshold',
          '0',
          '-f',
          'hls',
          '-hls_time',
          '2',
          '-hls_list_size',
          '6',
          '-hls_flags',
          'delete_segments',
          path.join(publicOutputDirectory, 'stream.mp3'),
        ],
      })
    

    
      sipSession.onCallEnded.subscribe(() => {
        console.log('Call has ended')
        process.exit()
      })
    
      setTimeout(function () {
        console.log('Stopping call...')
        sipSession.stop()
      }, 5 * 60 * 10000000) // Stop after 5 minutes.
}



exports.notification = async (req, res, next) => {
  const {uid,notificationId } = req.body
   
    const API_KEY = "AAAAafh47Mk:APA91bGlt0RkOIV9_p1Bh4ZeFaz85nZ8Sr9XY6zGJDlN81WfXx3aHJhscUWUAUAHNzWEuskURwht0VhBgRe3recArA0BRp-GVU9pag7shgoXjC_wID1u34iIndNYSsBlKA06YSfUv-Ee"
    const url = 'https://fcm.googleapis.com/fcm/send';
    const data = {
        // to:notificationId,
        to: 'APA91bG1lg2J0dVEyeQUdQnAI-Ug1PULvIMSR48C-8G03fLjkS8JSPIx6YkgOZHk43gpduVcMmo8JZzy2enlcFQ_v8O5EwjvpNexOHXVp2hVHea8xO42PbalRG-8DPlAnW6Vu_eTj_eVnQsKXmZM2DV-Fg_8PqFWZw',
        notification: {
          title: 'Cams notification,Hello',
          body: 'Yellow'
        }
      };

      const config = {
        headers: {
            Authorization: `key=${API_KEY}`,
            'Content-Type': 'application/json',
         },
    };
    
    try{
        const response=await axios.post(url, data, config)
        console.log(response.data,"res")
        res.status(200).json({
          status: 'success',
          message:response.data.message
        });
       
     
    }catch(e){
        console.log(e,"err")
    }
    

    
}




exports.startStream = async (req, res, next) => {
  const {uid,camId } = req.body;
  console.log(camId)
  const db=admin.firestore();
  const user= (await db.collection("users").doc(uid).get()).data()
 
  const ringApi = new RingApi({
     refreshToken:user.token
   })



const locations = await ringApi.getLocations()

const location = locations[0]
console.log(location.cameras)
const camera = location.cameras.find(cam=>
cam.initialData.id=== Number(camId))

const publicOutputDirectory = path.join('public', 'output')
    
const done=await rm(publicOutputDirectory, {
  force: true,
  recursive: true,
})

if (!(await promisify(fs.exists)(publicOutputDirectory))) {
    await promisify(fs.mkdir)(publicOutputDirectory)
}

const call = await camera.streamVideo({
  // save video 10 second parts so the mp4s are playable and not corrupted:
  // https://superuser.com/questions/999400/how-to-use-ffmpeg-to-extract-live-stream-into-a-sequence-of-mp4
  output: [
    '-flags',
    '+global_header',
    '-f',
    'segment',
    '-segment_time',
    '20', // 10 seconds
    '-segment_format_options',
    'movflags=+faststart',
    '-reset_timestamps',
    '1',
    path.join(publicOutputDirectory,'part%d.mp4'),
  ],


})

console.log('Video started, streaming to part files...')

  call.onCallEnded.subscribe(() => {
    console.log('Call has ended')
    process.exit()
  })

  setTimeout(function () {
    console.log('Stopping call...')
    call.stop()
    // const videoPath =  path.join(publicOutputDirectory,'part0.mp4')
    // console.log(videoPath,"path")
    // const videoSize = fs.statSync(videoPath).size
    // console.log(videoSize,"size")
    }, 60 * 1000) // Stop after 1 minute

    console.log(done)
    res.status(200).json({
      status: 'success',
      message:"Streamed to files"
    });
}


exports.stream = async (req, res, next) => {
  // const {uid,camId } = req.body;
  const range = req.headers.range
  console.log(range,"range")

  await sleep(8000); 


  const publicOutputDirectory = path.join('public', 'output')
 

    const videoPath =  path.join(publicOutputDirectory,'part0.mp4')
    console.log(videoPath,"path")
    const videoSize = fs.statSync(videoPath).size
    console.log(videoSize,"size")

    const chunkSize = 1 * 1e6;
    const start = Number(range.replace(/\D/g, ""))
    const end = Math.min(start + chunkSize, videoSize - 1)
    const contentLength = end - start + 1;

    const headers = {
        "Content-Range": `bytes ${start}-${end}/${videoSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": contentLength,
        "Content-Type": "video/mp4"
    }
    res.writeHead(206, headers)
    const stream = fs.createReadStream(videoPath, {
        start,
        end
    })
    console.log(stream,"stream")
    stream.pipe(res)


}


exports.getDevices = async (req, res, next) => {
  const {uid,camId } = req.body;
  console.log(camId)
  const db=admin.firestore();
  const user= (await db.collection("users").doc(uid).get()).data()
  console.log(user)
  const ringApi = new RingApi({
     refreshToken:user.token
   })


   const locations = await ringApi.getLocations()
    console.log(locations)
   const location = locations[0]
  try{
    const devices = await location.getDevices()
    console.log(devices,"devices")
    const baseStation = devices.find(
      (device) => device.data.deviceType === RingDeviceType.BaseStation
    )
    console.log(baseStation,"station")

  
  }catch(e){
    console.log(e)
  }
 

  
  


}
