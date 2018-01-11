
var needle = require('needle');
var cheerio = require('cheerio');
var fs = require('fs-extra');
var tress = require('tress');
var mongoClient = require('mongodb').MongoClient;
var mongoDbUrl = "mongodb://localhost:27017/rambler_news";


var rambler_news_url_for_regions = 'https://news.rambler.ru/top/region/';
var rambler_news_url = 'https://news.rambler.ru';

var counter = 0;

function update_data(){
    return new Promise(function(resolve, reject){
        console.log('Start updating database...')
        
        var results = [];


        var q = tress(function(url, callback){
            needle.get(url, function(err, resp){
                if(err) throw err;
                var $ = cheerio.load(resp.body); 
                var region_name = $('.top-topic__title').text();
                if(region_name != ''){
                    url = url.substring(0,url.length-1);
                    console.log(region_name+'_'+url);
                    results.push( {
                        'region': region_name,
                        'url':url
                    });                                   
                }
                callback();
            })
        }, 321);

        q.drain = function(){           
            mongoClient.connect(mongoDbUrl, function(err, db) {
                if(err) throw err;
                var rambler_db = db.db('rambler_news');
                rambler_db.collection('news_url').insertMany(results, function(err, result){
                    db.close();
                    resolve();
                });
            });
        }

        for( var i = 2; i <= 322; i++){
            q.push(rambler_news_url_for_regions+i+'/?page=1');
        }  
                   
    });    
}

function load_preview_news_to_db(){
    mongoClient.connect(mongoDbUrl, function(err, db) {
        if (err) throw err;
        var rambler_db = db.db('rambler_news');
        rambler_db.collection('news_url').find().toArray(function(err, news_url){            
            if(err) throw err;            
            if(news_url.length == 0){
                db.close();                
                update_data()
                .then(() => load_preview_news_to_db())
            }
            else {
                rambler_db.collection('news_preview').drop(function(err, res){
                    db.close();
                    for(i in news_url)
                        read_data(news_url[i]);
                });                
            }            
        })
    });
}

function read_data(data){
    
    var results =[]; 
    var q = tress(function(url, callback){
        needle.get(url, function(err, resp){
            if(err){
                console.log(url);
                return;
            }
            var $ = cheerio.load(resp.body); 
            var news = $('.top-topic__news-item');
            news.each(function(i, element){
                var content = $(element).children();
                var href = rambler_news_url+$(content).attr('href');
                var imageRef = $($($($(content).children()[0]).children()[0]).children()[0]).attr('data-src');
                var topic = $($($($(content).children()[1]).children()[0]).children()[0]).text();
        
                if(href != undefined && topic != undefined && imageRef != undefined){
                    results.push( {
                        'topic': topic.substr(1, topic.length-2),
                        'imageRef':imageRef,
                        'href': href,
                        'region':data.region
                    });  
                }
        
            });
            callback()
        })
    });
    
    q.drain = function(){
        mongoClient.connect(mongoDbUrl, function(err, db) {
            if(err) throw err;
            var rambler_db = db.db('rambler_news');
            rambler_db.collection('news_preview').insertMany(results, function(err, result){
                console.log(data.region+' news updated');
                db.close();
            });
        });
        
    } 
    
    for(var i=1; i<=5 ;i++){                       
        var url = data.url+i;
        q.push(url);
    }

}

function getTextNews(news_id){
    
}

function getNews(region){
    return new Promise(function(resolve, reject){

        mongoClient.connect(mongoDbUrl, function(err, db) {
            if(err) reject(err);
            var rambler_db = db.db('rambler_news');
            rambler_db.collection('news_preview').find({'region':region}).toArray(function(error, rambler_news){
                db.close();
                resolve(rambler_news);
            });                        
        });         
    });
}
    
    


exports.load_preview_news = load_preview_news_to_db;
exports.getNews = getNews;

