import { RPCClient } from './rpcClient.service';
import { nodeAddreses } from '../../config/config';


const client = new RPCClient(nodeAddreses.omniusdt);



/**
 * Create wallet function
 * @returns {String} Return address
 */

const createWallet = () => {
    try {
        return client.execute('getnewaddress', []);
    } catch (error) {
        console.log(error);
    }
};

const getPeerInfo = async (passphrase, timeout) => {
    try {
        return await client.execute('walletpassphrase', [passphrase, timeout]);
    } catch (error) {
        console.log(error);
    }
};



/**
 * Create mulit signature wallet function
 * @param account {String} account name
 * @returns {String} Return multisig wallet address
 */
const createMultiSigWallet = async (account) => {
    try {
        if (!account) throw new Error('Account name is required.');
        let keys = [];
        await keys.push(await createWallet());
        await keys.push(await createWallet());
        return client.execute('addmultisigaddress', [2, keys, account]);
    } catch (error) {
        console.log(error);
    }
};




/**
 * Create mulit signature wallet function
 * @param {String} account account name
 * @returns {Number} Return balance of particular address
 */
const getTetherBalance = async (account) => {
    try {
        if (!account) throw new Error('Account name is required.');
        return await client.execute('omni_getbalance', [account, 31]);
    } catch (error) {
        console.log(error);
    }
};


/**
 * Create mulit signature wallet function
 * @param {String} account account name
 * @returns {Number} Return balance of particular address
 */
const setTxFee = async (amount) => {
    try {
        if (!amount) throw new Error('amount is required.');
        return await client.execute('settxfee', [amount]);
    } catch (error) {
        console.log(error);
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
const transferTetherAmount = async (from, to, amount, confirmation, options?) => {
    try {
        if (!from) throw new Error('from account is required.');
        if (!to) throw new Error('to account is required.');
        if (!amount) throw new Error('Amount is required.');
        return await client.execute('sendfrom', [from, to, amount, confirmation]);
    } catch (error) {
        console.log(error);
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
const moveAmount = async (from, to, amount, confirmation, options) => {
    try {
        if (!from) throw new Error('from account is required.');
        if (!to) throw new Error('to account is required.');
        if (!amount) throw new Error('Amount is required.');
        return await client.execute('move', [from, to, amount, confirmation]);
    } catch (error) {
        console.log(error);
    }
}


/**
 * @param {String} tx
 * @return transaction object
 */
const getUSDTTransaction = async (tx) => {
    try {
        return await client.execute('omni_gettransaction', [tx]);
    } catch (error) {
        console.log(error);
    }
}



/**
 * @param {String} account
 * @return Account Name object
 */
const getUSDTListTransaction = async (account, limit) => {
    try {
        return await client.execute('omni_listtransactions', [account, limit]);
    } catch (error) {
        console.log(error);
    }
}

/**
 * @param {String} account
 * @return Account Name object
 */
const getTetherNetworkFee = async (nblocks) => {
    try {
        return await client.execute('estimatefee', [nblocks]);
    } catch (error) {
        console.log(error);
    }
}





export {
    createWallet,
    getTetherBalance,
    transferTetherAmount,
    moveAmount,
    createMultiSigWallet,
    getUSDTTransaction,
    getPeerInfo,
    setTxFee,
    getUSDTListTransaction,
    getTetherNetworkFee
};
