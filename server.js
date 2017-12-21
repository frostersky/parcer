var rambler_news_parser = require('./main_rambler_news_parser');
var express = require('express');
var app = express();


app.listen(1337, function(){
    console.log('Express server listening on port 1337');
    rambler_news_parser.load_preview_news();
});


app.get('/news/getRamblerNews/:region', function (req, res) {
    console.log('GET startded for '+req.params.region);
    var news = rambler_news_parser.getNews(req.params.region);
    res.send(news);
});


