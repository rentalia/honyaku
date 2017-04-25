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

var VARIABLE = {
    STRING:      {value: "s", code: "S"},
    DOUBLE:      {value: "d", code: "D"},
    FLOAT:       {value:  "f", code: "F"},
    LONG_DOUBLE: {value: "ld", code: "D"}
}

//parser to ios format
function toiOS(data,lang,_fileName){
  var docu = '';
  var fileName = iOSFileName(lang, {},_fileName);

  if(data){
    for(var key in data) {
      var kValue = (lang == '' ) ? data[key] : key ;
      var dataValue = parseWildcardsForiOS(data[key]);
      docu += '"' + kValue + '" = "' + dataValue + '";' +'\r\n';
    }
    console.log("Data for iOS" + docu);
    save(fileName, docu);
  }
}

function toiOSPlurals(data, lang,_fileName){
  var fileName = iOSFileName(lang, data,_fileName);
  console.log("iOS Plurals" + data);
  save(fileName, data);
}

//Where are going to be stored the files
function iOSFileName(lang, plurals,_fileName){
  var docu = '';

  var fileName = './download/iOS/'+lang.toUpperCase()+'/'+ _fileName + '.strings';

  if(Object.keys(plurals) == '' && lang != ''){
    fileName = './download/iOS/'+lang.toUpperCase()+'/'+ _fileName + '.strings';
  }else if (Object.keys(plurals) != '' && lang != ''){
    fileName = './download/iOS/'+lang.toUpperCase()+'/'+ _fileName + '.stringsdict';
  }
  return fileName;
}

function bodyWithIDHTMLiOS(identifier){
  var html = '<key>'+identifier+'</key>' + '\n'
           + '<dict>'
           + '<key>NSStringLocalizedFormatKey</key>'+ '\n'
           + '<string>%#@' + identifier +'@</string>' + '\n'
           + '<key>' + identifier + '</key>'+ '\n'
           + '<dict>' + '\n'
           + '<key>NSStringFormatSpecTypeKey</key>'+ '\n'
           + '<string>NSStringPluralRuleType</string>' + '\n'
           + '<key>NSStringFormatValueTypeKey</key>'+ '\n'
           + '<string>d</string>' + '\n';
  return html;
}

//header for plurals
function headerHTMLiOS(){
  var html = '<?xml version="1.0" encoding="UTF-8"?>' + '\n\r'
      + '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">'
      + '<plist version="1.0">'
      + '<dict>' + '\n';
  return html;
}

function footerHTMLiOS(){
  var html = '</dict>' + '\n' + '</dict>' + '\n';
  return html;
}

function footerCloseHTMLiOS(){
  return '</dict>'+ '\n' + '</plist>' + '\n';
}

function bodyHTMLiOS(key, value){
    value = parseWildcardsForiOS(value);
    var html = '<key>'+key+'</key>' + '\n\r'
              + '<string>'+value+'</string>'+ '\n\r';
    return html;
}

function parseWildcardsForiOS(data){
   //second tipology with only data type variables
   //**s** **d** **f**
   //result: %@ %d %f
   data = data.replace("**s**","%@");
   data = data.replace("**d**","%d");
   data = data.replace("**ld**","%ld");
   data = data.replace("**f**","%f");
   //first tipology with incremental variables and trailing with data type
   //**1s** **2d** **3f**
   data = parseWithRegex(data);
   return data;
}

function parseWithRegex(data){
  data = regexEscapingSymbol(data);
  data = regexEscapingSymbolPercentage(data);
  data = regexWithCardinalVariables(data);
  data = regexEscapingDoubleQuotation(data);
  return data;
}

function regexWithCardinalVariables(data){
  var regex = /\**\d+\w/g;
  var numberWithAsterix = data.match(regex);
  //return **1s
  if (numberWithAsterix){
    var deleteAsterix = /\d+/g;
    var number = String(numberWithAsterix).match(deleteAsterix);
    //return 1 from **1s
    var regexLetter = /\**\d\w/g;
    var letterWithAsterix = data.match(regexLetter);
    //return **1s for example
    var deleteAsterixLetter = /([a-z])/g;
    var letter = String(letterWithAsterix).match(deleteAsterixLetter);
    //return s/d/f/ld from **1s
    var newLetter = typeVariable(letter);
    data = data.replace("**"+number+letter+"**","%"+number+"$"+newLetter);
  }
  return data;
}

function regexEscapingSymbol(data){
  //delete symbolic scaping %% that is needed in android but not in iOS
  var regexSymbolic = /\%\%/g;
  var dataWithSymbolic = data.match(regexSymbolic);
  if (dataWithSymbolic){
    data = data.replace(dataWithSymbolic,"%");
  }
  return data;
}

function regexEscapingSymbolPercentage(data){
  var regexSymbolic = /\*\%/g;
  var dataWithSymbolic = data.match(regexSymbolic);
  if (dataWithSymbolic){
    data = data.replace("%","%%");
  }
  return data;
}

function regexEscapingDoubleQuotation(data){
  return data.replace(/\\([\s\S])|(")/g,"\\$1$2");
}

function typeVariable(letter){
  var newLetter = "";
  if (String(letter) == VARIABLE.STRING.value){
    newLetter = "@";
  }else if (String(letter) == VARIABLE.DOUBLE.value){
    newLetter = "d";
  }else if (String(letter) == VARIABLE.LONG_DOUBLE.value){
    newLetter = "ld";
  }else if (String(letter) == VARIABLE.FLOAT.value){
    newLetter = "f";
  }
  return newLetter;
}

function save(fileName, data){
  console.log("SAVING DATA FOR IOS");
  var moduleClass = require('./formatFiles');
  moduleClass.saveInDisk(fileName, data);
}

exports = module.exports = {
 toiOS: toiOS,
 toiOSPlurals: toiOSPlurals,
 bodyWithIDHTMLiOS: bodyWithIDHTMLiOS,
 headerHTMLiOS: headerHTMLiOS,
 footerHTMLiOS: footerHTMLiOS,
 footerCloseHTMLiOS: footerCloseHTMLiOS,
 bodyHTMLiOS: bodyHTMLiOS
};
