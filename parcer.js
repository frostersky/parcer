var tress = require('tress');
var needle = require('needle');
var cheerio = require('cheerio');
var resolve = require('url').resolve;
var fs = require('fs');
var rambler_news_url = 'https://news.rambler.ru';
var moscow = rambler_news_url+'/moscow_city/?updated';
var voronezh = rambler_news_url+'/Voronezh/?updated';
var results = [];
//var hrefs =[];

var q = tress(function(url, callback){
    needle.get(url, function(err, res){
        if (err) throw err;

        // парсим DOM
        var $ = cheerio.load(res.body);
        
        //поиск заголовка
        var bigTitleText = $('.big-title__title').text();
        var bigTitleSourceText = $('.big-title__source').text();
        var bigTitleSourceRef = $('.big-title__source').attr('href');

        //поиск текста
        var newsText = $('.article__content').text();

        if(bigTitleText != undefined && bigTitleSourceText != undefined && bigTitleSourceRef != undefined && newsText != undefined){
            console.log('----------------------');
            console.log(bigTitleText);
            console.log(bigTitleSourceText + ' - '+ bigTitleSourceRef);
            console.log(newsText);
        }
        callback();
    });
}, 10); // запускаем 10 параллельных потоков

needle.get(voronezh, function(err, res){
    if (err) throw err;

    // парсим DOM
    var $ = cheerio.load(res.body);

    var news = $('.top-topic__news-item');
    news.each(function(i, element){
        var content = $(element).children();
        var href = rambler_news_url+$(content).attr('href');
        var imageRef = $($($($(content).children()[0]).children()[0]).children()[0]).attr('data-src');
        var topic = $($($($(content).children()[1]).children()[0]).children()[0]).text();

        if(href != undefined && topic != undefined && imageRef != undefined){
            console.log('----------------------');
            console.log('topic: '+topic);
            console.log('imageRef: '+imageRef);
            console.log('href: '+href);
            q.push(href);
        }

    });
});