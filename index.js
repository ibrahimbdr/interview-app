require('dotenv').config()
var express = require('express');
const admin = require('firebase-admin');
const mongoose = require("mongoose");
var jwt = require('jsonwebtoken');
var uuid4 = require('uuid4');
var cors = require('cors');
var app = express();
app.use(express.json());

app.use(cors());

const serviceAccount = require('./live-video.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'live-video-b3e1d.appspot.com'
});

const bucket = admin.storage().bucket()

const databaseURL = "mongodb+srv://ibrahim:KhMDhZJu5xbBhVIV@cluster0.41pcn2k.mongodb.net/interview-app?retryWrites=true&w=majority"

mongoose.connect(databaseURL, {
  useNewUrlParser: true,
});

const db = mongoose.connection;
db.on("error", (error) => console.error(error));
db.once("open", () => console.log("Connected to database"));


app.get('/generateManagementToken', function(req, res) {
    var app_access_key = process.env.APP_ACCESS_KEY;
    var app_secret = process.env.APP_SECRET;
    var payload = {
        access_key: app_access_key,
        type: 'management',
        version: 2,
        iat: Math.floor(Date.now() / 1000),
        nbf: Math.floor(Date.now() / 1000)
    };

    jwt.sign(
        payload,
        app_secret,
        {
            algorithm: 'HS256',
            expiresIn: '24h',
            jwtid: uuid4()
        },
        function (err, token) {
            if (err) {
                res.status(500).json({ error: 'Token generation failed' });
            } else {
                res.json({ token: token });
            }
        }
    );
});

const logSchema = new mongoose.Schema({
    log: String,
    timestamp: Date
  });
  
  const Log = mongoose.model("Log", logSchema);
  
  app.post('/generateStreamingLogs', async (req, res) => {
    const log = req.body.log;
  
    const logDocument = new Log({
      log: log,
      timestamp: new Date()
    });
  
    try {
      await logDocument.save();
      res.status(200).send('Log saved successfully');
    } catch (error) {
      console.error(error);
      res.status(500).send('Failed to save log');
    }
  });
  

const port = process.env.PORT || 4242;
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
