import { Admin } from "../../../db/models/admin/admin.model";
import { Wallets } from "../../../db/models/Wallets/wallet.model";
import { activateStellerWallet } from "../../../services/WalletService/xlm.Service";
import { SendReceiveTrx } from "../../../db/models/Wallets/sendReceiveTransaction.model";
import { exec } from "child_process";
import * as StellarSdk from 'stellar-sdk';
import { stellarBalance } from "../../Wallets/xlmController";
import { sendReceiveXLMPusher } from "../../../services/Pusher/pusher";


StellarSdk.Network.usePublicNetwork();
let stellarUrl = new StellarSdk.Server("https://horizon.stellar.org");





function isEmpty(obj) {
    for (var key in obj) {
        if (obj.hasOwnProperty(key))
            return false;
    }
    return true;
}




/**
 * activating xlm wallet controller
 * @param adminId 
 */
let activateAdminStellar = async (req, res, next) => {
    try {
        let { currencyId, symbol, title } = req.body;
        Admin.findOne({ _id: req.admin.id }, async (err, admin) => {
            if (err || admin === null) {
                res.status(200).json({ success: false, msg: err, type: 'activate XLM' });
            } else {
                let walletName = `stellar_${admin.firstname}_${Date.now()}`;
                let { address, name, secret } = await activateStellerWallet(walletName);
                if (address) {
                    let xlmData = { address: address, account_name: name, secret: secret, status: true };
                    await Wallets.findOneAndUpdate({ currencyId: currencyId, adminId: req.admin.id }, xlmData, { new: true }).then((result) => {
                        if (result) {
                            res.status(200).json({ success: true, msg: `${result.title} is activated!`, type: 'stellar wallet activated!'});
                        }
                    }).catch((error) => {
                        console.log(error);
                        res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'activate XLM' });
                    });
                } else {
                    res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'activate XLM' });
                }
            }
        });
    } catch (error) {
        console.log(error);
    }
};





/** 
 * sending stellar to others
 */
let adminSendStellarToOther = async (req, res, next) => {
    try {

        let { cryptoAmount, stellarWithFee, receiverAddress, currencyId } = req.body;
        let amountToTransfer = cryptoAmount;
        let amountToTransferWithFee = stellarWithFee;
        let reeceiverAddress = receiverAddress

        Wallets.findOne({ adminId: req.admin.id, currencyId: currencyId }, async (err, wallet) => {
            if (err) {
                res.status(200).json({ success: false, msg: "Insufficient Balance", type: 'error in finding wallets' });
            }
            else {
                let getBalance;
                let transaction: any;
                let accountFound = 1;
                let quantity = Number(parseFloat(amountToTransfer).toFixed(8));
                let quantitywithFee = parseFloat(amountToTransferWithFee).toFixed(8);

                let adminXLMAddress = wallet.address;
                let adminXLMSecret = wallet.secret;

                let sourceKeys = StellarSdk.Keypair.fromSecret(adminXLMSecret);
                let destinationId = receiverAddress;

                stellarUrl.loadAccount(destinationId).catch((error) => {
                    console.log(error);
                    accountFound = 0;
                }).then(() => {
                    return stellarUrl.loadAccount(sourceKeys.publicKey());
                }).then((sourceAccount) => {
                    getBalance = sourceAccount.balances[0].balance;
                    if (parseFloat(getBalance) > parseFloat(amountToTransfer)) {
                        if (accountFound == 0) {
                            quantity = quantity - parseFloat('1');
                            try {
                                transaction = new StellarSdk.TransactionBuilder(sourceAccount).addOperation(StellarSdk.Operation.createAccount({
                                    destination: destinationId,
                                    startingBalance: '1',
                                })).addOperation(StellarSdk.Operation.payment({
                                    destination: destinationId,
                                    // Because Stellar allows transaction in many currencies, you must
                                    // specify the asset type. The special "native" asset represents Lumens.
                                    asset: StellarSdk.Asset.native(),
                                    amount: quantity.toString(),
                                })).addMemo(StellarSdk.Memo.text('Test Transaction')).setTimeout(30).build();
                                transaction.sign(sourceKeys);
                                return stellarUrl.submitTransaction(transaction);
                            } catch (err) {
                                console.log(err);
                                res.send(err);
                            }
                        }
                        else {
                            try {
                                transaction = new StellarSdk.TransactionBuilder(sourceAccount).addOperation(StellarSdk.Operation.payment({
                                    destination: destinationId,
                                    asset: StellarSdk.Asset.native(),
                                    amount: quantity.toString(),
                                })).addMemo(StellarSdk.Memo.text('Test Transaction')).setTimeout(30).build();
                                transaction.sign(sourceKeys);
                                return stellarUrl.submitTransaction(transaction);
                            } catch (err) {
                                console.log(err);
                                res.send(err);
                            }
                        }
                    }
                    else {
                        res.status(200).json({ success: false, msg: "Insufficient Balance", getBalance: getBalance, amountToTransfer: amountToTransfer });
                    }
                }).then((result) => {
                    if (result) {
                        let getTxHash = result.hash;
                        let details = new SendReceiveTrx({
                            senderAddress: adminXLMAddress,
                            receiverAddress: reeceiverAddress,
                            amount: quantity,
                            txId: getTxHash,
                            adminId: req.admin.id,
                            currencyType: 'XLM',
                            trnxType: 'send',
                        });
                        details.save(async (err, xlmDoc) => {
                            if (err) {
                                res.status(200).json({ success: false, msg: "Insufficient Balance", data: err });
                            }
                            else {
                                res.status(200).json({ success: true, msg: `${quantity} Stellar transfer to the ${receiverAddress}!`, data: result, type: 'XLM transfered to another admin' });
                                await stellarBalance(adminXLMAddress).then(async (stellarBalance: any) => {
                                    await Wallets.findOneAndUpdate({ adminId: req.admin.id, currencyId: currencyId }, { balance: stellarBalance }).then((result) => {
                                        if (result) {
                                            sendReceiveXLMPusher(xlmDoc, stellarBalance, 'send');
                                        }
                                    }).catch((error) => {
                                        console.log(error);
                                    });
                                });
                            }
                        });
                    }
                }).catch((error) => {
                    if (error.response.data) {
                        console.error('Something went wrong!', error.response.data.extras);
                    }
                    else if (error.response) {
                        res.status(200).json({ success: false, msg: "Insufficient Balance", type: 'sending XLM error in response' });
                    }
                });
            }
        });
    } catch (error) {
        console.log(error);
    }
};






export {
    activateAdminStellar,
    adminSendStellarToOther,
}