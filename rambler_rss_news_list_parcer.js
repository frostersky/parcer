var needle = require('needle');
var cheerio = require('cheerio');
var fs = require('fs');

var rambler_rss_url = 'https://news.rambler.ru/rss/?updated';
var rss_list = [];
needle.get(rambler_rss_url, function(err, res){
    if (err) throw err;

    var $ = cheerio.load(res.body);

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
    fs.writeFileSync('./rambler_rss_news.json', JSON.stringify(rss_list, null, 2));
});

exports.rss_list = rss_list;