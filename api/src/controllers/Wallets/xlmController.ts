import { User } from "../../db/models/users/users.model";
import { Wallets } from "../../db/models/Wallets/wallet.model";
import { activateStellerWallet } from "../../services/WalletService/xlm.Service";
import { Fees } from "../../db/models/Wallets/cryptoTrnxFee.model";
import { SendReceiveTrx } from "../../db/models/Wallets/sendReceiveTransaction.model";
import * as cron from 'node-cron';
import { exec } from "child_process";
import * as StellarSdk from 'stellar-sdk';
import { ioSocketss } from "../..";
import { EmailTemplate } from "../../db/models/emailTemplate/emailTemplate.model";
import { sender } from "../../config/config";
import { mailer } from "../../services/UserService/mail.service";

StellarSdk.Network.usePublicNetwork();
let stellarUrl = new StellarSdk.Server("https://horizon.stellar.org");



function isEmpty(obj) {
    for (var key in obj) {
        if (obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

cron.schedule('*/15 * * * * *', () => {
    receiveTransactionStellar();
});

/**
 * activating xlm wallet controller
 * @param userId 
 */
let activateXLM = async (req, res, next) => {
    try {
        let { currencyId, symbol, title } = req.body;
        User.findOne({ _id: req.user.id }, async (err, user) => {
            if (err || user === null) {
                res.status(200).json({ success: false, msg: err, type: 'activate XLM' });
            } else {
                let walletName = `stellar_${user.firstname}_${Date.now()}`;
                let { address, name, secret } = await activateStellerWallet(walletName);
                if (address) {
                    let xlmData = { address: address, account_name: name, secret: secret, status: true };
                    await Wallets.findOneAndUpdate({ currencyId: currencyId, userId: req.user.id }, xlmData, { new: true }).then((result) => {
                        if (result) {
                            res.status(200).json({ success: true, msg: `${result.title} is activated!`, type: 'stellar wallet activated!' });
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
* getting bitcoin cash balance from bode
* @param address 
*/
let stellarBalance = async (address) => {
    return new Promise(async (resolve, reject) => {
        try {
            await stellarUrl.loadAccount(address).then((currentBalance) => {
                currentBalance = JSON.parse(currentBalance.balances[0].balance.toString());
                resolve(currentBalance);
            }).catch((error) => {
                reject(error);
            });
        } catch (error) {
            reject(error);
        }
    });
};



/**
 * transaction fee of stellar
 */
let stellarTransactionFee = async (req, res, next) => {
    try {
        Fees.find((err, fees) => {
            if (err) {
                res.status(200).json({ success: false, msg: err, type: 'stellar fee' });
            } else {
                res.json(fees);
            }
        });
    } catch (error) {
        console.log(error);
    }
};




/** 
 * sending stellar to another user
 */
let sendStellarToOther = async (req, res, next) => {
    try {

        let { cryptoAmount, stellarWithFee, receiverAddress, currencyId } = req.body;
        let amountToTransfer = cryptoAmount;
        let amountToTransferWithFee = stellarWithFee;
        let reeceiverAddress = receiverAddress

        Wallets.findOne({ userId: req.user.id, currencyId: currencyId }, async (err, wallet) => {
            if (err) {
                res.status(200).json({ success: false, msg: "Insufficient Balance", type: 'error in finding wallets' });
            }
            else {
                let getBalance;
                let transaction: any;
                let accountFound = 1;
                let quantity = Number(parseFloat(amountToTransfer).toFixed(8));
                let quantitywithFee = parseFloat(amountToTransferWithFee).toFixed(8);

                let userXLMAddress = wallet.address;
                let userXLMSecret = wallet.secret;

                let sourceKeys = StellarSdk.Keypair.fromSecret(userXLMSecret);
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
                        } else {
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
                            senderAddress: userXLMAddress,
                            receiverAddress: reeceiverAddress,
                            amount: quantity,
                            txId: getTxHash,
                            userId: req.user.id,
                            currencyType: 'XLM',
                            trnxType: 'send',
                        });
                        details.save(async (err, xlmDoc) => {
                            if (err) {
                                res.status(200).json({ success: false, msg: "Insufficient Balance", data: err });
                            }
                            else {
                                res.status(200).json({ success: true, msg: `${quantity} Stellar transfer to the ${receiverAddress}!`, data: result, type: 'XLM transfered to another user' });
                                await stellarBalance(userXLMAddress).then(async (stellarBalance: any) => {
                                    await Wallets.findOneAndUpdate({ userId: req.user.id, currencyId: currencyId }, { balance: stellarBalance }).then((result) => {
                                        if (result) {
                                            ioSocketss.emit(`sendReceive_${req.user.id}`, {symbol: wallet.symbol, transaction: xlmDoc, balance: stellarBalance});
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




/**
 * getting stellar received and send Transactions from node
 */
let receiveTransactionStellar = async () => {
    try {
        Wallets.find({ symbol: 'XLM', status: true }, (err, wallet) => {
            if (err) {
                console.log(err);
            } else {
                for (let i = 0; i < wallet.length; i++) {
                    if (wallet[i].address) {
                        let url = `curl https://horizon.stellar.org/accounts/${wallet[i].address}/transactions`;
                        exec(url, (err, result, stderr) => {
                            if (!err) {
                                let stdout = JSON.parse(result)
                                if (stdout._embedded) {
                                    if (stdout._embedded.records) {
                                        let sendFilter = {};
                                        let receiveFilter = {};


                                        if (wallet[i].userId) {
                                            sendFilter = { userId: wallet[i].userId, currencyType: wallet[i].symbol, };
                                        } else if (wallet[i].adminId) {
                                            sendFilter = { adminId: wallet[i].adminId, currencyType: wallet[i].symbol, }
                                        }

                                        SendReceiveTrx.find(sendFilter, (findSendErr, findSendRes) => {
                                            if (findSendErr) {
                                                throw findSendErr;
                                            } else {
                                                if (stdout._embedded.records.length === findSendRes.length) {
                                                    // console.log(`Incoming send  XLM Trx length : ${stdout._embedded.records.length} and available send XLM Trx length : ${findSendRes.length}`);
                                                } else {
                                                    stdout._embedded.records.forEach(element => {
                                                        let transaction = new StellarSdk.Transaction(element.envelope_xdr);
                                                        // console.log(transaction);
                                                        if (element.source_account === wallet[i].address) {
                                                            // console.log('send');
                                                            transaction.operations.forEach((trx: any) => {
                                                                let transactionDetais = {
                                                                    senderAddress: element.source_account,
                                                                    receiverAddress: trx.destination,
                                                                    amount: trx.type === 'payment' ? trx.amount : trx.startingBalance,
                                                                    txId: element.hash,
                                                                    userId: wallet[i].userId,
                                                                    adminId: wallet[i].adminId,
                                                                    currencyType: 'XLM',
                                                                    trnxType: 'send',
                                                                    trnxFee: element.fee_charged,
                                                                    trnxn_Obj: element,
                                                                    timestamp: element.created_at,
                                                                    TrnxStatus: element.successful ? 'success' : 'pending',
                                                                    createdDate: new Date()
                                                                }
                                                                SendReceiveTrx.findOneAndUpdate({ txId: element.hash, currencyType: 'XLM', trnxType: 'send' }, transactionDetais, { upsert: true, new: true }, (trxerror, txnCheck) => {
                                                                    if (!trxerror) {
                                                                        console.log('send transaction has been saved XLM');
                                                                    }
                                                                    else {
                                                                        console.log(trxerror);
                                                                    }
                                                                })
                                                            });
                                                        } else {
                                                            if (wallet[i].userId) {
                                                                receiveFilter = { txId: element.hash, currencyType: wallet[i].symbol, trnxType: 'receive' };
                                                            } else if (wallet[i].adminId) {
                                                                receiveFilter = { txId: element.hash, currencyType: wallet[i].symbol, trnxType: 'receive' };
                                                            }

                                                            SendReceiveTrx.findOne(receiveFilter, (trxerror, txnCheck) => {
                                                                if (!trxerror) {
                                                                    if (txnCheck) {
                                                                        console.log('this received XLM trx already updated');
                                                                    } else {
                                                                        transaction.operations.forEach((trx: any) => {
                                                                            let transactionDetais = {
                                                                                senderAddress: element.source_account,
                                                                                receiverAddress: trx.destination,
                                                                                amount: trx.type === 'payment' ? trx.amount : trx.startingBalance,
                                                                                txId: element.hash,
                                                                                userId: wallet[i].userId,
                                                                                adminId: wallet[i].adminId,
                                                                                currencyType: 'XLM',
                                                                                trnxType: 'receive',
                                                                                trnxFee: element.fee_charged,
                                                                                trnxn_Obj: element,
                                                                                timestamp: element.created_at,
                                                                                TrnxStatus: element.successful ? 'success' : 'pending',
                                                                            }
                                                                            SendReceiveTrx.create(transactionDetais, async (saveTrxerr, txnSaved) => {
                                                                                if (saveTrxerr) {
                                                                                    console.log(saveTrxerr)
                                                                                } else {
                                                                                    let balanceFilter = {};
                                                                                    let socketFilter = {
                                                                                        id: String
                                                                                    }
                                                                                    if (wallet[i].userId) {
                                                                                        socketFilter.id = wallet[i].userId;
                                                                                        balanceFilter = { symbol: wallet[i].symbol, userId: wallet[i].userId };
                                                                                    } else if (wallet[i].adminId) {
                                                                                        socketFilter.id = wallet[i].adminId;
                                                                                        balanceFilter = { symbol: wallet[i].symbol, adminId: wallet[i].adminId };
                                                                                    }
                                                                                    await stellarBalance(wallet[i].address).then(async (userstellarBalance: any) => {
                                                                                        await Wallets.findOneAndUpdate(balanceFilter, { balance: userstellarBalance }).then(async (result) => {
                                                                                            if (result) {
                                                                                                ioSocketss.emit(`sendReceive_${socketFilter.id}`, {symbol: wallet[i].symbol, transaction: txnSaved, balance: userstellarBalance});
                                                                                                await User.findById(wallet[i].userId).then(async (user) => {
                                                                                                    if (user) {
                                                                                                        let mailOptions;
                                                                                                        await EmailTemplate.findOne({mailType: 'receive-amount'}).then(async (reciveAmount) => {
                                                                                                            if (reciveAmount) {
                                                                                                                let emailHTML;
                                                                                                                let emailSubject;
                                                                                                                if (user.language === 'fa') {
                                                                                                                    emailHTML = reciveAmount.emailBodyFarsi;
                                                                                                                    emailSubject = reciveAmount.subjectFarsi;
                                                                                                                    emailHTML = emailHTML.replace("{user_firstname}", user.firstname);
                                                                                                                    emailHTML = emailHTML.replace("{crypto_title} ", wallet[i].title);
                                                                                                                    emailHTML = emailHTML.replace("{crypto_amount}", transactionDetais.amount);
                                                                                                                    emailHTML = emailHTML.replace("{crypto_symbol}", wallet[i].symbol);
                                                                                                                    mailOptions = {
                                                                                                                        from: sender, // sender address
                                                                                                                        to: user.email, // list of receivers
                                                                                                                        subject: emailSubject, // Subject line
                                                                                                                        html: emailHTML // html body
                                                                                                                    };
                                                                                                                } else {
                                                                                                                    emailHTML = reciveAmount.emailBody;
                                                                                                                    emailSubject = reciveAmount.subject;
                                                                                                                    emailHTML = emailHTML.replace("{user_firstname}", user.firstname);
                                                                                                                    emailHTML = emailHTML.replace("{crypto_title} ", wallet[i].title);
                                                                                                                    emailHTML = emailHTML.replace("{crypto_amount}", transactionDetais.amount);
                                                                                                                    emailHTML = emailHTML.replace("{crypto_symbol}", wallet[i].symbol);
                                                                                                                    mailOptions = {
                                                                                                                        from: sender, // sender address
                                                                                                                        to: user.email, // list of receivers
                                                                                                                        subject: emailSubject, // Subject line
                                                                                                                        html: emailHTML // html body
                                                                                                                    };
                                                                                                                }
                                                                                                                mailer(mailOptions);
                                                                                                            }
                                                                                                        }).catch((error) => {
                                                                                                            console.log(error);
                                                                                                        });
                                                                                                    }
                                                                                                }).catch((error) => {
                                                                                                    console.log(error);
                                                                                                });
                                                                                            }
                                                                                        }).catch((error) => {
                                                                                            console.log(error);
                                                                                        });
                                                                                    }).catch((error) => {
                                                                                        console.log(error);
                                                                                    });

                                                                                }
                                                                            })
                                                                        })
                                                                    }
                                                                } else {
                                                                    console.log(trxerror);
                                                                }
                                                            })
                                                        }
                                                    });
                                                }
                                            }
                                        });

                                    } else {
                                        // console.log('no record found');
                                    }
                                } else {
                                    // console.log('not data found');
                                }
                            } else {
                                console.log('trx errr', err);
                            }
                        });
                    } else {
                        //  console.log('this user has not addresss');
                    }
                }
            }
        })
    } catch (error) {
        console.log(error);
    }
};







export {
    activateXLM,
    stellarTransactionFee,
    sendStellarToOther,
    stellarBalance
}
