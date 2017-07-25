var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var json2csv = require('json2csv');
var async = require("async");

var urlToCrawl = 'https://medium.com'; //base url from starting
var arrUrl = []; // list of urls to process
var runningWorkers = 0; // number of running workers.
var startTime = new Date().getTime(); //starting time
var finalHref = []; //final array containing all the urls

function crawl(maxConnections) {
  var q = async.queue(function (url, next) {
    runningWorkers++;
    console.log('Now running with '+ url, new Date().getTime() - startTime+" ms","No of running workers "+ runningWorkers);

    request.get(url, function (err, res, body) {
      $ = cheerio.load(body); //process the body with cheerio
      links = $('a'); //jquery get all hyperlinks
      //loop through all the links and push them in the array for crawling + saving
      $(links).each(function(i, link) {
        newUrl = $(link).attr('href');
        finalHref.push( {url: newUrl} ); //push urls into final array
        //remove all the relative urls and urls that are not medium
        if(newUrl.indexOf('http') !== -1 && newUrl.indexOf('medium') !== -1) {
          //q.push(newUrl);
        }
      });
      runningWorkers--;
      next();
    });
  }, maxConnections);

  q.push(urlToCrawl); //push initial url to the queue
  q.drain = function () {
    generateCSV();
    console.log('Crawling complete check url.csv for all the urls');
  };
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

crawl(5);