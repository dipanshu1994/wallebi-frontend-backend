import { User } from "../../db/models/users/users.model";
import { Wallets } from "../../db/models/Wallets/wallet.model";
import { createMultiSigWallet, getBTCNetworkFee, getBTCBalance, transferBTCAmount, setBTCTxFee, getBTCListTransaction, moveBTCAmount } from "../../services/WalletService/btc.Service";
import { Fees } from "../../db/models/Wallets/cryptoTrnxFee.model";
import * as cron from 'node-cron';
import { SendReceiveTrx } from "../../db/models/Wallets/sendReceiveTransaction.model";
import { sendReceiveBTCPusher } from "../../services/Pusher/pusher";
import { Trade } from "../../db/models/Wallets/trade.model";
import { AdminTradeWallet } from "../../db/models/Wallets/adminTrade.model";
import { UserProfile } from "../../db/models/users/userProfile.model";
import { sendReceiveBTCSocket } from "../../services/Socket/socket.service";
import { userCryptoTradeBalance } from "../../services/WalletService/trade.service";
import { TradeWallet } from "../../db/models/Wallets/trade.wallet.model";
import { ioSocketss } from '../..';
import { EmailTemplate } from "../../db/models/emailTemplate/emailTemplate.model";
import { sender } from "../../config/config";
import { mailer } from "../../services/UserService/mail.service";



function isEmpty(obj) {
    for (var key in obj) {
        if (obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

// running cron in every five minute
cron.schedule('*/15 * * * * *', () => {
    btcTnxFee();
    sendReceiveTransactionBitCoin();

})

/**
 * activating btc wallet controller
 * @param userId 
 * */
let activateBTC = async (req, res, next) => {
    try {
        let { currencyId, symbol, title } = req.body;
        User.findOne({ _id: req.user.id }, async (err, user) => {
            if (err || user === null) {
                res.status(200).json({ success: false, msg: err, type: 'activate BTC' });
            } else {
                let walletName = `bitcoin_${user.firstname}_${Date.now()}`;
                let btcWallet = await createMultiSigWallet(walletName);
                if (btcWallet) {
                    let bitcoinData = { address: btcWallet.address, account_name: walletName, status: true };
                    await Wallets.findOneAndUpdate({ currencyId: currencyId, userId: req.user.id }, bitcoinData, { new: true }).then((result) => {
                        if (result) {
                            res.status(200).json({ success: true, msg: `${result.title} is activated!`, type: 'bitcoin wallet activated!' });
                        }
                    }).catch((error) => {
                        console.log(error);
                        res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'activate BTC' });
                    });
                } else {
                    res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'activate BTC' });
                }
            }
        });
    } catch (error) {
        console.log(error);
    }
};




/**
 * getting network fee of bit coin and saving it to databse
 */
let btcTnxFee = async () => {
    try {
        let fee = await getBTCNetworkFee(6);
        Fees.findOneAndUpdate({ status: true }, { bitCoinFee: fee }, { upsert: true }, (err, result) => {
            if (err) {
                console.log(err);
            } else {
                // console.log('result' + result);
            }
        });
    } catch (error) {
        console.log(error);
    }
};


// getting transaction fee of btc from database
let getBTCTnxFee = async (req, res, next) => {
    try {
        Fees.find((err, fees) => {
            if (err) {
                res.status(200).json({ success: false, msg: err, type: 'bit coin fee' });
            } else {
                res.json(fees);
            }
        });
    } catch (error) {
        console.log(error);
    }
};



/**
 * getting bitcoin balance from bode
 * @param account_name 
 */
let bitcoinBalance = async (account_name) => {
    return new Promise(async (resolve, reject) => {
        try {
            await getBTCBalance(account_name).then((btcBalance) => {
                resolve(btcBalance);
            }).catch((error) => {
                reject(error);
                console.log(error);
            });
        } catch (error) {
            reject(error);
        }
    });
};




/**
 * send btc to another user
 */
