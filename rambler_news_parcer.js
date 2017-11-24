
var needle = require('needle');
var cheerio = require('cheerio');
var fs = require('fs-extra');
var feedparser = require('feedparser-promised');
var tress = require('tress');

var rambler_rss_url = 'https://news.rambler.ru/rss/?updated';
var rambler_news_url = 'https://news.rambler.ru';
var rss_news_links_path = './rambler_rss_news_links.json';
var news_links_path = './rambler_news_links.json';

var news_type = 'news';
var rss_news_type = 'rss_news';

function update_data(type){
    return new Promise(function(resolve, reject){
        console.log('Start updating rss links...')
        needle('get', rambler_rss_url)
            .then(resp => {
                console.log('Start parsing...')
                var rss_news_list = [];
                var news_list = [];
                var $ = cheerio.load(resp.body);    
                var rss_news_refs = $('.rss__item');
                rss_news_refs.each(function(i, element){
                    if(i>=19){
                        var city_name = $($(element).children()[0]).text();
                        var rss_ref = $($(element).children()[1]).text().replace(/\r|\n/g, '');
            
                        if(city_name != undefined && rss_ref != undefined){

                            if(type == rss_news_type || type == null || type == undefined){
                                rss_news_list.push({
                                    "city_name" : city_name,
                                    "rss_ref": rss_ref
                                });   
                            }

                            if(type == news_type || type == null || type == undefined){
                                rss_ref = rss_ref.replace('rss\/', '')+'?updated';
                                news_list.push({
                                    "city_name" : city_name,
                                    "rss_ref": rss_ref
                                });   
                            }          
                        }
                    }
            
                });
                switch(type){
                    case rss_news_type: {
                        var rss_data_news = JSON.stringify(rss_news_list, null, 2);
                        fs.writeJson(rss_news_links_path, rss_data_news);
                        resolve(rss_data_news);
                        break;
                    }
                    case news_type: {
                        var data_news = JSON.stringify(news_list, null, 2);
                        fs.writeJson(news_links_path, data_news);
                        resolve(data_news);
                        break;
                    }
                    default : {
                        var rss_data_news = JSON.stringify(rss_news_list, null, 2);
                        fs.writeJson(rss_news_links_path, rss_data_news);
                        var data_news = JSON.stringify(news_list, null, 2);
                        fs.writeJson(news_links_path, data_news);
                    }
                }                
            })    
        
    });
}


function load_rambler_rss_news(data_news){
    data_news = JSON.parse(data_news);
    var q = tress(function(data, callback){
        var options = {
            'uri': data.rss_ref,
        };
        console.log(data.city_name+'_'+data.rss_ref);
        feedparser.parse(options)
        .then( (items) => { 
            var rss_list = [];
            for(i in items){
                rss_list.push({
                    'guid' : items[i].guid,
                    'title' : items[i].title,
                    'description' : items[i].description,
                    'link' : items[i].link,
                    'author' : items[i].author,
                    'date' : items[i].date
                }) 
            }
            var data_news = JSON.stringify(rss_list, null, 6);
            fs.writeJson('./rambler_rss_news/'+data.city_name+'.json', data_news);
        });
    }, data_news.length);
    for(i in data_news){
        q.push(data_news[i])
    }
}

function load_rambler_preview_news(data_news){
    data_news = JSON.parse(data_news);
    var q = tress(function(data, callback){
        console.log(data.city_name+'_'+data.rss_ref);
        needle('get', data.rss_ref)
        .then(resp => {
                       
            var $ = cheerio.load(resp.body);
        
            var news = $('.top-topic__news-item');
            var news_list = [];
            news.each(function(i, element){
                var content = $(element).children();
                var href = rambler_news_url+$(content).attr('href');
                var imageRef = $($($($(content).children()[0]).children()[0]).children()[0]).attr('data-src');
                var topic = $($($($(content).children()[1]).children()[0]).children()[0]).text();
        
                if(href != undefined && topic != undefined && imageRef != undefined){
                    news_list.push({
                        'topic' : topic,
                        'imageRef' : imageRef,
                        'href' : href
                    });
                    console.log('----------------------');
                    console.log('topic: '+topic);
                    console.log('imageRef: '+imageRef);
                    console.log('href: '+href);
                }
        
            });
            var data_news = JSON.stringify(news_list, null, 3);
            fs.writeJson('./rambler_preview_news/'+data.city_name+'.json', data_news);         
        })
    }, data_news.length);
    for(i in data_news){
        q.push(data_news[i])
    }
}



exports.load_rambler_news = function(type){
    if(type == rss_news_type || type == null || type == undefined) {
        fs.ensureFile(rss_news_links_path)
        .then(
            () => load_rambler_rss_news(require(rss_news_links_path))        
        )
        .catch(
            err => {
                update_data(type)
                    .then(rss_data_news => load_rambler_rss_news(rss_data_news));
            }
        );
    }
    if(type == news_type|| type == null || type == undefined) {
        fs.ensureFile(news_links_path)
        .then(
            () => load_rambler_preview_news(require(news_links_path))        
        )
        .catch(
            err => {
                update_data(news_type)
                    .then(data_news => load_rambler_preview_news(data_news));
            }
        );
    }
} 

exports.get_rambler_rss_news = function(city, callback){
   return fs.readJson('./rambler_news/'+city+'.json')
    .then(packageObj => {
        callback(packageObj);
    })
    .catch(err => {
        console.error(err)
    })
}

exports.news_type = news_type;
exports.rss_news_type = rss_news_type;
