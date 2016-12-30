var fs = require('fs');
var html = fs.readFileSync('stats.html', 'utf-8')

var stats = class {
    constructor() {
        this.link_quality = 0;
        this.temperature = 0;
        this.uptime = 0;
    };
};

setInterval(function() {
    try {
        stats.link_quality = parseInt(
            fs.readFileSync('/sys/class/net/wlan0/wireless/link', 'utf-8'));
    } catch(e) {}

    try {
        stats.temperature = parseInt(
            fs.readFileSync('/sys/class/thermal/thermal_zone0/temp', 'utf-8'));
    } catch(e) {}

    try {
        uptime = fs.readFileSync('/proc/uptime', 'utf-8').split(' ')[0];
        var date = new Date(parseFloat(uptime) * 1000);
        stats.uptime = `${date.getUTCDate() - 1} days,
                        ${date.getUTCHours()} hours,
                        ${date.getUTCMinutes()} minutes`;
    } catch(e) {}
}, 1000);

module.exports.getStats = function() {
    return html.replace('##LINK_QUALITY##', stats.link_quality).
                replace('##TEMPERATURE##', stats.temperature).
                replace('##UPTIME##', stats.uptime);
};
