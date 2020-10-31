const express = require('express');
const fs = require('fs');
const request = require('request');
const app = express();

// We have to register the app on Gmail API to get credentials defining the app.
// /apilogin is the endpoint which lets the user authenticate the app to send mails on his behalf.
// Once the user authenticates the app, we store the credentials in token.json
// Using these credentials, we send the mail using /send endpoint.
// I have hardcoded the receiver's mail, subject and mail text for now but this data can also be obtained at
// runtime using front end forms while making the request.
// While adding the authorised redirect URI, add the base URL of your domain because I redirect the code there. (Ref Line 94)

let fileData, tokenData;
function read(callback){
    fs.readFile('./client_id.json', (err, data)=>{
        if(err) throw err;
        let da = JSON.parse(data);
        callback(null, da);
    });
}

function readt(callback){
    fs.readFile('./token.json', (err, data)=>{
        if(err) throw err;
        let da = JSON.parse(data);
        callback(null, da);
    });
}

read(function(err, content){
    fileData = content;
});
readt(function(err, content){
    tokenData = content;
});

var receiver = "receiversmail@gmail.com"; // Change receiver's mail here

var mail = ["Content-Type: text/plain; charset=\"UTF-8\"\n",
        "MIME-Version: 1.0\n",
        "Content-Transfer-Encoding: 7bit\n",
        "to: " + receiver , "\n",
        "from: me" , "\n",
        "subject: Test" , "\n\n",  // Change mail subject here
        "message"   // Change mail message here
    ].join('');

const encodedMessage = Buffer.from(mail)
.toString('base64')
.replace(/\+/g, '-')
.replace(/\//g, '_')
.replace(/=+$/, '');

function sendMail(){
    request.post({
        url:     'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
        headers: {
            'Authorization': 'Bearer ' + tokenData['access_token'],
          },
        data: JSON.stringify({
            'raw': encodedMessage
          })
    }, function(error, response, body){
        console.log(body);
    });
}

function getToken(str){
    request.post({
        headers: {'content-type' : 'application/x-www-form-urlencoded; charset=utf-8'},
        url:     'https://oauth2.googleapis.com/token',
        body:  "client_id=" + fileData['web']['client_id'] + "&client_secret=" + fileData['web']['client_secret'] + "&grant_type=authorization_code&" + str + '&redirect_uri='+fileData["web"]["redirect_uris"][0]
    }, function(error, response, body){
        console.log(body);
        let jsonb = JSON.stringify(body);
        fs.writeFileSync('./token.json', body);
    });
}


app.get('/error', (req, res)=>{
    res.send('Access denied');
});
app.get('/success', (req, res)=>{
    res.send('Successful');
});

app.get('/send', (req, res)=>{
    sendMail();
    res.send('Sent!');
});

app.get('/', (req, res)=>{
    var rec = (req.originalUrl);
    console.log(rec);
    if(rec[2]=='e'){
        res.redirect('error');
    }
    else{
        var str = '';
        var obj = {};
        for(var i=2 ; i<rec.length ; ++i){
            if(rec[i] == '&')
            break;
            str += rec[i];
        }
        getToken(str);
        res.redirect('success');
    }
});

app.get('/apilogin', (req, res) => {
    console.log(fileData);
    var options = 'https://accounts.google.com/o/oauth2/v2/auth?';
    options+='scope=https%3A//www.googleapis.com/auth/gmail.send&';
    options+='access_type=offline&';
    options+='include_granted_scopes=true&';
    options+='response_type=code&';
    options+='redirect_uri='+fileData["web"]["redirect_uris"][0]+"&";
    options+='client_id='+fileData["web"]["client_id"];
    console.log(options);
    res.redirect(options);
});

app.listen(3000);
console.log('Running...');
