import * as config from 'config';
import { RippleAPI } from 'ripple-lib';

var live_server = 'wss://r.ripple.com';
let api = new RippleAPI({
    server: live_server,
});

api.on('error', (errorCode, errorMessage) => {
    console.log(`${errorCode} : ${errorMessage}`);
});

api.on('connected', () => {
    console.log('Connected');
});

api.on('disconnected', (code) => {
    console.log(`Disconnected, Code: ${code}`);
});

let connectRipple = (cb) => {
    api.connect().then(cb).catch(cb);
};


/**
 * Create wallet function
 * @returns {String} Return address
 */
let createWallet = async () => {
    api.generateAddress();
};


/**
 * Create mulit signature wallet function
 * @param coin {String} currnecy name
 * @param account {String} account name
 * @returns {String} Return multisig wallet address
 */
let createMultiSigWallet = async (coin, account) => {
};


/**
 * Create mulit signature wallet function
 * @param {String} address address
 * @returns {Number} Return balance of particular address
 */
let getBalance = async (address) => {
    let result = await api.getBalances(address, { currency: 'XRP' });
    if (result.length) return result[0].value;
};



export {
    connectRipple,
    createWallet,
    createMultiSigWallet,
    getBalance
}