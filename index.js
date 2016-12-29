var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');
var node_mpv = require('node-mpv');
var path = require('path');
var stats = require('./stats.js');
var low = require('lowdb');

// constants
const db = low('db.json');
db.defaults(
    { 
        "radio_stations": [
            {
                "name": "Trójka",
                "url": "http://stream3.polskieradio.pl:8954/listen.pls"
            },
            {
                "name": "RMF Classic",
                "url": "http://www.rmfon.pl/n/rmfclassic.pls"
            },
            {
                "name": "Zet Gold",
                "url": "http://www.emsoft.strefa.pl/inne/zetgold.m3u"
            },
            {
                "name": "Radio Zet",
                "url": "http://zet-net-01.cdn.eurozet.pl:8400/listen.pls"
            },
            {
                "name": "RMF FM",
                "url": "http://www.rmfon.pl/n/rmffm.pls"
            }
        ],
        "lastStation": 0
    }).value();

const index = fs.readFileSync('index.html', 'utf-8');
const radio_stations = db.get('radio_stations').value();
const mpv = new node_mpv({ "audio_only" : true });

// sole variable, it seems
var currentStreamId = db.get('lastStation').value();

// start server
http.listen(8080, function () {
    // load last station on start-up
    mpv.loadFile(radio_stations[currentStreamId]["url"]);
})

// react to button clicks
io.on('connection', function(socket){
    socket.on('click', function(id) {
        mpv.loadFile(radio_stations[id]["url"]);
        io.emit('enableButton', currentStreamId);
        io.emit('disableButton', id);
        currentStreamId = id;
        db.set('lastStation', id).value();
    });
});

// HTML-related stuff
app.use(express.static(path.join(__dirname, '/public')))
app.get('/', function (req, res) {
    html = ''
    for (i = 0; i < radio_stations.length; i++) {
        name = radio_stations[i]["name"]
        btndisabled = currentStreamId == i ? 'disabled' : '';

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

// vim: set ft=javascript ts=4 sw=4 sts=4 tw=0 fenc=utf-8 et: 
