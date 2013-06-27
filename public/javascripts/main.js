


$( document ).ready(function() {


/* socket.io */
var socket = io.connect('http://localhost');

var usernumber = 0;
var activeuser = 0;

      $('#playground').wPaint({
        mode                 : 'Pencil',
        strokeStyle          : '#000000',
        drawUp: function(e, mode){
          console.log("asdsad");
          var imageData = $("#playground").wPaint("image");
          socket.emit('image', imageData);
        }
      });

socket.on('connect', function(){
    // call the server-side function 'adduser' and send one parameter (value of prompt)
    socket.emit('adduser', prompt("What's your name?"));
});

// listener, whenever the server emits 'updateusers', this updates the username list
  socket.on('updateusers', function(data, points) {
    $('#userlist').empty();
    $.each(data, function(key, value) {
      $('#userlist').append('<div class="uc'+key+'">' + value[0] + ': '+value[2]+' points</div>');
    });
  });

// listen for my number
  socket.on('usernumber', function(data) {
    usernumber = data;
  });

// listener, whenever the server emits 'updatechat', this updates the chat body
  socket.on('updatechat', function (username, data) {
    $('#chatmain').append('<b>'+username + ':</b> ' + data + '<br>');
  });


  socket.on('activeuser', function(data){
    $('#userlist div.uc'+ data).addClass('active').siblings().removeClass('active');
  });


  socket.on('time', function(data){
    $('#timer').empty().append(data);
  });

  socket.on('round', function(data){
    $('#round').empty().append(data);
  });

  socket.on('youreactive', function(data){

    if (data == 1) {
      $('#chatdata').prop('disabled', true);

      $('#playground').wPaint('clear');
      $('#playground').show();
      $('#canvasimage').hide();

    } else {
      $('#chatdata').prop('disabled', false);
      $('#canvasimage').show();
      $('#playground').wPaint('clear');
      var imageData = $("#playground").wPaint("image");
          socket.emit('image', imageData);
      $('#playground').hide();

      socket.on('updateimage', function(data){
        $("#canvasimage").attr('src', data);
      });

    }
  });


  socket.on('word', function(data){
    $('#word').empty().append(data);
  });
    


$('#chatsend').click( function() {
  var message = $('#chatdata').val();
  $('#chatdata').val('');
  // tell server to execute 'sendchat' and send along one parameter
  socket.emit('sendchat', message);
});

// when the client hits ENTER on their keyboard
$('#chatdata').keypress(function(e) {
  if(e.which == 13) {
    var message = $('#chatdata').val();
    $('#chatdata').val('');
    socket.emit('sendchat', message);
  }
});


//wPaint

  


});