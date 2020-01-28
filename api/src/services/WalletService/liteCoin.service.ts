import { RPCClient } from "./rpcClient.service";
import { nodeAddreses } from "../../config/config";



const client = new RPCClient(nodeAddreses.ltc);


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
        //keys.toString();
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
const getLiteCoinBalance = async (account) => {
    try {   
        if (!account) throw new Error('Account name is required.');
        return await client.execute('getbalance', [account]);
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
const transferAmount = async (from, to, amount, options) => {
    try {   
        if (!from) throw new Error('from account is required.');
        if (!to) throw new Error('to account is required.');
        if (!amount) throw new Error('Amount is required.');
        return await client.execute('sendfrom', [from, to, amount]);
    } catch (error) {
        console.log(error);
    }
}



/**
 * @param {String} tx
 * @return transaction object
 */
const getLiteCoinTransaction = async (tx) => {
    try {   
        return await client.execute('gettransaction', [tx]);
    } catch (error) {
        console.log(error);
    }
}


/**
 * @param {String} account
 * @return Account Name object
 */
const getLTCListTransaction = async (account, limit, from) => {
    try {   
        return await client.execute('listtransactions', [account, limit, from]);
    } catch (error) {
        console.log(error);
    }
}

/**
 * @param {String} account
 * @return Account Name object
 */
const getLTCNetworkFee = async (nblocks) => {
    try {   
        return await client.execute('estimatesmartfee', [nblocks]);
    } catch (error) {
        console.log(error);
    }
}


//Parameters: none
//Result—A JSON object providing information about the block chain 
const getBlockChainInfo = async () => {
    try {   
        return await client.execute('getblockchaininfo', []);
    } catch (error) {
        console.log(error);
    }
}

// Parameter—a block height {number}
// Result—the block header hash 
const getBlockHash = async (b_header) => {
    try {   
        return await client.execute('getblockhash', [b_header]);
    } catch (error) {
        console.log(error);
    }
}

// Parameter—a block hash
// Returns information about the block with the given hash. 
const getBlock = async (b_hash) => {
    try {   
        return await client.execute('getblock', [b_hash]);
    } catch (error) {
        console.log(error);
    }
}

// return information about unspent transaction
const getltcUnSpent = async (account) => {
    try {   
        return await client.execute('getrawtransaction', [account]);
    } catch (error) {
        console.log(error);
    }
};

export {
    createWallet,
    getLiteCoinBalance,
    transferAmount,
    createMultiSigWallet,
    getLiteCoinTransaction,
    getLTCListTransaction,
    getLTCNetworkFee,
    getBlockChainInfo,
    getBlockHash,
    getBlock,
    getltcUnSpent
};
