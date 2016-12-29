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
        this.id = -1
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
        btnclass = currentStream.id == i ? "pure-button button-on" : "pure-button button-off";
        btntext = currentStream.id == i ? "wyłącz" : "włącz";

        html += `
            <div class="pure-g">
                <div class="pure-u-1-2">
                    <p>${name}</p>
                </div>
                <div class="pure-u-1-2">
                    <button class="${btnclass}"
                            id="${i}"
                            onclick="buttonClick(this.id)">${btntext}</button>
                </div>
            </div>`;
    }

    res.send(index.replace('##INSERT_THINGS_HERE##', html))
})

app.get('/stats', function(req, res) {
    res.send(stats.getStats());
});

http.listen(8080, function () {
    if (database['lastStation'] != -1)
        playStream(database['lastStation']);
})

var playStream = function(id) {
    currentId = currentStream.id;
    if (currentId == id) {
        // deliberate stop
        mpv.stop();
        currentStream.id = -1;
        saveDB();
    } else {
        if (currentId != -1) {
            mpv.stop();
            io.emit('setInactive', currentId);
        }
        desiredStream.id = id;
        mpv.loadFile(radio_stations[id]["url"]);
    }
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

mpv.on('stopped', function() {
    io.emit('setInactive', currentStream.id);
    currentStream.id = -1;
});

mpv.on('statuschange', function(status) {
    if (status["path"] != null) {
        currentStream.id = desiredStream.id;
        io.emit('setActive', currentStream.id);
    } else {
        currentStream.id = -1;
        io.emit('setInactive', desiredStream.id);
    }
});

setInterval(function() {
    saveDB();
}, 60 * 1000);

// vim: set ft=javascript ts=4 sw=4 sts=4 tw=0 fenc=utf-8 et: 
