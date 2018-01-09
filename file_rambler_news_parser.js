
var needle = require('needle');
var cheerio = require('cheerio');
var fs = require('fs-extra');
var tress = require('tress');
var mongoClient = require('mongodb').MongoClient;
var mongoDbUrl = "mongodb://localhost:27017/mydb";


var rambler_news_url_for_regions = 'https://news.rambler.ru/top/region/';
var rambler_news_url = 'https://news.rambler.ru';
var news_links_path = './rambler_news_links.json';
var news_preview_path = './rambler_news_preview/';

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
            fs.writeFileSync(news_links_path, JSON.stringify(results, null, 2));
            var data_news = require(news_links_path); 
            resolve(data_news);
        }

        for( var i = 2; i <= 322; i++){
            q.push(rambler_news_url_for_regions+i+'/?page=1');
        }  
                   
    });    
}

function load_preview_news(){  
    fs.pathExists(news_links_path, (err, exists) => {
        if(!exists){
            update_data()
            .then(data_news => {
                for(i in data_news){
                    read_data(data_news[i])
                }    
            })
        }
        else {
            var data_news = require(news_links_path);
            for(i in data_news){
                read_data(data_news[i])
            } 
        }
    })      
}

function read_data(data){
    fs.ensureDirSync(news_preview_path);
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
                        'topic': topic,
                        'imageRef':imageRef,
                        'href': href,
                    });  
                }
        
            });
            callback()
        })
    });
    
    q.drain = function(){
        fs.writeFileSync(news_preview_path + data.region+'.json', JSON.stringify(results, null, 3));
        console.log(data.region+' news updated');
    } 
    
    for(var i=1; i<=5 ;i++){                       
        var url = data.url+i;
        q.push(url);
    }

}

function getNews(region){
    var region_path = news_preview_path+region+'.json';
    var region_news;
    try{
        region_news = require(region_path);
        return region_news;
    }
    catch(err){
        throw err;
    }
    
}

exports.load_preview_news = load_preview_news;
exports.getNews = getNews;

