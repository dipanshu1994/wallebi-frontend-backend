

import * as express from 'express';

import * as http from 'http';
import * as bodyParser from 'body-parser';
import * as cookieParser from "cookie-parser";

import socketIO from 'socket.io';
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());


var server = http.createServer(app);
const ioSocketss = socketIO(server);

ioSocketss.on('connection', (socket) => {
   socket.on('disconnect', () => {
       console.log('user disconnected. ####################################################### ', socket.id);
   });
   socket.emit("testing", { abc: "qwerty" });
});



app.post('/followRequest', (req, res, next) => {
   try {
       if (Object.keys(req.body).length > 0) {
           console.log("SOCKET BODY", req.body);
           var userId = req.body.followerid.toString();
           var eventName = "newMessage";
           ioSocketss.emit(eventName, req.body);
       }
   } catch (e) {
       res.status(500).json({ message: e.message })
   }
});

server.listen(8000);