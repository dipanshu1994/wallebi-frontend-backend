import { pusher } from "../../config/config";



/*
* method for send receive pusher transactin BTC
 */
let sendReceiveBTCPusher = (transactionDetails, balance, sendReceive) => {
    if (transactionDetails === undefined || balance === undefined || sendReceive === undefined) {
        console.log('Reciver data is undefined in send BTC');
    } else {
        if (sendReceive === 'send') {
            pusher.trigger('Wallebi_com_BTC_Send', `sendBTCTrx-${transactionDetails.userId}`, { "data": [transactionDetails], 'balance': balance });
        } else if (sendReceive === 'receive') {
            pusher.trigger('Wallebi_com_BTC_Receive', `reciveBTCTrx-${transactionDetails.userId}`, { "data": [transactionDetails], 'balance': balance });
        }
    }
};



/*
* method for send receive pusher transactin ETH
 */
let sendReceiveETHPusher = (transactionDetails, balance, sendReceive) => {
    if (transactionDetails === undefined || balance === undefined || sendReceive === undefined) {
        console.log('Reciver data is undefined in send ETH');
    } else {
        if (sendReceive === 'send') {
            pusher.trigger('Wallebi_com_ETH_Send', `sendETHTrx-${transactionDetails.userId}`, { "data": [transactionDetails], 'balance': balance });
        } else if (sendReceive === 'receive') {
            pusher.trigger('Wallebi_com_ETH_Receive', `reciveETHTrx-${transactionDetails.userId}`, { "data": [transactionDetails], 'balance': balance });
        }
    }
};




/*
* method for send receive pusher transactin USDT
 */
let sendReceiveUSDTPusher = (transactionDetails, balance, sendReceive) => {
    if (transactionDetails === undefined || balance === undefined || sendReceive === undefined) {
        console.log('Reciver data is undefined in send USDT');
    } else {
        if (sendReceive === 'send') {
            pusher.trigger('Wallebi_com_USDT_Send', `sendUSDTTrx-${transactionDetails.userId}`, { "data": [transactionDetails], 'balance': balance });
        } else if (sendReceive === 'receive') {
            pusher.trigger('Wallebi_com_USDT_Receive', `reciveUSDTTrx-${transactionDetails.userId}`, { "data": [transactionDetails], 'balance': balance });
        }
    }
};




/*
* method for send receive pusher transactin LTC
 */
let sendReceiveLTCPusher = (transactionDetails, balance, sendReceive) => {
    if (transactionDetails === undefined || balance === undefined || sendReceive === undefined) {
        console.log('Reciver data is undefined in send LTC');
    } else {
        if (sendReceive === 'send') {
            pusher.trigger('Wallebi_com_LTC_Send', `sendLTCTrx-${transactionDetails.userId}`, { "data": [transactionDetails], 'balance': balance });
        } else if (sendReceive === 'receive') {
            pusher.trigger('Wallebi_com_LTC_Receive', `reciveLTCTrx-${transactionDetails.userId}`, { "data": [transactionDetails], 'balance': balance });
        }
    }
};




/*
* method for send receive pusher transactin XMR
 */
let sendReceiveXMRPusher = (transactionDetails, balance, sendReceive) => {
    if (transactionDetails === undefined || balance === undefined || sendReceive === undefined) {
        console.log('Reciver data is undefined in send XMR');
    } else {
        if (sendReceive === 'send') {
            pusher.trigger('Wallebi_com_XMR_Send', `sendXMRTrx-${transactionDetails.userId}`, { "data": [transactionDetails], 'balance': balance });
        } else if (sendReceive === 'receive') {
            pusher.trigger('Wallebi_com_XMR_Receive', `reciveXMRTrx-${transactionDetails.userId}`, { "data": [transactionDetails], 'balance': balance });
        }
    }
};






/*
* method for send receive pusher transactin BCH
 */
let sendReceiveBCHPusher = (transactionDetails, balance, sendReceive) => {
    if (transactionDetails === undefined || balance === undefined || sendReceive === undefined) {
        console.log('Reciver data is undefined in send BCH');
    } else {
        if (sendReceive === 'send') {
            pusher.trigger('Wallebi_com_BCH_Send', `sendBCHTrx-${transactionDetails.userId}`, { "data": [transactionDetails], 'balance': balance });
        } else if (sendReceive === 'receive') {
            pusher.trigger('Wallebi_com_BCH_Receive', `reciveBCHTrx-${transactionDetails.userId}`, { "data": [transactionDetails], 'balance': balance });
        }
    }
};






/*
* method for send receive pusher transactin XRP
 */
let sendReceiveXRPPusher = (transactionDetails, balance, sendReceive) => {
    if (transactionDetails === undefined || balance === undefined || sendReceive === undefined) {
        console.log('Reciver data is undefined in send XRP');
    } else {
        if (sendReceive === 'send') {
            pusher.trigger('Wallebi_com_XRP_Send', `sendXRPTrx-${transactionDetails.userId}`, { "data": [transactionDetails], 'balance': balance });
        } else if (sendReceive === 'receive') {
            pusher.trigger('Wallebi_com_XRP_Receive', `reciveXRPTrx-${transactionDetails.userId}`, { "data": [transactionDetails], 'balance': balance });
        }
    }
};



/*
* method for send receive pusher transactin XLM
 */
let sendReceiveXLMPusher = (transactionDetails, balance, sendReceive) => {
    if (transactionDetails === undefined || balance === undefined || sendReceive === undefined) {
        console.log('Reciver data is undefined in send XLM');
    } else {
        if (sendReceive === 'send') {
            pusher.trigger('Wallebi_com_XLM_Send', `sendXLMTrx-${transactionDetails.userId}`, { "data": [transactionDetails], 'balance': balance });
        } else if (sendReceive === 'receive') {
            pusher.trigger('Wallebi_com_XLM_Receive', `reciveXLMTrx-${transactionDetails.userId}`, { "data": [transactionDetails], 'balance': balance });
        }
    }
};




export {
    sendReceiveBTCPusher,
    sendReceiveETHPusher,
    sendReceiveUSDTPusher,
    sendReceiveLTCPusher,
    sendReceiveXMRPusher,
    sendReceiveBCHPusher,
    sendReceiveXRPPusher,
    sendReceiveXLMPusher,
}