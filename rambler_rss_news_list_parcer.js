var needle = require('needle');
var cheerio = require('cheerio');
var fs = require('fs-extra');
var feedparser = require('feedparser-promised');
var tress = require('tress');

var rambler_rss_url = 'https://news.rambler.ru/rss/?updated';
var data_news_loc = './rambler_rss_news_links.json';

function update_data(){
    return new Promise(function(resolve, reject){
        console.log('Start updating rss links...')
        needle('get', rambler_rss_url)
            .then(resp => {
                console.log('Start parsing...')
                var rss_list = [];
                var $ = cheerio.load(resp.body);    
                var rss_news_refs = $('.rss__item');
                rss_news_refs.each(function(i, element){
                    if(i>=19){
                        var city_name = $($(element).children()[0]).text();
                        var rss_ref = $($(element).children()[1]).text().replace(/\r|\n/g, '');
            
                        if(city_name != undefined && rss_ref != undefined){
                            console.log('----------------------');
                            console.log('city_name: '+city_name);
                            console.log('rss_ref: '+rss_ref);
                            rss_list.push({
                                "city_name" : city_name,
                                "rss_ref": rss_ref
                            });            
                        }
                    }
            
                });
                var data_news = JSON.stringify(rss_list, null, 2);
                fs.writeJson(data_news_loc, data_news);
                resolve (data_news);
            })           
        
    });
}


function load_rambler_news(data_news){
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
            fs.writeJson('./rambler_news/'+data.city_name+'.json', data_news);
        });
    }, data_news.length);
    for(i in data_news){
        //city_link.set(data_news[i].rss_ref, data_news[i].city_name)
        q.push(data_news[i])
        console.log(i);
    }
}



exports.load_rambler_news = function(city_name){
    fs.ensureFile(data_news_loc)
    .then(
        () => load_rambler_news(require(data_news_loc))        
    )
    .catch(
        err => {
            update_data()
                .then(data_news => load_rambler_news(data_news));
        }
    );    
} 
