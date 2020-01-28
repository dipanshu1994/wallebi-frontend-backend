var express = require('express');
var path = require('path');
var app = express();
app.set('port', (process.env.PORT || 4200));
app.use(express.static(__dirname + '/dist/Wallebi'));

app.get('/*', function(req, res) {
    res.sendFile(path.join(__dirname + '/dist/Wallebi/index.html'));
});

app.listen(app.get('port'), function() {
    console.log('app running on port', app.get('port'));
});