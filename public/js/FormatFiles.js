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

var didSelectFile = false;
$(document).ready(function() {
  if(isAPIAvailable()) {
    $('#files').bind('change', handleFileSelect);
    $('#plurals').bind('change', handleFileSelect);
    $("#noPls").bind('change', enableButton);
  }
});

function isAPIAvailable() {
  // Check for the various File API support.
  if (window.File && window.FileReader && window.FileList && window.Blob) {
    // Great success! All the File APIs are supported.
    return true;
  } else {
    // source: File API availability - http://caniuse.com/#feat=fileapi
    // source: <output> availability - http://html5doctor.com/the-output-element/
    document.writeln('The HTML5 APIs used in this form are only available in the following browsers:<br />');
    // 6.0 File API & 13.0 <output>
    document.writeln(' - Google Chrome: 13.0 or later<br />');
    // 3.6 File API & 6.0 <output>
    document.writeln(' - Mozilla Firefox: 6.0 or later<br />');
    // 10.0 File API & 10.0 <output>
    document.writeln(' - Internet Explorer: Not supported (partial support expected in 10.0)<br />');
    // ? File API & 5.1 <output>
    document.writeln(' - Safari: Not supported<br />');
    // ? File API & 9.2 <output>
    document.writeln(' - Opera: Not supported');
    return false;
  }
}

function deleteTable(evt){
  $("#list").empty();
  $("#listPlurals").empty();
  $("#contents tr").remove();
  $("#contentsPlurals tr").remove();
}

function enableButton(){
   if (didSelectFile){
    $('#submit').prop('disabled', false);
     didSelectFile = false;
   }
}

function handleFileSelect(evt) {
  var files = evt.target.files; // FileList object
  var idValue = evt.target.id;
  var file = files[0];

  // read the file metadata
  var output = ''
      output += '<span style="font-weight:bold;">' + escape(file.name) + '</span><br />\n';
      output += ' - FileType: ' + (file.type || 'n/a') + '<br />\n';
      output += ' - FileSize: ' + file.size + ' bytes<br />\n';
      output += ' - LastModified: ' + (file.lastModifiedDate ? file.lastModifiedDate.toLocaleDateString() : 'n/a') + '<br />\n';

  console.log(idValue);
  // read the file contents
  printTable(file,idValue);

  // post the results
  if(idValue == 'plurals'){
    $('#listPlurals').append(output);
  }else {
    $('#list').append(output);
    didSelectFile = true;
  }
}

function printTable(file,idValue) {
  var reader = new FileReader();
  reader.readAsText(file);
  reader.onload = function(event){
    var csv = event.target.result;
    var data = $.csv.toArrays(csv);
    var html = '';
    for(var row in data) {
      console.log('data[row]: ' + data[row][0] + ' - ' + data[row][1] + '');
      html += '<tr>\r\n';
      for(var item in data[row]) {
        html += '<td>' + data[row][item] + '</td>\r\n';
        //console.log('data[row][item]: ' + data[row][item]);
      }
      html += '</tr>\r\n';
    }
    if (idValue == 'plurals'){
      $('#contentsPlurals').html(html);
    }else{
      $('#contents').html(html);
    }
  };
  reader.onerror = function(){ alert('Unable to read ' + file.fileName); };
}
