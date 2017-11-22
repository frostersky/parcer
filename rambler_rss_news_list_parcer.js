var needle = require('needle');
var cheerio = require('cheerio');
var fs = require('fs-extra');

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
                fs.writeJson(data_news_loc, JSON.stringify(rss_list, null, 2));
                resolve (rss_list);
            })           
        
    });
}

function init(){
    return new Promise(function(resolve, reject){
        fs.ensureFile(data_news_loc)
        .then(() => {
            var data_news = require(data_news_loc);
            reject(data_news);
        })
        .catch(err => {
          resolve();
        })
    });
}

function load_rambler_news(data_news){
    console.log('load news');
}

exports.load_rambler_news = function(){
    init()
        .then(
            () => update_data(),   
            data_news => load_rambler_news(data_news)
        )
        .then(
            data_news => load_rambler_news(data_news)
        )
} 