var express = require('express');
var path = require('path');
var app = express();
app.set('port', (process.env.PORT || 4300));
app.use(express.static(__dirname + '/dist/WallebiAdmin'));

app.get('/*', function(req, res) {
    res.sendFile(path.join(__dirname + '/dist/WallebiAdmin/index.html'));
});

app.listen(app.get('port'), function() {
    console.log('app running on port', app.get('port'));
});