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
    if (msg == '') return;
    let user = users.find((user) => user.id === socket.id);
    if (msg.charAt(0) == '/') {
      let command = msg.split(" ");
      if (command[0] == '/username') {
        let serverMessage = user.username;
        user.username = command[1];
        serverMessage += ' is now ' + user.username;
        sendUserList(socket);
        io.emit('chat message', {
          username: 'SERVER',
          message: serverMessage,
          color: 'yellow'
        });
        return;
      } else if (command[0] == '/color') {
        user.color = command[1];
        return;
      }
    }

    let isImage = /^https?:\/\/(?:[a-z0-9\-]+\.)+[a-z]{2,6}(?:\/[^\/#?]+)+\.(?:jpe?g|gif|png|bmp)$/i;
    let isYoutubeUrl = /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?(?=.*v=((\w|-){11}))(?:\S+)?$/;
    
    let msgSplit = msg.split(' ');
    let newMsg = msgSplit.map(word => {
      if(isImage.test(word))
        return '<img class="messageImage" src="' + word + '">';
      else if (isYoutubeUrl.test(word)) {
        let id = word.split("?v=")[1];
        return '<iframe class="youtubeEmbed" src="https://www.youtube.com/embed/' + id + '" frameborder="0" allowfullscreen></iframe>';
      }
      return linkifyHtml(word, {
        defaultProtocol: 'https'
      });
    });

    msg = newMsg.join(' ');
    
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

let usersTyping = [];
let output = '';

io.on('connection', socket => {
  socket.on('user typing', () => {
    let username = users.find(user => user.id == socket.id).username;
    if (!usersTyping.includes(username)) usersTyping.push(username);
  });
});

setInterval(() => {
  activeUsersTyping = usersTyping.slice();
  usersTyping = [];
  activeUsersTyping.forEach(username => output += (username + ', '));
  output = output.slice(0, -2);
  if (activeUsersTyping.length)
    output += (activeUsersTyping.length > 1) ? ' are typing...' : ' is typing...';
  io.emit('users typing', output);
  output = '';
},2000);

http.listen(process.env.PORT || 3000, () => {
  console.log('listening on *:3000');
});