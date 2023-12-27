require('dotenv').config()
var express = require('express');
const admin = require('firebase-admin');
const mongoose = require("mongoose");
var jwt = require('jsonwebtoken');
var uuid4 = require('uuid4');
var cors = require('cors');
const {Storage} = require('@google-cloud/storage');
var fs = require('fs');
var path = require('path');
var app = express();
app.use(express.json());

app.use(cors());
const storage = new Storage({
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
  });

const serviceAccount = require(process.env.FIREBASE_CREDENTIALS);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_BUCKET
});

const bucket = admin.storage().bucket()

const databaseURL = "mongodb+srv://ibrahim:KhMDhZJu5xbBhVIV@cluster0.41pcn2k.mongodb.net/interview-app?retryWrites=true&w=majority"

mongoose.connect(databaseURL);

const db = mongoose.connection;
db.on("error", (error) => console.error(error));
db.once("open", () => console.log("Connected to database"));

const questionVideoFileSchema = new mongoose.Schema({
  name: String,
  number: Number
}, { strict: false });

const QuestionVideoFile = mongoose.model("QuestionVideoFile", questionVideoFileSchema);

async function downloadFileFromGoogleCloud(roomId, date, destinationFileName) {
    const prefix = `interview_app/thirdparty_recording_test/beam/${roomId}/${date}/`;
  
    const options = {
      prefix: prefix,
    };
  
    const [files] = await storage.bucket(process.env.GOOGLE_APPLICATION_BUCKET).getFiles(options);
  
    files.forEach(file => {
      if (file.name.startsWith(prefix + 'Rec')) {
        const options = {
          destination: destinationFileName,
        };
  
        file.download(options).then(() => {
          console.log(`Blob ${file.name} downloaded to ${destinationFileName}.`);
        });
      }
    });
  }

  async function uploadFileToFirebase(sourceFileName, FirebaseDestinationFileName) {
    await bucket.upload(sourceFileName, {
      destination: FirebaseDestinationFileName,
      gzip: true,
      metadata: {
        cacheControl: 'public, max-age=31536000',
      },
    });
  
    console.log(`${sourceFileName} uploaded to ${destinationFileName}.`);
  }
  
  

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

const logSchema = new mongoose.Schema({}, { strict: false });

const Log = mongoose.model("Log", logSchema);

app.post('/generateStreamingLogs', async (req, res) => {
    const dateObj = new Date();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0')
    const day = String(dateObj.getDate()).padStart(2, '0');
    const year = dateObj.getFullYear();
    const date = year + month + day;

    const logDocument = new Log(req.body);
    if(req.body.type === 'beam.stopped.success'){
      roomId = req.body.data.room_id;
      const questionCount = await QuestionVideoFile.countDocuments({});
      const nextNumber = questionCount + 1;
      const fileName = `Q_${nextNumber}`;
      const questionVideoFileDocument = new QuestionVideoFile({ name: fileName, number: nextNumber });
      await questionVideoFileDocument.save();
      const destinationFileName = path.join(__dirname, 'interview_version', 'videos', fileName);
      const logFileName = path.join(__dirname, 'interview_version', 'logs', `${fileName}.log`);
      await downloadFileFromGoogleCloud(roomId, date, destinationFileName).catch(console.error);
      fs.appendFileSync(logFileName, JSON.stringify(req.body) + "\n################################################\n");
      const firebaseLogFileName = path.join('interview_version', 'logs', `${fileName}.log`);
      const firebaseVideoFileName = path.join('interview_version', 'videos', fileName);
      await uploadFileToFirebase(logFileName, firebaseLogFileName).catch(console.error);
      await uploadFileToFirebase(destinationFileName, firebaseVideoFileName).catch(console.error);
      fs.unlinkSync(logFileName);
      fs.unlinkSync(destinationFileName);
    }
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
