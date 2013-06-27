
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
//app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});



/* socket.io */
var io = require('socket.io').listen(server);

// usernames which are currently connected to the chat
var usernumber = 0;
var activeuser = 0;
var usernames = [];
var words =  ['Apfel', 'Banane', 'Birne'];
var wordscount = 0;
var word = words[0];
var time = 0;
var glid = 0;

var round = 1;

var echochat = '';



function startgl() {
  glid = setInterval(function(){
      io.sockets.emit('time', time);

      time = time + 1;

        io.sockets.emit('activeuser', activeuser);


      if (time > 15) {
        // nach 90 sekunden zeit zurücksetzen
        time = 0;

        // und den user wechseln
        if (activeuser < usernumber)
          activeuser = activeuser + 1;
        else
          activeuser = 0

        // und neuen Begriff waehlen
        if (wordscount + 1 < words.length)
          wordscount = wordscount + 1;
        else
          wordscount = 0

        word = words[wordscount];

        io.sockets.emit('word', '');
        io.sockets.socket(usernames[activeuser][1]).emit('word', word);
        io.sockets.emit('youreactive', 0);
        io.sockets.socket(usernames[activeuser][1]).emit('youreactive', 1);

        //rounds
        round = round + 1;
        io.sockets.emit('round', round);

      }
    }, 1000);
}

io.sockets.on('connection', function (socket) {
  // when the client emits 'sendchat', this listens and executes
  socket.on('sendchat', function (data) {
    // we tell the client to execute 'updatechat' with 2 parameters
    dataop = data.trim().toUpperCase();
    wordop = word.trim().toUpperCase();
    if (dataop == wordop) {
      io.sockets.socket(socket.id).emit('updatechat', 'YES', '<i>'+ data +' is correct</i>');
    } else if (dataop.indexOf(wordop) >= 0 || wordop.indexOf(dataop) >= 0) {
      io.sockets.socket(socket.id).emit('updatechat', 'ALMOST', '<i>'+ data +' is close</i>');
    } else {
      console.log('wrong');
    }
    io.sockets.emit('updatechat', socket.username, data);
  });

  // when the client emits 'adduser', this listens and executes
  socket.on('adduser', function(username){
    usernumber = usernames.length;
    // we store the username in the socket session for this client
    socket.username = username;
    socket.usernumber = usernumber;
    //console.log(socket.id);
    // add the client's username to the global list
    usernames[usernumber] = new Array(username, socket.id, 0);
    if (usernames.length > 0 && glid == 0)
      startgl();
    
    console.log(usernames);
    // echo to client they've connected
    socket.emit('updatechat', 'SERVER', 'you have connected');
    // echo globally (all clients) that a person has connected
    socket.emit('usernumber', usernumber);
    socket.broadcast.emit('updatechat', 'SERVER', username + ' has connected');
    // update the list of users in chat, client-side
    console.log(usernames);
    io.sockets.emit('updateusers', usernames);
    io.sockets.emit('activeuser', 'uc' + activeuser);
io.sockets.emit('round', round);
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function(){
    // remove the username from global usernames list
    if (usernumber = activeuser)
      activeuser = 0;

    usernames.splice(socket.usernumber, 1);
    console.log("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX: "+usernames.length)
    if (usernames.length == 0) {
      clearInterval(glid);
      glid = 0;
    }

    console.log (glid);
    // update list of users in chat, client-side
    io.sockets.emit('updateusers', usernames);
    // echo globally that this client has left
    socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
  });


  socket.on('image', function (data) {
    io.sockets.emit('updateimage', data);
  });



});