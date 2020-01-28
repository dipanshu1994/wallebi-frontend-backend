import * as express from 'express'
import * as logger from 'morgan'
import * as cors from "cors";
import * as path from 'path'
import * as http from 'http'
import * as bodyParser from 'body-parser'
import * as useragent from 'express-useragent';
import * as  device from 'express-device';
import * as expressValidators from 'express-validator';
import * as requestIp from 'request-ip';
declare global {
  var socketIO: any
}
var socketIO = require('socket.io');
//import * as socketIO from "socket-io";

const db = require('./db/database');

import * as Users from './routes/Users';
import * as userWallets from './routes/cryptoCurrencies';
import * as Admin from './routes/Admin';
import * as Exchange from './routes/exchangeRoutes';

var debug = require('debug')('ejs:server');

const app: express.Application = express()


//options for cors midddleware
let allowedOrigins = ['http://local.wallebi.com', 'http://localhost:4300', 'http://localhost:4201', 'https://wallebi.com', 'https://wallebi.exchange', 'https://admin.wallebi.com', 'http://wallebi.com', 'http://admin.wallebi.com'];

app.use(cors({
  credentials: true,
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  origin: (origin, callback) => {
    // allow requests with no origin 
    // (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) === -1) {
      var msg = 'The CORS policy for this site does not ' +
        'allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
}));
app.use(logger('dev'));
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));
app.use(expressValidators());
app.use(useragent.express());
app.use(device.capture());
app.use(requestIp.mw())
app.use(express.static(__dirname + '/public'));


/**
 *  users routing 
 */
app.use('/users', Users)

/**
 * users wallets routing
 */
app.use('/userWallets', userWallets)

/**
 *  Admin routing
 */
app.use('/admin', Admin)



/**
 * exchange routes
 */
app.use('/exchange', Exchange);




/**
 * Module dependencies.
 */



/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

/**
 * Create HTTP server.
 */

var server = http.createServer(app);
//const io = socketIO(server);

const ioSocketss = socketIO(server);
app.set('io', ioSocketss);
ioSocketss.on('connection', (socket) => {
  console.log('Socket Connected');
});


/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);


/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}


export {ioSocketss}