
/*
* method for send receive Socket transactin BTC
 */
let sendReceiveBTCSocket = (req, res, transactionDetails, balance, sendReceive) => {
    const io = res.app.get('io');
    if (transactionDetails === undefined || balance === undefined || sendReceive === undefined) {
        console.log('Reciver data is undefined in send BTC');
    } else {
        if (sendReceive === 'sendBitcoin') {
            io.emit('wallebi_BTC_Send', `sendBTCTrx-${transactionDetails.userId}`, { "data": [transactionDetails], 'balance': balance });
        } else if (sendReceive === 'receiveBitcoin') {
            io.emit('wallebi_BTC_Receive', `sendBTCTrx-${transactionDetails.userId}`, { "data": [transactionDetails], 'balance': balance });
        }
    }
};


  let socketIoConnection = function (io) {
    if (io) {
        if (typeof io !== 'undefined') {
            io.emit("xyz",  'this');
        }
    }
}

// var socketIoConnection_limitOrder = function (io) {
//     if (io) {
//        // iosocketss = io;
//         if (typeof io !== 'undefined') {
//             io.emit("limitorder",  'limitorder');
//         }
//     }
// }
export {
    sendReceiveBTCSocket,socketIoConnection }