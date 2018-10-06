let lastMessage;

const saveMessage = (message) => {
  lastMessage = message;
}

const keyPressListener = (e) => {
  if (e.keyCode == 38 && lastMessage) {
    document.getElementById('m').value = lastMessage;
  }
}

const newMessage = () => {
  chatWindow = document.getElementById('messages'); 
let xH = chatWindow.scrollHeight; 
chatWindow.scrollTo(0, xH);
}