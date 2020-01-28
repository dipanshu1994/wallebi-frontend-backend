import * as StellarSdk from 'stellar-sdk';
import * as cron from 'node-cron';
import { Fees } from '../../db/models/Wallets/cryptoTrnxFee.model';

StellarSdk.Network.usePublicNetwork();
const server = new StellarSdk.Server("https://horizon.stellar.org");


let activateStellerWallet = async (walletname) => {
    try {
        let pair = StellarSdk.Keypair.random();
        let keysecret = pair.secret();
        let publicKey = pair.publicKey();
        let xlmData = {
            name: walletname,
            secret: keysecret,
            address: publicKey,
            balance: 0
        };
        return xlmData;
    } catch (error) {
        console.log(error);
    }   
};


cron.schedule('0 00 * * *', async () => {
    let fee = await server.fetchBaseFee();
    Fees.findOneAndUpdate({ status: true }, { stellarFee: fee/10000000 }, { upsert: true },  (err, result) => {
        if (err) {
            console.log(err);
        } else {
            // console.log('result' +result);
        }
    });
});


export {
    activateStellerWallet,
}
