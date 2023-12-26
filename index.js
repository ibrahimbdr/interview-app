require('dotenv').config()
var express = require('express');
const admin = require('firebase-admin');
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

app.post('/generateStreamingLogs', (req, res) => {
    const data = req.body;

    const logData = JSON.stringify(data);

    const blob = bucket.file('logs.txt');
    const blobStream = blob.createWriteStream();

    blobStream.on('error', (err) => {
        console.error(err);
    });

    blobStream.on('finish', () => {
        res.status(200).send('Received and log file uploaded to Firebase');
    });

    blobStream.end(logData);
});

const port = process.env.PORT || 4242;
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
