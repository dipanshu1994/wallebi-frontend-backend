import { User } from "../../db/models/users/users.model";
import { RippleAPI } from "ripple-lib";
import { Wallets } from "../../db/models/Wallets/wallet.model";
import { SendReceiveTrx } from "../../db/models/Wallets/sendReceiveTransaction.model";
import * as cron from 'node-cron';
import { Fees } from "../../db/models/Wallets/cryptoTrnxFee.model";
import * as request from 'request';
import { ioSocketss } from "../..";
import { EmailTemplate } from "../../db/models/emailTemplate/emailTemplate.model";
import { sender } from "../../config/config";
import { mailer } from "../../services/UserService/mail.service";

let liveServer = 'wss://r.ripple.com';
// let liveServer = 'wss://s.altnet.rippletest.net:51233'
let api = new RippleAPI({
    server: liveServer
});



// running cron in every five minute
cron.schedule('*/15 * * * * *', () => {
    rippleTnxFee();
    receiveTransactionRipple();
});



function isEmpty(obj) {
    for (var key in obj) {
        if (obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

/**
 * activating ripple wallet controller
 * @param userId 
 */
let activateXRP = async (req, res, next) => {
    try {
        let { currencyId, symbol, title } = req.body;
        User.findOne({ _id: req.user.id }, async (err, user) => {
            if (err || user === null) {
                res.status(200).json({ success: false, msg: err, type: 'activate XRP' });
            } else {
                let walletName = `ripple_${user.firstname}_${Date.now()}`;
                await api.connect();
                let addressInfo = await api.generateAddress();
                if (addressInfo) {
                    let accountAddress = addressInfo.address;
                    let accountSecret = addressInfo.secret;
                    let xrpData = { address: accountAddress, account_name: walletName, secret: accountSecret, status: true };
                    await Wallets.findOneAndUpdate({ currencyId: currencyId, userId: req.user.id }, xrpData, { new: true }).then((result) => {
                        if (result) {
                            res.status(200).json({ success: true, msg: `${result.title} is activated!`, type: 'ripple wallet activated!' });
                        }
                    }).catch((error) => {
                        console.log(error);
                        res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'activate XRP' });
                    });
                } else {
                    res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'activate XRP' });
                }
            }
        });
    } catch (error) {
        console.log(error);
    }
};



/**
 * transaction fee of ripple
 */
let rippleTnxFee = async () => {
    try {
        await api.connect();
        let fee = await api.getFee();
        Fees.findOneAndUpdate({ status: true }, { rippleFee: fee }, { upsert: true }, (err, result) => {
            if (err) {
                console.log(err);
            } else {
                // console.log('result' + result);
            }
        });
    } catch (error) {
        console.log(error);
    }
}


/**
* transaction fee of ripple
*/
let rippleTransactionFee = async (req, res, next) => {
    try {
        Fees.find((err, fees) => {
            if (err) {
                res.status(200).json({ success: false, msg: err, type: 'ripple fee' });
            } else {
                res.json(fees);
            }
        });
    } catch (error) {
        console.log(error);
    }
};




/**
* getting ripple balance from bode
* @param address 
*/
let rippleBalance = async (address) => {
    return new Promise(async (resolve, reject) => {
        try {
            api.connect().then(async () => {
                await api.getBalances(address, { currency: "XRP" }).then((rippleBalance) => {
                    resolve(rippleBalance[0].value)
                }).catch((error) => {
                    reject(error);
                });
            }).catch((error) => {
                reject(error);
            });
        } catch (error) {
            reject(error);
        }
    });
};




/** 
 * sending xrp to another user
 */
