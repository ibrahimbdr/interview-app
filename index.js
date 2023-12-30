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

const databaseURL = "mongodb+srv://ibrahim:KhMDhZJu5xbBhVIV@cluster0.41pcn2k.mongodb.net/interview-app?retryWrites=true&w=majority"

mongoose.connect(databaseURL);

const db = mongoose.connection;
db.on("error", (error) => console.error(error));
db.once("open", () => console.log("Connected to database"));


const serviceAccount = require(`./${process.env.FIREBASE_CREDENTIALS}`);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_BUCKET
});

const bucket = admin.storage().bucket();
const gcs = new Storage();

async function downloadAndUploadFile(gcsBucketName, fileName, distinationFileName) {

  const options = {
    // The path to which the file should be downloaded
    destination: distinationFileName,
  };

  // Download the file
  await gcs
    .bucket(gcsBucketName)
    .file(fileName)
    .download(options);

  console.log(
    `gs://${gcsBucketName}/${fileName} downloaded to ./${distinationFileName}.`
  );

  // Upload the file to Firebase Storage
  await bucket.upload(`./${distinationFileName}`, {
    destination: `${distinationFileName}`,
    public: true,
  });

  console.log('File uploaded to Firebase Storage as interview_video_test.mp4.');
}

async function deleteGCSFile(gcsBucketName, distinationFileName) {
  try {
      await gcs.bucket(gcsBucketName).file(distinationFileName).delete();
      console.log(`File ${distinationFileName} deleted from ${gcsBucketName}.`);
  } catch (error) {
      console.error(`Failed to delete file ${distinationFileName} from ${gcsBucketName}.`, error);
  }
}

function deleteFile(distinationFileName) {
  fs.unlink(`./${distinationFileName}`, (err) => {
      if (err) {
          console.error(`Error: ${err}`);
      } else {
          console.log(`File ./${distinationFileName} has been deleted.`);
      }
  });
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

  const logDocument = new Log(req.body);
  // const logDocument = new Log({'interviw': 'test', 'fileName': ''});
  // if (req.body?.type === 'beam.recording.success' || true){
    if (req.body?.type === 'beam.recording.success'){
    console.log('getting recording ...')
    console.log('beam.recording.success event received');
    recordingPath = req.body.data.recording_path;
    // recordingPath = 'gs://interview_app/thirdparty_recording_test/beam/6590328e2592e5f94b75e596/20231230/Rec-6590328e2592e5f94b75e596-1703948958422.mp4'
    console.log(recordingPath);
    // Check if the database has previous records
    const lastLog = await Log.findOne().sort({created_at: -1});
    let next_number = 1;
    if (lastLog) {
      next_number = isNaN(lastLog.number) ? 0 : lastLog.number + 1;
    }

    // Make the new file name as Q_${next_number}
    const distinationFileName = `Q_${next_number}.mp4`;
    logDocument.fileName = distinationFileName;

    const pathParts = recordingPath.replace('gs://', '').split('/');
    const gcsBucketName = pathParts.shift();
    const fileName = pathParts.join('/');

    downloadAndUploadFile(gcsBucketName, fileName, distinationFileName)
    .then(() => {
      deleteGCSFile(gcsBucketName, fileName)
    }).then(() => {
      deleteFile(distinationFileName)
    })
      .catch(console.error);
  }
  try {
    await logDocument.save();
    console.log('Log document saved');

    // Save the logs on local text file
    fs.appendFile('logs.txt', JSON.stringify(req.body) + '\n', function (err) {
      if (err) throw err;
      console.log('Saved log to local text file');
    });

    // Separate the logs with the specified text
    fs.appendFile('logs.txt', '#############################################\n', function (err) {
      if (err) throw err;
      console.log('Added separator to local text file');
    });

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
