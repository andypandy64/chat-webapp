const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
var linkify = require('linkifyjs');
var linkifyHtml = require('linkifyjs/html');
require('linkifyjs/plugins/hashtag')(linkify);

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Variables
let users = [];

io.on('connection', (socket) => {
  console.log('a user connected');
  users.push({
    id: socket.id,
    username: 'anonymous',
    color: 'white'
  });
  sendUserList(socket);

  socket.on('disconnect', () => {
    console.log('user disconnected');
    users = users.filter(user => user.id !== socket.id);
    sendUserList(socket);
  });
});

io.on('connection', (socket) => {
  socket.on('chat message', (msg) => {
    let user = users.find((user) => user.id === socket.id);
    if (msg.charAt(0) == '/') {
      let command = msg.split(" ");
      if (command[0] == '/username') {
        user.username = command[1];
        sendUserList(socket);
        return;
      } else if (command[0] == '/color') {
        user.color = command[1];
        return;
      }
    }

    io.emit('chat message', {
      username: user.username,
      message: msg,
      color: user.color
    })
  });
});

const sendUserList = s => {
  io.emit('userList update', users);
}

http.listen(process.env.PORT || 3000, () => {
  console.log('listening on *:3000');
});