let sendRippleToOther = function (req, res) {
    try {
        let { cryptoAmount, rippleWithFee, currencyId, receiverAddress } = req.body;
        let amountToTransfer = cryptoAmount;
        let amountToTransferWithFee = rippleWithFee;

        Wallets.findOne({ userId: req.user.id, currencyId: currencyId }, async (err, wallets) => {
            if (err) {
                res.status(200).json({ success: false, msg: err, type: 'sending ripple to another user' });
            } else {
                let userXrpAddress = wallets.address;
                let userXrpSecret = wallets.secret;

                const senderAddress = userXrpAddress;
                const senderSecret = userXrpSecret;


                const instructions = { maxLedgerVersionOffset: 5 }
                const currency = 'XRP';
                const amount = amountToTransfer;

                const payment = {
                    source: {
                        address: senderAddress,
                        maxAmount: {
                            value: amount.toString(),
                            currency: currency
                        }
                    },
                    destination: {
                        address: receiverAddress,
                        amount: {
                            value: amount.toString(),
                            currency: currency
                        }
                    }
                }
                api.connect().then(() => {
                    api.getBalances(senderAddress, { currency: "XRP" }).then(balances => {
                        let senderBalance = balances[0].value;
                        if (senderBalance < amountToTransfer) {
                            res.status(200).json({ success: false, msg: "Your ripple balance is insufficient!", type: 'sending XRP to another user' });
                        } else {
                            api.preparePayment(senderAddress, payment, instructions).then(prepared => {
                                const { signedTransaction, id } = api.sign(prepared.txJSON, senderSecret)
                                api.submit(signedTransaction).then((result: any) => {
                                    let details = {
                                        receiverAddress: receiverAddress,
                                        senderAddress: userXrpAddress,
                                        amount: amountToTransfer,
                                        txId: result.tx_json.hash,
                                        userId: req.user.id,
                                        currencyType: 'XRP',
                                        trnxType: 'send',
                                        trnxFee: result.tx_json.Fee,
                                        trnxn_Obj: result,
                                        TrnxStatus: result.tx_json.Flags > 0 ? 'success' : 'pending',
                                    };
                                    SendReceiveTrx.create(details, async (err, Xrpdoc) => {
                                        if (err) {
                                            res.status(200).json({ success: false, msg: "Insufficient Balance", type: 'data not save' });
                                        } else {
                                            res.status(200).json({ success: true, msg: `${amountToTransfer} transfer to the ${req.body.receiverAddress}`, type: 'sending XRP to another user' });
                                            await rippleBalance(userXrpAddress).then(async (rippleBalance: any) => {
                                                await Wallets.findOneAndUpdate({ userId: req.user.id, currencyId: currencyId }, { balance: rippleBalance }).then((result) => {
                                                    if (result) {
                                                        ioSocketss.emit(`sendReceive_${req.user.id}`, {symbol: wallets.symbol, transaction: Xrpdoc, balance: rippleBalance});
                                                    }
                                                }).catch((error) => {
                                                    res.status(200).json({success: false, msg: 'Error in updating balance', type: 'ripple balance'});
                                                });
                                            });
                                        }
                                    });
                                }).catch((e) => {
                                    res.status(200).json({ success: false, msg: "Insufficient Balance", type: 'submit catch', err: e });
                                });
                            }).catch((e) => {
                                res.status(200).json({ success: false, msg: "Insufficient Balance", type: 'prepare catch', err: e });
                            });
                        }
                        
                    }).catch((e) => {
                        res.status(200).json({ success: false, msg: "Insufficient Balance", type: 'invalid account' });
                    });
                }).catch((e) => {
                    res.status(200).json({ success: false, msg: "Insufficient Balance", type: ' aa invalid account', err: e });
                });
            }
        });
    } catch (error) {
        console.log(error);
    }
}


/**
 * getting ripple received and send Transactions from node
 */
