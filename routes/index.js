var express = require('express');
var passport = require('passport');
var request = require('request');
var fs = require('fs');
var router = express.Router();
var Busboy = require('busboy');

/* GET home page. */
router.get('/', function(req, res, next) {

  res.render('index', { title: "Express" });

});

router.get('/login', passport.authenticate('ibm-connections-cloud'));


router.get('/callback', passport.authenticate('ibm-connections-cloud', {successReturnToOrRedirect: '/account', failureRedirect: '/login'}));

router.get('/account', function(req, res, next) {
  if(req.user) {
      res.render('account');
  } else {
    res.redirect('/login');
  }


});

router.get('/upload', function(req, res, next) {

  res.render('upload');

});


router.post('/upload/submit', function(req, res, next) {

  var busboy = new Busboy({headers: req.headers});

  var options = {
    url: 'https://apps.collabservnext.com/files/oauth/api/nonce',
    headers: {'Authorization': 'Bearer ' + req.user.accessToken}
  }

  request.get(options, function(error, response, body){

    var nonce = body;

    console.log("Nonce: " + nonce + "Busboy: " + busboy);

    busboy.on('file', function(fieldname, file, filename, encoding, mimetype){

      var options = {
        url: 'https://apps.collabservnext.com/files/oauth/api/myuserlibrary/feed',
        headers: {'Authorization': 'Bearer ' + req.user.accessToken, 'Slug': filename , 'X-Update-Nonce': nonce}
      }

      file.pipe(request.post(options, function(error, response, body){
        console.log("Status Code: " + response.statusCode);
      }));

    });

    busboy.on('finish', function(){
      res.writeHead(200, { 'Connection' : 'close'});
      res.end();
    })

    req.pipe(busboy);

  });



});

router.get('/update/:fileID', function(req, res, next){

  res.render('update', {ID: req.params.fileID});

});

router.post('/delete/:fileID', function(req, res, next){

  var options = {

    url: 'https://apps.collabservnext.com/files/basic/api/myuserlibrary/document/' + req.params.fileID + '/entry',
    headers: {'Authorization': 'Bearer ' + req.user.accessToken}

  };

  console.log('Sending Request')
  request.delete(options, function(error, response, body){
    console.log(response.statusCode);

    res.send(response.statusCode);
  });


});


router.post('/update/:fileID', function(req, res, next){

  console.log('body : ' + req.body.commentNotification);

  var options = {

    url: 'https://apps.collabservnext.com/files/basic/api/myuserlibrary/document/' + req.params.fileID + '/media' + '?commentNotification=' + req.body.commentNotification,
    headers: {'Authorization': 'Bearer ' + req.user.accessToken}

  };

  console.log('Send request');

  request.put(options, function(error, response, body){

    console.log(response.statusCode);

    res.send(response.statusCode);

  });

});


router.get('/getFeed', function(req, res, next){
  var options = {

    url: 'https://apps.collabservnext.com/files/oauth/api/myuserlibrary/feed',
    headers: {'Authorization': 'Bearer ' + req.user.accessToken},

  }

  request.get(options, function(error, response, body){

    if(error){
      res.send(error);
    }
    else{

      res.send(body);

    }



  });
});


module.exports = router;
