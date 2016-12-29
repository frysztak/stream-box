var socket = io();

function buttonClick(id) {
    socket.emit('click', id);
}

socket.on('setActive', function(id) {
    $('#' + id).removeClass('button-off').addClass('button-on').text('wyłącz');
});

socket.on('setInactive', function(id) {
    $('#' + id).removeClass('button-on').addClass('button-off').text('włącz');
});

socket.on('setInfo', function(info) {
    $('#info').text(info);
});