let sendBtcToOther = async (req, res) => {
    try {
        let { cryptoAmount, btcWithFee, receiverAddress, currencyId } = req.body;

        let amountToTransfer = cryptoAmount;
        let amountToTransferWithFee = btcWithFee;

        Wallets.findOne({ userId: req.user.id, currencyId: currencyId }, async (err, wallets) => {
            if (err) {
                res.status(200).json({ success: false, msg: err, type: 'sending btc to other user' });
            }
            else {
                let btcquantity = parseFloat(amountToTransfer).toFixed(8);
                let btcquantitywithfee = parseFloat(amountToTransferWithFee).toFixed(8);

                let userBtcAddress = wallets.address;
                let userBtcAccount = wallets.account_name;
                let senderBalance = await getBTCBalance(userBtcAccount);
                let realBalance = senderBalance / 1000000000000000000;
                if (senderBalance < cryptoAmount) {
                    res.status(200).json({ success: false, msg: "Your bitcoin balance is insufficient!", type: 'user balance is insufficient' });
                } else {
                    let result = await transferBTCAmount(userBtcAccount, receiverAddress, btcquantity, 1);
                    if (result) {
                        let details = new SendReceiveTrx({
                            senderAddress: userBtcAddress,
                            receiverAddress: receiverAddress,
                            amount: btcquantity,
                            txId: result.transactionHash,
                            userId: req.user.id,
                            currencyType: 'BTC',
                            trnxType: 'send'
                        });
                        details.save(async (err, btcDoc) => {
                            if (err) {
                                res.status(200).json({ success: false, msg: "Error sending" });
                            } else {
                                res.status(200).json({ success: true, msg: `${amountToTransfer} bitcoin transfer to ${receiverAddress}!` });
                                await bitcoinBalance(userBtcAccount).then(async (bitcoinBalance: any) => {
                                    await Wallets.findOneAndUpdate({ userId: req.user.id, currencyId: currencyId }, { balance: bitcoinBalance }).then((result) => {
                                        if (result) {
                                            let updatedBalance = bitcoinBalance / 1000000000000000000;
                                            ioSocketss.emit(`sendReceive_${req.user.id}`, { symbol: wallets.symbol, transaction: btcDoc, balance: bitcoinBalance });
                                        }
                                    }).catch((error) => {
                                        console.log(error);
                                    });
                                }).catch((error) => {
                                    console.log(error);
                                });
                            }
                        });
                    }
                }
            }
        });
    } catch (error) {
        console.log(error);
    }
};




/**
 * getting bitcoin received and send Transactions from node
 */
