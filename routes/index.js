var express = require('express');
var router = express.Router();

const lib = require('../helpers/lib');
const config = require('../config.json');
Object.keys(config.env).forEach(param => {
  process.env[param] = config.env[param];
});



const path = require('path');
const multer = require('multer');
const { Storage } = require('@google-cloud/storage');
const bucket = (new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  keyFilename: process.env.GOOGLE_CLOUD_KEYFILE,
})).bucket(config.gcp.bucket);
//const stt = require('../helpers/google-cloud-stt');
const tools = require('../helpers/gcp-tools');


var upload = multer({
  storage: multer.diskStorage(
    {
        destination: path.join(__dirname, 'upload'),
        filename: function ( req, file, cb ) {
          let ext =  path.extname(file.originalname);
          cb( null, file.originalname.replace(ext, '') + '-' + Date.now() + ext);
        }
    }
  )
});


router.get('/', (req, res) => { 
  res.send(
    '<form method="POST" action="/" enctype="multipart/form-data">' +
      '<input type="file" name="upFile" /><br />' +
      '<input type="submit" value="upload" />' +
    '</form>'
  );
});

function logAndAppend(msg, newmsg) {
  if (newmsg){
    console.log(newmsg);
    if (msg == '') {
      msg = newmsg;
    } else {
      msg += '<br />' + newmsg;
    }
  }
  return msg;
}



router.post('/', upload.single('upFile'), (req, res) => {
  let flacfilename = req.file.originalname + ".flac";
  let orglocalpath = req.file.path;
  let flaclocalpath = req.file.path + ".flac";
  var msg = '';

  console.log('');

  msg = logAndAppend(msg, 'Uploaded file： ' + req.file.originalname);
  console.log('Upload path：' + req.file.path);
  console.log('Saved filename： ' + req.file.filename);
  msg = logAndAppend(msg, 'Request has sent!');
  msg = logAndAppend(msg, 'Please click below to see the result!');
  msg = logAndAppend(msg, '<a href="/out">voice text files</a>');

  Promise.resolve()
    .then(() => {
      let convcmd = 'sox ' + orglocalpath + 
        ' --type flac --rate 16k --bits 16 --channels 1 ' + 
        flaclocalpath;
      console.log(msg, convcmd);
      return lib.execShellCommand(convcmd);
    })
    .then(() => {
      console.log('Uploading ' + flaclocalpath + ' to ' + config.gcp.bucket);
      return bucket.upload(flaclocalpath, {destination: flacfilename})
    })
    .then(() => {
      console.log('Detecting speech');
      return tools.asyncRecognizeGCS('gs://' + config.gcp.bucket + '/' + flacfilename,
        'FLAC',
        '',
        config.gcp.languageCode,
        'public/out/' + req.file.originalname + ".txt");
    })
    .then((value) => {
      console.log('OK!');
      //res.send(msg);
    })
    .catch(err => {
      console.log(err);
    });
    res.send(msg);
});

/*
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});
*/

module.exports = router;


