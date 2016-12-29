var socket = io();

function buttonClick(id) {
    socket.emit('click', id);
}

socket.on('enableButton', function(id) {
    $('#' + id).prop('disabled', false);
});

socket.on('disableButton', function(id) {
    $('#' + id).prop('disabled', true);
});

socket.on('setInfo', function(info) {
    $('#info').text(info);
});