let receiveTransactionRipple = async () => {
    Wallets.find({ symbol: 'XRP' }, (err, wallet) => {
        if (err) {
            console.log(err);
        } else {
            for (let i = 0; i < wallet.length; i++) {
                if (wallet[i].address) {
                    let options = {
                        method: 'GET',
                        url: `https://data.ripple.com/v2/accounts/${wallet[i].address}/transactions`,
                        qs: { type: 'Payment', result: 'tesSUCCESS', limit: 10000000 },
                        headers: { 'Postman-Token': 'd4aa52e3-50ce-4b9f-9c1d-4bcd0de3a28e', 'cache-control': 'no-cache', },
                        json: true
                    };
                    request(options, (error, response, body) => {
                        if (error) console.log(error);
                        else {
                            try {
                                var responsData = body.transactions// JSON.parse(body).transactions;
                            } catch (jsonerr) {
                                console.log(jsonerr);
                            }

                            if (isEmpty(responsData)) {
                                console.log(`XRP response data is empty  ${responsData}`);
                            } else {


                                let filterSend = {};
                                let filterReceive = {};

                                let XrpRecivedTrx = responsData.filter((val) => val.tx.Destination === wallet[i].address);
                                let XrpSendTrx = responsData.filter((val) => val.tx.Account === wallet[i].address);

                                if (wallet[i].userId) {
                                    filterSend = { userId: wallet[i].userId, currencyType: 'XRP', trnxType: 'send' };
                                    filterReceive = { userId: wallet[i].userId, currencyType: 'XRP', trnxType: 'recieved' }
                                } else if (wallet[i].adminId) {
                                    filterSend = { adminId: wallet[i].adminId, currencyType: 'XRP', trnxType: 'send' };
                                    filterReceive = { adminId: wallet[i].adminId, currencyType: 'XRP', trnxType: 'recieved' }
                                }

                                SendReceiveTrx.find(filterSend, (findSendErr, findSendRes) => {
                                    if (findSendErr) {
                                        console.log(findSendErr);
                                    } else {
                                        if (XrpSendTrx.length === findSendRes.length) {
                                            // console.log(`Incoming send Trx length : ${XrpSendTrx.length} and available send Trx length : ${findSendRes.length}`);
                                        } else {
                                            XrpSendTrx.forEach(element => {
                                                SendReceiveTrx.findOne({ txId: element.hash, currencyType: 'XRP', trnxType: 'send' }, (trxerror, txnCheck) => {
                                                    if (!trxerror) {
                                                        if (txnCheck == null) {
                                                            let receivetransaction = {
                                                                senderAddress: element.tx.Account,
                                                                receiverAddress: element.tx.Destination,
                                                                amount: parseFloat(element.tx.Amount) / 1000000,
                                                                txId: element.hash,
                                                                userId: wallet[i].userId,
                                                                adminId: wallet[i].adminId,
                                                                currencyType: 'XRP',
                                                                trnxType: 'send',
                                                                trnxFee: parseFloat(element.tx.Fee) / 1000000,
                                                                trnxn_Obj: element,
                                                                timestamp: element.date,
                                                                TrnxStatus: element.tx.Flags > 0 ? 'success' : 'pending',
                                                            }
                                                            SendReceiveTrx.create(receivetransaction, async (saveTrxerr, txnSaved) => {

                                                                if (!saveTrxerr) {
                                                                    console.log('XRP send record saved successfully !');
                                                                    await api.connect();
                                                                    const addressBalancec = await api.getBalances(txnSaved.receiverAddress, { currency: "XRP" });
                                                                    // sendReceiveXRPPusher(txnSaved, addressBalancec[0].value, 'send');
                                                                } else { console.log("error in sendrecivetrxes.create send XRP") }
                                                            });
                                                        } else {
                                                            // console.log('this send transaction is already exist');
                                                        }
                                                    } else {
                                                        console.log(trxerror)
                                                    }
                                                })
                                            });
                                        }
                                    }
                                });



                                SendReceiveTrx.find(filterReceive, (fndTrxErr, fndTrxRes) => {
                                    if (fndTrxErr) {
                                        throw fndTrxErr;
                                    } else {
                                        if (XrpRecivedTrx.length === fndTrxRes.length) {
                                            // console.log(`Incoming Trx length : ${XrpRecivedTrx.length} and available Trx length : ${fndTrxRes.length}`);
                                        }
                                        else {
                                            XrpRecivedTrx.forEach(element => {
                                                SendReceiveTrx.findOne({ txId: element.hash, currencyType: 'XRP', trnxType: 'receive' }, (trxerror, txnCheck) => {
                                                    if (!trxerror) {
                                                        if (txnCheck == null) {
                                                            let receivetransaction = {
                                                                senderAddress: element.tx.Account,
                                                                receiverAddress: element.tx.Destination,
                                                                amount: parseFloat(element.tx.Amount) / 1000000,
                                                                txId: element.hash,
                                                                userId: wallet[i].userId,
                                                                adminId: wallet[i].adminId,
                                                                currencyType: 'XRP',
                                                                trnxType: 'receive',
                                                                trnxFee: parseFloat(element.tx.Fee) / 1000000,
                                                                trnxn_Obj: element,
                                                                timestamp: element.date,
                                                                TrnxStatus: element.tx.Flags > 0 ? 'success' : 'pending',
                                                            }
                                                            SendReceiveTrx.create(receivetransaction, async (saveTrxerr, txnSaved) => {
                                                                if (saveTrxerr) {
                                                                    console.log("error in sendrecivetrxes.create receive XRP");
                                                                } else {
                                                                    let balanceFilter = {};
                                                                    let socketFilter = {
                                                                        id: String
                                                                    };
                                                                    if (wallet[i].userId) {
                                                                        socketFilter.id = wallet[i].userId;
                                                                        balanceFilter = { symbol: 'XRP', userId: wallet[i].userId };
                                                                    } else if (wallet[i].adminId) {
                                                                        socketFilter.id = wallet[i].adminId;
                                                                        balanceFilter = { symbol: 'XRP', adminId: wallet[i].adminId };
                                                                    }
                                                                    await rippleBalance(wallet[i].address).then(async (rippleBalance: any) => {
                                                                        await Wallets.findOneAndUpdate(balanceFilter, { balance: rippleBalance }).then(async (result) => {
                                                                            if (result) {
                                                                                ioSocketss.emit(`sendReceive_${socketFilter.id}`, {symbol: wallet[i].symbol, transaction: txnSaved, balance: rippleBalance});
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
                                                                                                    emailHTML = emailHTML.replace("{crypto_amount}", receivetransaction.amount);
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
                                                                                                    emailHTML = emailHTML.replace("{crypto_amount}", receivetransaction.amount);
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
                                                            });
                                                        } else {
                                                            // console.log('this transaction is already exist');
                                                        }
                                                    } else {
                                                        throw trxerror
                                                    }
                                                })
                                            });
                                        }
                                    }
                                });

                            }
                        }
                    });
                } else {
                    console.log('Addres not Activated');
                }
            }
        }
    });
};





export {
    activateXRP,
    rippleTransactionFee,
    sendRippleToOther,
    rippleBalance
}