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

var MagicCSV = require("magic-csv");
var csvNonPlural = new MagicCSV({trim: true});
var csvPlurals =  new MagicCSV({trim: true});
var fs = require("fs");
var path = require("path");
var del = require('delete');
var _fileName = "";
var moduleClassAndroid = require('./android-format');
var moduleClassiOS = require('./ios-format');

var CALLBACK_MESSAGE = {
  ERROR: {message:'Error generating files!', type: 'error'},
  SUCCESS: 'success'
};

function formatCSV(fileName, path, pathPlurals, callback) {

  _fileName = fileName.replace('.csv','');

  csvNonPlural.readFile(path, function(err, stats) {

    if (err){
      console.log('There was an error: ' + err);
      callback(err);
    }else{
      if (pathPlurals != ''){
        csvPlurals.readFile(pathPlurals, function(err, stats) {
          if (err){
            console.log('There was an error: ' + err);
            callback(err);
          }else{
              pluralsFileCreator(csvNonPlural, csvPlurals, function(result){
                console.log('result plurals ' + result);
                  callback(result);
              });
          }
        });
      }else{
        nonPluralFileCreator(csvNonPlural,function(result){
          callback(result);
        });
      }
   }
  });
}



//Generates langs files
function pluralsFileCreator(nonPluralCSV, pluralsCSV, callback){
  var dictPls = pluralsDictionaryData(pluralsCSV);
  var dictNonPls = nonPluralsDictionaryData(nonPluralCSV);
  console.log('DICT PLURALS: '+ JSON.stringify(dictPls));
  var htmlAndroid = "";
  var htmliOS = "";

  for (var lang in dictNonPls){
    htmliOS += wrapperModuleiOSHeaderHTML;
    for (var identifier in dictPls){
        for(var value in dictPls[identifier]){
          if (value == lang){
            htmlAndroid += wrapperModuleAndroidBodyName(identifier);
            htmliOS += wrapperModuleiOSBodyName(identifier);
            for (var val in dictPls[identifier][value]){
              var valIdentifier = dictPls[identifier][value][val];
              if(valIdentifier != ''){
                htmliOS += wrapperModuleiOSBodyHTML(val,valIdentifier);
                htmlAndroid += wrapperModuleAndroidBodyHTML(val,valIdentifier);
              }
            }
            htmlAndroid += wrapperModuleAndroidFooterHMTL;
            htmliOS += wrapperModuleiOSFooterHTML;
           }
          }
        }
        var data = dictNonPls[lang];
        htmliOS += moduleClassiOS.footerCloseHTMLiOS();
        goToModules(data, lang, htmlAndroid,htmliOS,_fileName)
        htmlAndroid = "";
        htmliOS = "";
    }
    callback(CALLBACK_MESSAGE.SUCCESS);
}

function wrapperModuleiOSHeaderHTML(){
  return moduleClassiOS.headerHTMLiOS();
}

function wrapperModuleAndroidBodyName(identifier){
  return moduleClassAndroid.bodyNameForPlurals(identifier);
}

function wrapperModuleiOSBodyName(identifier){
  return moduleClassiOS.bodyWithIDHTMLiOS(identifier);
}

function wrapperModuleiOSBodyHTML(val, identifier){
  return moduleClassiOS.bodyHTMLiOS(val,valIdentifier);
}

function wrapperModuleAndroidBodyHTML(val, identifier){
  return moduleClassAndroid.bodyHTMLAndroid(val,valIdentifier);
}

function wrapperModuleiOSFooterHTML(){
  return moduleClassiOS.footerHTMLiOS();
}

function wrapperModuleAndroidFooterHMTL(){
  return moduleClassAndroid.footerHTMLAndroid();
}

function wrapperModuleiOSFooterCloseHTML(){
  return moduleClassiOS.footerCloseHTMLiOS();
}

function goToModules(data, lang, htmlAndroid,htmliOS, fileName){
  moduleClassAndroid.toAndroid(data, lang, htmlAndroid,fileName);
  moduleClassiOS.toiOS(data,lang,fileName);
  moduleClassiOS.toiOSPlurals(htmliOS,lang,fileName);
}

function nonPluralFileCreator(csv, callback){
  var dictLangs = nonPluralsDictionaryData(csv);
  //There are at least a key column and one or more language columns.
  if (dictLangs){
    for (var lang in dictLangs){
       moduleClassiOS.toiOS(dictLangs[lang],lang,_fileName);
       moduleClassAndroid.toAndroid(dictLangs[lang],lang,{},_fileName);
    }
    callback(CALLBACK_MESSAGE.SUCCESS);
  }else {
    callback(CALLBACK_MESSAGE.ERROR);
  }
}
//Get Dictionary for non plural file
function nonPluralsDictionaryData(csv){
  var columns = csv.getCols();
  var dictLangs = {};
  if (Object.keys(columns).length > 1){
    var objects = csv.getObjects();
    dictLangs = iterateThroughLangs(objects);
  }
   return dictLangs;
}
//Get dictionary for plurals file
function pluralsDictionaryData(csv){
  csv.drop_empty_rows  = true;
  var dictPlurals = iterateThroughPlurals(csv.getObjects());
  return dictPlurals;
}

function iterateThroughPlurals(rows){
  var langValues = {};
  var dict = {};
  var k = ''
  var pls = '';

  if(rows){
    for (var i = 0;i < Object.keys(rows).length; i++){
      var entry = rows[i];
       for (var key in entry){
         if (key == 'KEY' || key == 'key' || key == 'Key'){
            k = key
         }else if (key == 'PLS' || key == 'pls' || key == 'Pls'){
           if (entry[key] != ''){
              pls = entry[key];
           }
         }else{
             if (dict[pls] == undefined || dict[pls] == 'undefined'){
               langValues = {};
             }else{
               dict[pls] = dict[pls] || {};
             }
             langValues[key] = langValues[key] || {};
             langValues[key][entry[k]] = entry[key];
             dict[pls] = langValues;
       }
     }
   }
 }
 return dict;
}

function iterateThroughLangs(rows){
  var langValues = {};
  var k = ''
  if(rows){
    for (var i = 0;i < Object.keys(rows).length; i++){
      var entry = rows[i];
       for (var key in entry){
         if (key == 'KEY' || key == 'key' || key == 'Key'){
            k = key
         }
          if (key != 'key' && key != 'KEY' && key != 'Key') {
             langValues[key] = langValues[key] || {};
             langValues[key][entry[k]] = entry[key];
          }
       }
    }
  }
    return langValues;
}

function deleteFiles(){
  var filePath = './download/*.xml';
  del.sync(['foo/*.js']);
}

function saveInDisk(path,data){
  console.log("PATH TO SAVE DISK: " + path);
  fs.writeFile(path, data, function(error) {
       if (error) {
         console.error("write error:  " + error.message);
       } else {
         console.log("Successful Write to " + path);
       }
  });
}

exports = module.exports = {
 formatCSV: formatCSV,
 saveInDisk: saveInDisk,
};
