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

'use strict';

var fs = require("fs");
var path = require("path");

function headerForAndroidXML(){
  var docu = '<?xml version="1.0" encoding="utf-8"?>' + '\r\n';
  docu += '<resources>' +'\r\n';
  return docu;
}

function androidFileName(lang, fileName){
  var file = './download/Android/'+lang.toUpperCase()+'/'+ fileName + '.xml';
  if (lang != ''){
    file = './download/Android/'+lang.toUpperCase()+'/'+ fileName + '.xml';
  }
  return file;
}

function toAndroid(data, lang, dataPls,fileName){
  fileName = fileName.replace('.csv','');
  var docu = headerForAndroidXML();
  var endDoc = '</resources>';
  var fileName = androidFileName(lang, fileName);

  if (Object.keys(dataPls) != ''){
    docu += dataPls;
    console.log('docu is: ' + docu);
  }
  if (data){
    for(var key in data) {
      var kValue = (lang == '' ) ? data[key] : key ;
      //add here evaluation for wildcards
      var dataValue = parseWildcardsForAndroid(data[key]);
      docu += '<string name="' + kValue + '">' + dataValue +'</string>' +'\r\n';
    }
    docu += endDoc;
    console.log(docu);
    // Save in Disk
    var moduleClass = require('./formatFiles');
    moduleClass.saveInDisk(fileName, docu);
  }
}

function parseWildcardsForAndroid(data){
//first tipology with incremental variables
//**1s** **2d** **3f**
//result: %1$s %2$d %3$f
//second tipology with monadic variables
//**s** **d** **f**
//result: %@ %d %f
   data = data.replace("**s**","%s");
   data = data.replace("**d**","%d");
   data = data.replace("**ld**","%ld");
   data = data.replace("**f**","%f");
   data = parseWithRegex(data);

   return data;
}

function parseWithRegex(data){
  data = regexEscapingSymbol(data);
  data = regexCardinalVariables(data);
  return data;
}

function regexCardinalVariables(data){
  var regex = /\**\d+\w/g;
  var numberWithAsterix = data.match(regex);
  //return **1s
  if (numberWithAsterix){
    //add symbolic escaping %% that is needed in android but not in iOS
    var deleteAsterix = /\d+/g;
    var number = String(numberWithAsterix).match(deleteAsterix);
    //return 1 from **1s
    var regexLetter = /\**\d\w/g;
    var letterWithAsterix = data.match(regexLetter);
    //return **1s for example
    var deleteAsterixLetter = /([a-z])/g;
    var letter = String(letterWithAsterix).match(deleteAsterixLetter);
    //return s from **1s
    data = data.replace("**"+number+letter+"**","%"+number+"$"+letter);
    console.log("data replaced 1 " + data);
  }
  return data;
}

function regexEscapingSymbol(data){
  var regexSymbolic = /\*\%/g;
  var dataWithSymbolic = data.match(regexSymbolic);
  if (dataWithSymbolic){
    data = data.replace("%","%%");
  }
  return data;
}

function bodyHTMLAndroid(val,identifier){
  return '<item quantity="'+val+'">'+parseWildcardsForAndroid(identifier)+'</item>'+ '\r\n';
}

function bodyNameForPlurals(identifier){
  return '<plurals name="'+identifier+'">'+ '\r\n'
}

function footerHTMLAndroid(){
  return '</plurals>'+ '\r\n';
}

exports = module.exports = {
 toAndroid: toAndroid,
 bodyNameForPlurals: bodyNameForPlurals,
 bodyHTMLAndroid: bodyHTMLAndroid,
 footerHTMLAndroid: footerHTMLAndroid
};
