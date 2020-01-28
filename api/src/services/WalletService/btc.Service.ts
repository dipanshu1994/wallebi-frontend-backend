/**
 * It is library that helps creating addres, transfer amount
 * it supports btc, ltc and bch
 */
import { RPCClient } from './rpcClient.service';
import { nodeAddreses } from '../../config/config';
import { ExchangeTrade } from '../../db/models/Wallets/exchange.trade.model';


let client = new RPCClient(nodeAddreses.btc);


/**
 * Create wallet function
 * @returns {String} Return address
 */
let createWallet = () => {
    try {
        return client.execute('getnewaddress', []);
    } catch (error) {
        console.log(error)
    }
};

let getPeerInfo = async (passphrase, timeout) => {
    try {
        return await client.execute('walletpassphrase', [passphrase, timeout]);
    } catch (error) {
        console.log(error)
    }
};


/**
 * Create mulit signature wallet function
 * @param account {String} account name
 * @returns {String} Return multisig wallet address
 */
let createMultiSigWallet = async (account) => {
    try {
        if (!account) throw new Error('Account name is required.');
        let keys = [];
        await keys.push(await createWallet());
        await keys.push(await createWallet());
        return client.execute('addmultisigaddress', [2, keys, account]);
    } catch (error) {
        console.log(error)
    }
};
/**
 * Create mulit signature wallet function
 * @param {String} account account name
 * @returns {Number} Return balance of particular address
 */
const getBTCBalance = async (account) => {
    try {
        if (!account) throw new Error('Account name is required.');
        return await client.execute('getbalance', [account]);
    } catch (error) {
        console.log(error);
    }
};


/**
 * Create mulit signature wallet function
 * @param {String} account account name
 * @returns {Number} Return balance of particular address
 */
const setBTCTxFee = async (amount) => {
    try {
        if (!amount) throw new Error('amount is required.');
        return await client.execute('settxfee', [amount]);
    } catch (error) {
        console.log(error)
    }
};

/**
 * Create mulit signature wallet function
 * @param {String} from from account
 * @param {String} to to account
 * @param {String} amount amount to be sent
 * @param {Object} options will contain other options
 * @returns {String} Return transaction hex
 */
const transferBTCAmount = async (from, to, amount, confirmation, options?) => {
    try {
        if (!from) throw new Error('from account is required.');
        if (!to) throw new Error('to account is required.');
        if (!amount) throw new Error('Amount is required.');
        return await client.execute('sendfrom', [from, to, amount, confirmation]);
    } catch (error) {
        console.log(error)
    }
}




/**
 * Create mulit signature wallet function
 * @param {String} from from account
 * @param {String} to to account
 * @param {String} amount amount to be sent
 * @param {Object} options will contain other options
 * @returns {String} Return transaction hex
 */
const moveBTCAmount = async (from, to, amount, confirmation, options?) => {
    try {
        if (!from) throw new Error('from account is required.');
        if (!to) throw new Error('to account is required.');
        if (!amount) throw new Error('Amount is required.');
        return await client.execute('move', [from, to, amount, confirmation]);
    } catch (error) {
        console.log(error)
    }
}


/**
 * @param {String} tx
 * @return transaction object
 */
const getBTCTransaction = async (tx) => {
    try {
        return await client.execute('gettransaction', [tx]);
    } catch (error) {
        console.log(error)
    }
}


/**
 * @param {String} account
 * @return Account Name object
 */
const getBTCListTransaction = async (account, limit) => {

    try {
        return await client.execute('listtransactions', [account, limit]); 
    } catch (error) {
        console.log(error)
    }
}


/**
 * @param {String} account
 * @return Account Name object
 */
const getBTCNetworkFee = async (nblocks) => {
    try {
        return await client.execute('estimatesmartfee', [nblocks]);
    } catch (error) {
        console.log(error)
    }
}


let getBTCAllTransaction = async (hash) => {
    try {
        return await client.execute('gettransaction', [hash]);
    } catch (error) {
        console.log(error);
    }
};

/**
 * @param {String} account
 */
let getAddressByAccount = async (account) => {
    try {
        return await client.execute('getaddressesbyaccount', [account]);
    } catch (error) {
        console.log(error);
    }
};



/**
 * @param {String} account
 */
let getBTCTradeBalance = async (account) => { 
    try {
    let tradewallets = await ExchangeTrade.findOne({ userId: account ,cryptoType: 'BTC'});
    console.log('tradewallets',tradewallets);
    if(tradewallets == null){
        return 0;
    }
    let balanceOfBTC = tradewallets.cryptoAmount;
    return balanceOfBTC;
    } catch (error) {
        console.log(error);
    }
};

export {
    createWallet,
    getBTCBalance,
    transferBTCAmount,
    moveBTCAmount,
    createMultiSigWallet,
    getBTCTransaction,
    getPeerInfo,
    setBTCTxFee,
    getBTCListTransaction,
    getBTCNetworkFee,
    getBTCAllTransaction,
    getAddressByAccount,
    getBTCTradeBalance
}
