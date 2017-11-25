var needle = require('needle');

needle('get', 'https://news.rambler.ru/top/region/322/?page=1')
.then(resp => {
    var body = resp.body;
    console.log(body)    
})