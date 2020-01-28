import * as Web3 from 'web3';
import { convertETH } from 'cryptocurrency-unit-convert';
import * as dec2hex from 'hex-to-dec';
import { nodeAddreses } from '../../config/config';
import { Fees } from '../../db/models/Wallets/cryptoTrnxFee.model';

let web3 = new Web3(`http://${nodeAddreses.eth.host}:${nodeAddreses.eth.port}`);

// var web3 = new Web3(new Web3.providers.HttpProvider('https://ropsten.infura.io/v3/c704b970d18f4b0bbe2ec827d54451dd'));

// let newAccount = async (password) => {
//     try {
//         return await web3.eth.personal.newAccount(password);        
//     } catch (error) {
//         console.log(error);
//     }
// }


let newAccount = async (password) => {
    try {
        let res = await web3.eth.accounts.create(password);
        let  obj ={ 
            address: res.address,
            key: res.privateKey
        };
        return obj;        
    } catch (error) {
        console.log(error);
    }
}


let getBalance = async (address) => {
    try {
        console.log(web3.eth.getBalance(address));
        return web3.eth.getBalance(address);
    } catch (error) {
        console.log(error);
    }
}


let unlockAddress = async (address, password) => {
    try {
        return web3.eth.personal.unlockAccount(address, password, 1000);
    } catch (error) {
        console.log(error);
    }
};

let sendTransaction = async (from, to, amount) => {

    try {
        if (!from) throw new Error('From address is required.');
        if (!to) throw new Error('Address is required.');
        if (!amount) throw new Error('Amount is required.');
        let tx = { from, to, value: '0x' + dec2hex(convertETH(amount, 'eth', 'wei')) };
        return web3.eth.sendTransaction(tx);
    } catch (error) {
        console.log(error);
    }
}




let getEstimatedGasPrice = async () => {
    try {
        let gas =  await web3.eth.getGasPrice();
        let gasEther = web3.utils.fromWei(gas, 'ether');
        let estimatedGas = gasEther * 100000;
        Fees.findOneAndUpdate({ status: true }, { etherumFee: estimatedGas }, { upsert: true },  (err, result) => {
            if (err) {
                console.log(err);
            } else {
                // console.log('result' +result);
            }
        });
        return estimatedGas;
    } catch (error) {
        console.log(error);
    }
};



let validAddress = async(address) => {
    try {
        return await web3.utils.isAddress(address);
    } catch (error) {
        console.log(error);
    }
};



let getTransactionCount = async (address) => {
    try {
        return await web3.eth.getTransactionCount(address);
    } catch (error) {
        console.log(error)
    }
};



let getEstimatedGas = async (from, to, count) => {
    try {
        return await web3.eth.estimateGas({
            "from": from,
            "nonce": count,
            "to": to,
        })
    } catch (error) {
        console.log(error);
    }
};


// cron.schedule('* */5 * * * *', async () => {
//     getEstimatedGas();
// });




export {
    newAccount,
    getBalance,
    unlockAddress,
    sendTransaction,
    getEstimatedGasPrice,
    validAddress,
    getTransactionCount,
    getEstimatedGas
}