const catchAsync = require('../utils/catchAsync');
const { spawn ,spawnSync} = require("child_process");
const WebSocketServer = require('ws').Server;
const axios = require('axios');
const fs = require('fs')
const admin = require("firebase-admin");

exports.send2fa = async (req, res, next) => {
      const { email,password } = req.body;
      console.log(email,password)
      const child = spawn('npx', [
        "-p",
        "ring-client-api",
        "ring-auth-cli",
        "wp",
        "plugin",
        "update",
        "--all"
    ]);


    child.stdout.pipe(process.stdout)
    process.stdin.pipe(child.stdin);
      setTimeout(() => {
        child.stdin.write(`${email}\r\n`);
        process.stdout.write(`${email}\r\n`);


      }, 2000);
    setTimeout(() => {
    child.stdin.write(`${password}\r\n`);
    //  process.stdout.write("Yaracapri123!*\r\n");

    }, 3000);

    child.stdout.on('data', function(data) {
      console.log( data.toString()==="2fa Code: ");
      fs.writeFile('test.txt', data.toString(),{flag: 'a+'}, err => {
        if (err) {
          console.error(err)
          return
        }
        //file written successfully
      })
      if(data.toString()==="2fa Code: "){
        res.status(200).json({
          status: 'success',
          message:data.toString()
        });
      }
        
       
      

 
   });
}


exports.ringConnection = async (req, res, next) => {
   const { email,password,code,uid } = req.body;
   console.log(email,password,code,uid)

   const db=admin.firestore();
   
  const url = 'https://oauth.ring.com/oauth/token';
  const data = {
    client_id: 'ring_official_android',
    grant_type: 'password',
    password:password,
    scope: 'client',
    username: email
    };

    const config = {
      headers: {
          // Authorization: `key=${API_KEY}`,
          'Content-Type': 'application/json',
          'User-Agent': 'android:com.ringapp',
          '2fa-support': 'true',
          '2fa-code':code,

       },
  };
  
  try{
      const response=await axios.post(url, data, config)
      console.log(response.data,"res")

      const userData=await db.collection("users").doc(uid).update({token:response.data.refresh_token})

      res.status(200).json({
        status: 'success',
        message:response.data.refresh_token
      });
   
  }catch(e){
      console.log(e.message,"err")
      res.status(400).json({
        status: 'failed',
        message:e.message
      });
  }
  

  

   
}

