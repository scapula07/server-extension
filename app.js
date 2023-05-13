
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const connectionRoutes = require('./routes/connectionRoutes');
const streamRoutes = require('./routes/streamRoutes');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const admin = require("firebase-admin");
const serviceAccount=require("./firebase/serviceAccount.json")


admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    // databaseURL: "https://aadharcardscanner-72071.firebaseio.com",
  });

const app = express();

app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use(cors());
app.options('*', cors());
app.use(express.static('./public'));

app.use('/api/v1/cams', connectionRoutes);
app.use('/api/v1/cams', streamRoutes,express.static('./public'));


app.all('*', (req, res, next) => {
    const err = new AppError(`Can't find ${req.originalUrl} on this server`, 404);
    next(err);
  });
  
  app.use(globalErrorHandler);


module.exports = app;