let sendReceiveTransactionBitCoin = async () => {
    try {
        Wallets.find({ symbol: 'BTC' }, async (err, wallet) => {
            if (err) {
                console.log(err);
            } else {
                for (let i = 0; i < wallet.length; i++) {
                    if (wallet[i].address) {
                        let tnxRecord = await getBTCListTransaction(wallet[i].account_name, 200);
                        if (isEmpty(tnxRecord)) {
                            console.log('No BTC transactions');
                        } else {

                            let filterSend = {};
                            let filterReceive = {};

                            tnxRecord.forEach(element => {
                                if (wallet[i].userId) {
                                    filterReceive = { txId: element.txid, currencyType: "BTC", userId: wallet[i].userId, trnxType: "receive" };
                                    filterSend = { txId: element.txid, currencyType: "BTC", userId: wallet[i].userId, trnxType: "send" };

                                } else if (wallet[i].adminId) {
                                    filterReceive = { txId: element.txid, currencyType: "BTC", adminId: wallet[i].adminId, trnxType: "receive" };
                                    filterSend = { txId: element.txid, currencyType: "BTC", adminId: wallet[i].adminId, trnxType: "send" };
                                }
                                if (element.category === 'receive') {
                                    SendReceiveTrx.findOne(filterReceive).then((foundReceivedTransaction) => {
                                        if (!foundReceivedTransaction) {
                                            let newReceived = new SendReceiveTrx({
                                                receiverAddress: wallet[i].address,
                                                amount: element.amount,
                                                txId: element.txid,
                                                userId: wallet[i].userId,
                                                adminId: wallet[i].adminId,
                                                currencyType: "BTC",
                                                trnxType: "receive",
                                                trnxn_Obj: element,
                                                timestamp: element.timereceived * 1000,
                                                TrnxStatus: 'success',
                                            });
                                            newReceived.save(async (err, recievedSaved) => {
                                                if (err) {
                                                    console.log(err);
                                                } else {
                                                    let balanceFilter = {};
                                                    let socketFilter = {
                                                        id: String
                                                    };
                                                    if (wallet[i].userId) {
                                                        socketFilter.id = wallet[i].userId;
                                                        balanceFilter = { symbol: 'BTC', userId: wallet[i].userId };
                                                    } else if (wallet[i].adminId) {
                                                        socketFilter.id = wallet[i].adminId;
                                                        balanceFilter = { symbol: 'BTC', adminId: wallet[i].adminId };
                                                    }
                                                    await bitcoinBalance(wallet[i].account_name).then(async (bitcoinBalance: any) => {
                                                        await Wallets.findOneAndUpdate(balanceFilter, { balance: bitcoinBalance }).then(async (result) => {
                                                            if (result) {
                                                                let updatedBalance = bitcoinBalance / 1000000000000000000;
                                                                ioSocketss.emit(`sendReceive_${socketFilter.id}`, { symbol: wallet[i].symbol, transaction: recievedSaved, balance: bitcoinBalance });
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
                                                                                    emailHTML = emailHTML.replace("{crypto_amount}", newReceived.amount);
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
                                                                                    emailHTML = emailHTML.replace("{crypto_amount}", newReceived.amount);
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
                                        }
                                    });

                                } else if (element.category === 'send') {

                                    SendReceiveTrx.findOne(filterSend).then((foundTransaction) => {
                                        if (foundTransaction) {
                                            if (foundTransaction.TrnxStatus === "pending") {
                                                foundTransaction.txId = element.txid;
                                                foundTransaction.trnxFee = (element.fee * -1);
                                                foundTransaction.trnxn_Obj = element;
                                                foundTransaction.timestamp = element.timereceived * 1000;
                                                foundTransaction.TrnxStatus = element.abandoned === false ? 'success' : 'cancel';

                                                foundTransaction.save().then((result) => {
                                                    if (result) {
                                                        console.log('Transaction updated succesfully!');
                                                    }
                                                });
                                            } else {
                                                console.log('Bitcoin Transaction is already Updated');
                                            }
                                        } else {
                                            let newSend = new SendReceiveTrx({
                                                senderAddress: wallet[i].address,
                                                receiverAddress: element.address,
                                                amount: (element.amount * -1),
                                                txId: element.txid,
                                                userId: wallet[i].userId,
                                                adminId: wallet[i].adminId,
                                                currencyType: "BTC",
                                                trnxFee: (element.fee * -1),
                                                trnxType: "send",
                                                trnxn_Obj: element,
                                                timestamp: element.timereceived * 1000,
                                                TrnxStatus: element.abandoned === false ? 'success' : 'cancel',
                                            });
                                            newSend.save().then(async (result) => {
                                                if (result) {
                                                    console.log('Transaction created succesfully!');
                                                    let balance = await getBTCBalance(wallet[i].account_name);
                                                    let updatedBalance = balance / 1000000000000000000;
                                                    sendReceiveBTCPusher(result, updatedBalance, 'send');
                                                }
                                            });
                                        }
                                    });

                                }
                            });
                        }
                    } else {
                        console.log('bitcoin is not defined');
                    }
                }
            }
        });
    } catch (error) {
        console.log(error);
    }
};




/**
 * topup bitcoin from user personal account to trade account and transfer it to admin account
 */
let transferBitcoinForTrade = async (req, res, next) => {
    try {
        let { topUpamount, cryptoValueInEuro, cryptoCurrentPrice, transactionFee, currencyId } = req.body;
        let { id } = req.user;
        await Wallets.findOne({ userId: id, currencyId: currencyId, status: true }).then(async (wallets) => {
            if (wallets.account_name) {
                await bitcoinBalance(wallets.account_name).then(async (userBitcoinBalance) => {
                    if (topUpamount > userBitcoinBalance) {
                        res.status(200).json({ success: false, msg: "Your Bitcoin balance is insufficent!", type: 'balance is not sufficent' });
                    } else {
                        await Wallets.findOne({ currencyId: currencyId, walletType: 'admin', status: true }).then(async (adminBitcoinWallet) => {
                            await transferBTCAmount(wallets.account_name, adminBitcoinWallet.account_name, topUpamount, 1).then((result) => {
                                if (result) {
                                    // add balance to User trade wallet start		
                                    let addToUserTradeWallet = new Trade({
                                        userId: id,
                                        cryptoAmount: topUpamount,
                                        euroAmount: cryptoValueInEuro,
                                        cryptoCurrentPrice: cryptoCurrentPrice,
                                        cryptoType: 'BTC',
                                        txType: 'privateWallet',
                                        txId: result.transactionHash,
                                        type: 'credit',
                                        status: "completed"
                                    });
                                    addToUserTradeWallet.save(async (err, sendDoc) => {
                                        if (err) {
                                            res.status(200).json({ success: false, msg: err, type: 'error in saving' })
                                        } else {
                                            let details = new SendReceiveTrx({
                                                senderAddress: wallets.address,
                                                receiverAddress: adminBitcoinWallet.address,
                                                amount: topUpamount,
                                                txId: result.transactionHash,
                                                userId: id,
                                                currencyType: 'BTC',
                                                trnxType: 'send',
                                                tradeId: addToUserTradeWallet._id
                                            });
                                            details.save(async (err, btcTransfer) => {
                                                if (err) {
                                                    res.status(200).json({ success: false, msg: err, type: 'error in saving' })
                                                } else {
                                                    await userCryptoTradeBalance(id, 'BTC').then(async (userBitcoinBalance) => {
                                                        await TradeWallet.findOneAndUpdate({ userId: id, currencyId: currencyId }, { balance: userBitcoinBalance }).then(async (result) => {
                                                            await bitcoinBalance(wallets.account_name).then(async (bitcoinBalance: any) => {
                                                                await Wallets.findOneAndUpdate({ userId: req.user.id, currencyId: currencyId }, { balance: bitcoinBalance }).then((result) => {
                                                                    if (result) {
                                                                        res.status(200).json({ success: true, msg: `${topUpamount} bitcoin added to your trade wallet` });
                                                                        ioSocketss.emit(`sendReceiveTrade_${id}`, { symbol: wallets.symbol, transaction: sendDoc, balance: userBitcoinBalance });
                                                                        ioSocketss.emit(`sendReceive_${req.user.id}`, { symbol: wallets.symbol, transaction: btcTransfer, balance: bitcoinBalance });
                                                                    }
                                                                }).catch((error) => {
                                                                    res.status(200).json({ success: false, msg: error, type: 'error in saving' })
                                                                });
                                                            }).catch((error) => {
                                                                res.status(200).json({ success: false, msg: error, type: 'error in saving' })
                                                            });
                                                            
                                                        }).catch((error) => {
                                                            res.status(200).json({ success: false, msg: error, type: 'error in saving' })
                                                        });
                                                    }).catch((error) => {
                                                        res.status(200).json({ success: false, msg: error, type: 'error in saving' })
                                                    });
                                                }
                                            });
                                        }
                                    });


                                    // add to admin Trade wallet
                                    let addToAdminTradeWallet = new AdminTradeWallet({
                                        userId: id,
                                        tradeId: addToUserTradeWallet.id,
                                        cryptoAmount: topUpamount,
                                        cryptoType: 'BTC',
                                        txType: 'userPrivateWallet',
                                        txId: result,
                                        type: 'credit',
                                        status: "completed"
                                    });
                                    addToAdminTradeWallet.save((err) => {
                                        if (err) {
                                            res.status(200).json({ success: false, msg: err, type: 'error in saving' })
                                        } else {
                                            //res.status(200).json({ success: true, msg: "Amount transferred" });
                                        }
                                    });
                                }
                            }).catch((error) => {
                                res.status(200).json({ success: false, msg: error, type: 'error in saving' })
                            });
                        }).catch((error) => {
                            res.status(200).json({ success: false, msg: error, type: 'error in saving' });
                        });
                    }
                }).catch((error) => {
                    res.status(200).json({ success: false, msg: error, type: 'error in saving' })
                });
            } else {
                res.status(200).json({ success: false, msg: 'something went wrong!', type: 'error in saving' })
            }
        }).catch((error) => {
            res.status(200).json({ success: false, msg: error, type: 'error in saving' })
        });

    } catch (error) {
        res.status(200).json({ success: false, msg: error, type: 'error in saving' })
    }
};


/**
 * withdraw amount from trade account to personal account 
 */
let withdrawalBitcoinFromTrade = async (req, res, next) => {
    let { id } = req.user;

    let { coinType, withdrawAmount, withdrawAmountInEuro, cryptoCurrentPrice, cryptoTransactionFee, verifyCode, currencyId } = req.body;

    let amoutToTransferWithFee = parseFloat(withdrawAmount) + parseFloat(cryptoTransactionFee);

    await UserProfile.findOne({ userId: id }).then(async (user) => {
        if (user) {
            if (user.smscode === verifyCode) {
                await userCryptoTradeBalance(id, 'BTC').then((bitcoinTradeResult) => {
                    if (withdrawAmount > bitcoinTradeResult) {
                        res.status(200).json({ success: false, msg: "Your Bitcoin trade balance is insufficient!", langid: "btcfail" });
                    } else {
                        let deductFromUserTradeWallet = new Trade({
                            userId: id,
                            cryptoAmount: -withdrawAmount,
                            euroAmount: withdrawAmountInEuro,
                            cryptoCurrentPrice: cryptoCurrentPrice,
                            cryptoType: 'BTC',
                            txType: 'privateWallet',
                            withdrawalAmount: parseFloat(withdrawAmount).toFixed(8),
                            // withdrawalFee: parseFloat(cryptoTransactionFee).toFixed(8),
                            withdrawalStatus: "pending",
                            type: 'debit',
                            status: "completed"
                        });
                        deductFromUserTradeWallet.save(async (err, withdrawDoc) => {
                            if (err) {
                                res.status(200).json({ success: false, msg: err, type: 'error in saving ' });
                            } else {
                                await userCryptoTradeBalance(id, 'BTC').then(async (userBitcoinBalance) => {
                                    await TradeWallet.findOneAndUpdate({ userId: id, currencyId: currencyId }, { balance: userBitcoinBalance }).then((result) => {
                                        ioSocketss.emit(`sendReceiveTrade_${id}`, { symbol: 'BTC', transaction: withdrawDoc, balance: userBitcoinBalance });
                                        res.status(200).json({ success: true, msg: "Withdrawal Request Generated!", type: "withdrawalsuccess" });
                                    }).catch((error) => {
                                        res.status(200).json({ success: false, msg: error, type: 'error in saving' })
                                    });
                                }).catch((error) => {
                                    res.status(200).json({ success: false, msg: error, type: 'error in saving' })
                                });
                            }
                        });
                    }
                }).catch((error) => {
                    console.log(error);
                });
            } else {
                res.status(200).json({ success: false, msg: 'Your code in invalid!', type: 'code invalid' });
            }
        }
    }).catch((error) => {
        console.log(error);
    });

};


/**
 * topup bitcoin from admin personal account to user personal account
 */
let transferBitcoinFromAdminToUser = async (req, res, next) => {
    try {
        let { cryptoAmount, cryptoType, userId, recordId } = req.body;
        let { id } = req.admin;

        await Wallets.findOne({ adminId: id, symbol: cryptoType, walletType: 'admin', status: true }).then(async (wallets) => {
            if (wallets) {
                if (cryptoAmount > wallets.balance) {
                    res.status(200).json({ success: false, msg: "Your Bitcoin balance is insufficent!", type: 'balance is not sufficent' });
                } else {
                    await Wallets.findOne({ userId: userId, symbol: cryptoType, walletType: "user", status: true }).then(async (userwallets) => {
                        await transferBTCAmount(wallets.account_name, userwallets.address, cryptoAmount, 1).then((result) => {
                            if (result) {
                                let details = new SendReceiveTrx({
                                    senderAddress: wallets.address,
                                    receiverAddress: userwallets.address,
                                    amount: cryptoAmount,
                                    txId: result.transactionHash,
                                    adminId: id,
                                    currencyType: cryptoType,
                                    trnxType: 'send',
                                    tradeId: recordId
                                });
                                details.save(async (err, btcDoc) => {
                                    if (err) {
                                        res.status(200).json({ success: false, msg: "Error sending" });
                                    } else {
                                        await bitcoinBalance(wallets.account_name).then(async (bitcoinBalance: any) => {
                                            await Wallets.findOneAndUpdate({ adminId: id, symbol: cryptoType }, { balance: bitcoinBalance }).then((result) => {
                                                if (result) {
                                                    Trade.findByIdAndUpdate(recordId, { withdrawalStatus: 'completed' }, (err, result) => {
                                                        if (err) {
                                                            res.status(200).json({ success: false, msg: err, type: 'error' });
                                                        } else {
                                                            ioSocketss.emit(`sendReceive_${req.admin.id}`, { symbol: wallets.symbol, transaction: btcDoc, balance: bitcoinBalance });
                                                            res.status(200).json({ success: true, msg: `${cryptoAmount} ${cryptoType} transfer to the user!`, type: 'send BTC' });
                                                        }
                                                    });
                                                }
                                            }).catch((error) => {
                                                res.status(200).json({ success: false, msg: error, type: 'error in saving' })
                                            });
                                        }).catch((error) => {
                                            res.status(200).json({ success: false, msg: error, type: 'error in saving' })
                                        });

                                    }
                                });
                            }
                        }).catch((error) => {
                            res.status(200).json({ success: false, msg: error, type: 'error in saving' })
                        });
                    }).catch((error) => {
                        res.status(200).json({ success: false, msg: error, type: 'error in saving' })
                    });
                }
            }
        }).catch((error) => {
            res.status(200).json({ success: false, msg: error, type: 'error in admin wallets' })
        });

    } catch (error) {
        res.status(200).json({ success: false, msg: error, type: 'error in saving' })
    }
};





export {
    activateBTC,
    getBTCTnxFee,
    sendBtcToOther,
    transferBitcoinForTrade,
    withdrawalBitcoinFromTrade,
    bitcoinBalance,
    transferBitcoinFromAdminToUser
}
