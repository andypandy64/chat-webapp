const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

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
        username: 'anonymous'
    });
    sendUserList(socket);

    socket.on('disconnect', () => {
        console.log('user disconnected');
        users = users.filter( user => user.id !== socket.id);
        sendUserList(socket);
    });
});

io.on('connection', (socket) => {
    socket.on('chat message', (msg) => {
      msg = "" + msg;
      let command = msg.split(" ");
      if (command[0] == '/username')
      {
        for (let user of users) {
          if (user.id == socket.id) {
            user.username = command[1];
            sendUserList(socket);
            return;
          }
        }
      }
      // io.emit('chat message', users.find((user) => user.id === socket.id).username + ': ' + msg);
      io.emit('chat message', {
        username: users.find((user) => user.id === socket.id).username,
        message: msg
      })
    });
  });

const sendUserList = s => {
    io.emit('userList update', users);
}

http.listen(process.env.PORT || 3000, () => {
  console.log('listening on *:3000');
});