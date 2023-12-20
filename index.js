require('dotenv').config()
var express = require('express');
var jwt = require('jsonwebtoken');
var uuid4 = require('uuid4');
var cors = require('cors');
var app = express();
app.use(express.json());

app.use(cors());

app.post('/generateManagementToken', function(req, res) {
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

app.post('/generate', function(req, res) {
    var app_access_key = process.env.APP_ACCESS_KEY;
    var app_secret = process.env.APP_SECRET;

    var payload = {
        access_key: app_access_key,
        room_id: req.body.room_id,
        user_id: req.body.user_id,
        role: req.body.role,
        type: 'app',
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
            if(err) {
                res.status(500).json({ error: 'Error generating token' });
            } else {
                res.json({ token: token });
            }
        }
    );
});

const port = process.env.PORT || 4242;
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
