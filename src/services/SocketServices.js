import {Server} from "socket.io";

class SocketService{
  constructor(){
    console.log("Socket service initialized");
    this.io = new Server({
      cors: {
        allowedHeaders:["*"],
        origin:"*",
      }
    });
  }
  initializeListeners(){
    console.log("Socket listeners initialized");
    const io = this.io;
    io.on("connection", (socket) => {
      console.log("a user connected");
    })
  }
}

export default SocketService;