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
// const storage = new Storage({
//     keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
//   });

const serviceAccount = require(`./${process.env.FIREBASE_CREDENTIALS}`);

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   storageBucket: process.env.FIREBASE_BUCKET
// });

// const bucket = admin.storage().bucket()

const databaseURL = "mongodb+srv://ibrahim:KhMDhZJu5xbBhVIV@cluster0.41pcn2k.mongodb.net/interview-app?retryWrites=true&w=majority"

mongoose.connect(databaseURL);

const db = mongoose.connection;
db.on("error", (error) => console.error(error));
db.once("open", () => console.log("Connected to database"));

// const questionVideoFileSchema = new mongoose.Schema({
//   name: String,
//   number: Number
// }, { strict: false });

// const QuestionVideoFile = mongoose.model("QuestionVideoFile", questionVideoFileSchema);

// async function downloadFileFromGoogleCloud(roomId, date, destinationFileName) {
//   const prefix = `interview_app/thirdparty_recording_test/beam/${roomId}/${date}/`;

//   const options = {
//     prefix: prefix,
//   };

//   const [files] = await storage.bucket(`./${process.env.GOOGLE_APPLICATION_BUCKET}`).getFiles(options);
  
//   let found = false;
//   for (let i = 0; i < files.length; i++) {
//     const file = files[i];
//     if (file.name.startsWith(prefix + 'Rec')) {
//       console.log(`Found file: ${file.name}`);
//       const options = {
//         destination: destinationFileName,
//       };
      
//       await file.download(options);
//       console.log(`Blob ${file.name} downloaded to ${destinationFileName}.`);
//       found = true;
//       break;
//     }
//   }

//   if (!found) {
//     console.log('No file starting with "Rec" was found.');
//   }
// }

//   async function uploadFileToFirebase(sourceFileName, FirebaseDestinationFileName) {
//     await bucket.upload(sourceFileName, {
//       destination: FirebaseDestinationFileName,
//       gzip: true,
//       metadata: {
//         cacheControl: 'public, max-age=31536000',
//       },
//     });
  
//     console.log(`${sourceFileName} uploaded to ${destinationFileName}.`);
//   }
  
//   async function downloadFileFromFirebase(sourceFileName, destinationFileName) {
//     const options = {
//       destination: destinationFileName,
//     };
  
//     await bucket.file(sourceFileName).download(options);
  
//     console.log(
//       `Blob ${sourceFileName} downloaded to ${destinationFileName}.`
//     );
//   }
  

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_BUCKET
});

const gcs = new Storage();
const bucket = admin.storage().bucket();

async function downloadAndUploadFile(recordingPath) {
  // Parse the recordingPath to get the bucket name and file name
  const pathParts = recordingPath.replace('gs://', '').split('/');
  const bucketName = pathParts.shift();
  const fileName = pathParts.join('/');

  // Download the file from Google Cloud Storage to a temp file
  const tempFilePath = `/opt/render/project/src/${fileName}`;
  await gcs.bucket(bucketName).file(fileName).download({destination: tempFilePath});

  // Upload the downloaded file to Firebase
  await bucket.upload(tempFilePath, {
    destination: fileName,
    metadata: {
      cacheControl: 'public, max-age=31536000',
    },
  });

  console.log(`File downloaded from ${recordingPath} and uploaded to Firebase.`);
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
  console.log('generateStreamingLogs endpoint hit');
  const dateObj = new Date();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const year = dateObj.getFullYear();
  const date = year + month + day;
  console.log(`Date: ${date}`);

  const logDocument = new Log(req.body);
  if (req.body.type === 'beam.recording.success'){
    console.log('getting recording ...')
    console.log('beam.recording.success event received');
    roomId = req.body.data.room_id;
    console.log(roomId);
    console.log(JSON.stringify(req.body));
    recordingPath = req.body.data.recording_path;
    // console.log(`Room ID: ${roomId}`);
    // const questionCount = await QuestionVideoFile.countDocuments({});
    // console.log(`Question count: ${questionCount}`);
    // const nextNumber = questionCount + 1;
    // console.log(`Next number: ${nextNumber}`);
    // const fileName = `Q_${nextNumber}`;
    // const questionVideoFileDocument = new QuestionVideoFile({ name: fileName, number: nextNumber });
    // await questionVideoFileDocument.save();
    // console.log(`Saved question video file document: ${JSON.stringify(questionVideoFileDocument)}`);
    // const destinationFileName = path.join(__dirname, 'interview_version_test', 'videos', fileName);
    // console.log(`File should be saved as ${destinationFileName}`);
    // // const logFileName = path.join(__dirname, 'interview_version', 'logs', 'logs.log');
    // // const firebaseLogFileName = path.join('interview_version', 'logs', 'logs.log');
    // // const exists = await bucket.file(firebaseLogFileName).exists();
    // // if (exists[0]) {
    // //   console.log('Firebase log file exists');
    // //   await downloadFileFromFirebase(firebaseLogFileName, logFileName).catch(console.error);
    // // }
    // // fs.appendFileSync(logFileName, JSON.stringify(req.body) + "\n#################################\n");
    // // console.log('Appended to log file');
    // await downloadFileFromGoogleCloud(roomId, date, destinationFileName).catch(console.error);
    // const firebaseVideoFileName = path.join('interview_version', 'videos', fileName);
    // // await uploadFileToFirebase(logFileName, firebaseLogFileName).catch(console.error);
    // // console.log('Uploaded log file to Firebase');
    // await uploadFileToFirebase(destinationFileName, firebaseVideoFileName).catch(console.error);
    // console.log('Uploaded video file to Firebase');
    // // fs.unlinkSync(logFileName);
    // // console.log('Deleted local log file');
    // // fs.unlinkSync(destinationFileName);
    // console.log('Deleted local video file');
    downloadAndUploadFile(recordingPath)
  .catch(console.error);
  console.log('file uploaded successfully');
  }
  try {
    await logDocument.save();
    console.log('Log document saved');
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
