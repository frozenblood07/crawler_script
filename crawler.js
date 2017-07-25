var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var json2csv = require('json2csv');

var urlToCrawl = 'https://medium.com'; //base url from starting
var arrUrl = []; // list of urls to process
var runningWorkers = 0; // number of running workers.
var startTime = new Date().getTime(); //starting time 
var finalHref = []; //final array containing all the urls

var counter = 0;

function processRequest(maxConnections,callbackFunction) {
	//if the array has no more urls call the callback function
  if(arrUrl.length == 0) {
    arrUrl = [];
    callbackFunction();
    return;
  }

  var url = arrUrl.shift(); // take first url in list
  runningWorkers++; //increment the number of workers runnning
  console.log('Now running with '+ url, new Date().getTime() - startTime+" ms","No of running workers "+ runningWorkers);
  
  request(url, function(err,resp,body) { 
    $ = cheerio.load(body);//process the body with cheerio
    links = $('a'); //jquery get all hyperlinks
    //loop through all the links and push them in the array for crawling + saving
    $(links).each(function(i, link){
      newUrl = $(link).attr('href');
      finalHref.push( {url: newUrl} ); //push urls into final array
      //remove all the relative urls and urls that are not medium
      if(newUrl.indexOf('http') !== -1 && newUrl.indexOf('medium') !== -1){
        arrUrl.push(newUrl);
      }
    });
    //till we have urls and workers to spare start more workers
    while (arrUrl.length && runningWorkers < maxConnections) {
      processRequest(maxConnections,callbackFunction); //start more workers
    }
    //finished doing this one url
    runningWorkers--; //decrease the number of running workers
    counter++;
  });
  return;
}

function crawl(maxConnections) {
  /*TO DO
  Bench Marking
  Unit Test Cases
  Better Implementation??
  Database Connection to Make Generic -- Redis/Mongo?
  */
  console.log('Crawling started');
  processRequest(maxConnections,function(){
    generateCSV();
    console.log('Crawling complete check url.csv for all the urls');
  });
}

function generateCSV() {
  var fields = ['url'];
  try {
    var csv = json2csv({ data: finalHref, fields: fields });
  } catch (err) {
    console.error(err);
  }

  fs.writeFile('url.csv', csv, function(err) {
  if (err) throw err;
    console.log('file saved');
  });	
}

arrUrl.push(urlToCrawl);
crawl(5);