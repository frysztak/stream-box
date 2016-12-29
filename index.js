var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');
var node_mpv = require('node-mpv');
var path = require('path');
var stats = require('./stats.js');

var database = JSON.parse(fs.readFileSync('db.json', 'utf-8'))
var radio_stations = database["radio_stations"]
var index = fs.readFileSync('index.html', 'utf-8')

class Stream {
    constructor() {
        this.streamType = 'radio'
        this.id = 0
    }
};

var currentStream = new Stream();
var desiredStream = new Stream();
var mpv = new node_mpv({ "audio_only" : true });

app.use(express.static(path.join(__dirname, '/public')))
app.get('/', function (req, res) {
    len = radio_stations.length
    html = ''

    for (i = 0; i < len; i++) {
        name = radio_stations[i]["name"]
        btndisabled = currentStream.id == i ? 'disabled' : '';

        html += `
            <div class="pure-g">
                <div class="pure-u-1-2">
                    <p>${name}</p>
                </div>
                <div class="pure-u-1-2">
                    <button class="pure-button pure-button-primary"
                            id="${i}"
                            onclick="buttonClick(this.id)"
                            ${btndisabled}>włącz</button>
                </div>
            </div>`;
    }

    res.send(index.replace('##INSERT_THINGS_HERE##', html))
})

app.get('/stats', function(req, res) {
    res.send(stats.getStats());
});

http.listen(8080, function () {
    id = 0;
    mpv.loadFile(radio_stations[id]["url"]);
    io.emit('setActive', id);
})

var playStream = function(id) {
    // stop current stream
    io.emit('enableButton', currentStream.id);
    currentStream.id = id;
    mpv.loadFile(radio_stations[id]["url"]);
    io.emit('disableButton', id);
};

var saveDB = function() {
    database['lastStation'] = currentStream.id;
    fs.writeFileSync('db.json', JSON.stringify(database, null, 2));
    console.log('saving db.json...');
};

io.on('connection', function(socket){
    console.log('a user connected');
    socket.on('click', function(id) {
        playStream(id);
    });
});

setInterval(function() {
    saveDB();
}, 60 * 1000);

// vim: set ft=javascript ts=4 sw=4 sts=4 tw=0 fenc=utf-8 et: 
