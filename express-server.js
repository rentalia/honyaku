/*
Copyright 2017 Rentalia

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

var express = require('express');
var server = express();

var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

var results = null;

var CALLBACK_MESSAGE = {
  ERROR: 'error',
  SUCCESS: 'success'
};

server.use(express.static(__dirname + '/public'));


server.get('/',function(request, response){
  response.sendFile(__dirname + '/index.html');
});


server.post('/upload', multipartMiddleware, function(req, res) {
  console.log(req.body, req.files);

  var fs = require('fs');
  var path = req.files.uploadedFiles.path;
  var pathPlurals = '';
  var fileName = req.files.uploadedFiles.name;
  results = res;

  //this is the radio button id from HTML file, to know if it does have plurals
  var plurals = req.body.pls;
  console.log('PLURALS :' + plurals);

  //it is plurals
  if (plurals == '1'){
    pathPlurals = req.files.uploadPlrs.path;
  }

  if (!req.files) {
    res.send('No files were uploaded.');
    return;
  }
  //read localized file first
  fs.readFile(path, function (err, data) {

    //search path of csv file
    var newPath = __dirname + '/uploads/'+ fileName;
    var newPathPls = '';

    fs.writeFile(newPath, data, function (err) {
      if (err){
        console.log("error writing file: " + err);
        showError(results,err);
      }else{
        if (plurals == '1'){
          readPlurals(fileName,fs,results,req,pathPlurals,newPath, function(resp){
            if(resp == CALLBACK_MESSAGE.SUCCESS){
              downloadFiles(results, server);
            }
          });
        }else{
          formatFilesFunction(fileName, fs, newPath, newPathPls, function(resp){
            if (resp == CALLBACK_MESSAGE.SUCCESS){
              downloadFiles(results, server);
            }else{
              showError(results,resp);
            }
          });
        }
      }
    });
  });
});

function readPlurals(fileName, fs, results, req, pathPlurals, pathLocalized, block){
  var filePluralName = req.files.uploadPlrs.name;
  fs.readFile(pathPlurals, function(err, data){
     newPathPls = __dirname + '/uploads/'+ filePluralName;
    fs.writeFile(newPathPls, data, function(err){
      if (err){
        console.log("error writing file for plurals: " + err);
        showError(results,err);
      }else{
        formatFilesFunction(fileName, fs,pathLocalized,newPathPls, function(resp){
          block(resp);
        });
      }
    })
  });
}

function formatFilesFunction(fileName,fs, path, pathPlurals, callback){
  formatFile(fileName, path, pathPlurals, function(result){
    if (result != CALLBACK_MESSAGE.SUCCESS){ //error
      callback(result);
    }else{
      fs.unlinkSync(path);
      if (pathPlurals != ''){
        fs.unlinkSync(pathPlurals);
      }
      callback(CALLBACK_MESSAGE.SUCCESS);
    }
  });
}

function formatFile(fileName, newPath, newPathPlurals, callback){
  var moduleFormat = require('./formatFiles');
  var resultVar = '';
  var fileName = fileName;
  console.log("file name in express-server is" + fileName);
  moduleFormat.formatCSV(fileName, newPath, newPathPlurals, function(result){
      callback(result);
  });
}

function downloadFiles(response, app){

  var dirAndroid = __dirname + '/download/Android';
  var diriOS = __dirname + '/download/Android';

  var files = getDirectories(diriOS, function(err, result){
     if (!err){
       console.log('DOWNLOADING FILE: ' + result);
      response.send(createHTMLFileSuccess(result));
     }else{
       console.log('ERROR DOWNLOADING: ' + err);
       showError(response,err);
     }
  });
}

function createHTMLFile(files){
  var html = '';
  for (var i = 0;i < files.length; i++){
    if(files[i].includes('Localized') || files[i].includes('strings') || files[i].includes('stringsdict')){
      if (files[i].includes('Localized')){
        html += '<li>Download iOS: <a href="/'+files[i]+'">'+files[i]+'</a>.</li>';
      }else if (files[i].includes('strings')){
        html += '<li>Download Android: <a href="/'+files[i]+'">'+files[i]+'</a>.</li>';
      }else if (files[i].includes('stringsdict')){
        html += '<li>Download iOS-Plurals: <a href="/'+files[i]+'">'+files[i]+'</a>.</li>';
      }
    }
  }
  var finalHtml = ('<ul>'
     + html
     + '</ul>');

  return finalHtml;
}

function createHTMLFileSuccess(files){
  var html = 'Scuccess! you can now download your files';
  var finalHtml = ('<ul>'
     + html
     + '</ul>');

  return finalHtml;
}


function getDirectories(searchPath, callback){
  var fs = require('fs'),
      path = require('path');
  var results = [];
  fs.readdir(searchPath, function(err, files) {
    if (err) {
      callback(err, null);
    }else{
      files.forEach(function(allFiles) {
          console.log('Files: ' + allFiles);
          results.push(allFiles);
      });
      callback(null, results);
    };
  });

}

function showError(response, callbackResponse){
  var html = '';
  console.log('response ' +  JSON.stringify(callbackResponse));
  if (callbackResponse.type == CALLBACK_MESSAGE.ERROR){
    html += '<li>'+callbackResponse.message+'Back to Index <a href="http://localhost:3000"></a>'+'</li>';
  }else{
    html += '<li>'+callbackResponse.code +' '+ callbackResponse+'<a href="http://localhost:3000">Back to Index  </a>'+'</li>';
  }

  response.send('<ul>'
   + html
   + '</ul>');
}

server.get('/:file(*)', function(req, res, next){
  var file = req.params.file,
      path = __dirname + '/download/' + file;
  console.log('Using file ' +file + 'to download');
  res.download(path);
});

server.listen(3000, function(){
  console.log('Honyaku is Ready!');
});
