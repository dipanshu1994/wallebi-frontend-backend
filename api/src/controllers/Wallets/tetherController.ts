import { User } from "../../db/models/users/users.model";
import { createMultiSigWallet, getTetherBalance, transferTetherAmount, setTxFee, getTetherNetworkFee, getUSDTListTransaction, getUSDTTransaction } from "../../services/WalletService/ominiUSDT.service";
import { Wallets } from "../../db/models/Wallets/wallet.model";
import { SendReceiveTrx } from "../../db/models/Wallets/sendReceiveTransaction.model";
import { Fees } from "../../db/models/Wallets/cryptoTrnxFee.model";
import * as cron from 'node-cron';
import { Trade } from "../../db/models/Wallets/trade.model";
import { AdminTradeWallet } from "../../db/models/Wallets/adminTrade.model";
import { UserProfile } from "../../db/models/users/userProfile.model";
import { userCryptoTradeBalance } from "../../services/WalletService/trade.service";
import { TradeWallet } from "../../db/models/Wallets/trade.wallet.model";
import { ioSocketss } from "../..";
import { EmailTemplate } from "../../db/models/emailTemplate/emailTemplate.model";
import { sender } from "../../config/config";
import { mailer } from "../../services/UserService/mail.service";


cron.schedule('*/15 * * * * *', () => {
    tetherTnxFee();
    getSendReceiveTransactionTether();
});


function isEmpty(obj) {
    for (var key in obj) {
        if (obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

/**
 * activating USDT wallet controller
 * @param userId 
 * */
let activateTether = async (req, res, next) => {
    try {
        let { currencyId, symbol, title } = req.body;
        User.findOne({ _id: req.user.id }, async (err, user) => {
            if (err || user === null) {
                res.status(200).json({ success: false, msg: err, type: 'activate USDT' });
            } else {
                let omniusdtWalletPassword = `omniusdt_${user.firstname}_${Date.now()}`;
                let omniusdtWallet = await createMultiSigWallet(omniusdtWalletPassword);
                if (omniusdtWallet) {
                    let omniusdtData = { address: omniusdtWallet, account_name: omniusdtWalletPassword, status: true };
                    await Wallets.findOneAndUpdate({ currencyId: currencyId, userId: req.user.id }, omniusdtData, { new: true }).then((result) => {
                        if (result) {
                            res.status(200).json({ success: true, msg: `${result.title} is activated!`, type: 'tether wallet activated!' });
                        }
                    }).catch((error) => {
                        console.log(error);
                        res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'activate USDT' });
                    });
                } else {
                    res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'activate USDT' });
                }
            }
        });
    } catch (error) {
        console.log(error);
    }
};




/**
 * getting tether balance from node
 * @param address 
 */
let userTetherBalance = async (account_name) => {
    return new Promise(async (resolve, reject) => {
        try {
            await getTetherBalance(account_name).then((usdtBalance) => {
                // console.log('user Tether Balance', usdtBalance)
                resolve(usdtBalance);
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
 * getting and saving transaction fee of tether
 */
let tetherTnxFee = async () => {
    try {
        let fee = await getTetherNetworkFee(6);
        Fees.findOneAndUpdate({ status: true }, { tetherFee: fee }, { upsert: true }, (err, result) => {
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
* getting transaction fee from db of tether
*/
let tetherTransactionFee = async (req, res, next) => {
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
 * send usdt to another user
 */
let sendUsdtToOther = async (req, res) => {
    try {
        let { cryptoAmount, usdtWithFee, receiverAddress, usdtToEuro, currencyId } = req.body;
        let amountToTransfer = cryptoAmount;
        let amountToTransferWithFee = usdtWithFee;
        Wallets.findOne({ userId: req.user.id, currencyId: currencyId }, async (err, wallet) => {
            if (err) {
                res.status(200).json({ success: false, msg: "Insufficient Balance" });
            }
            else {
                let usdtquantity = parseFloat(amountToTransfer).toFixed(8);
                let usdtquantitywithfee = parseFloat(amountToTransferWithFee).toFixed(8);
                let userTetherAddress = wallet.address;
                let userTetherAccount = wallet.account_name;
                let senderBalance: any = await getTetherBalance(userTetherAddress);
                senderBalance = senderBalance.balance;
                if (senderBalance < usdtquantity) {
                    res.status(200).json({ success: false, msg: "Your tether balance is insufficient!" });
                } else {
                    let setTransactionFee = await setTxFee(0.00000001);
                    let result = await transferTetherAmount(userTetherAccount, receiverAddress, usdtquantity, 1);
                    if (result) {
                        let details = new SendReceiveTrx({
                            senderAddress: userTetherAddress,
                            receiverAddress: receiverAddress,
                            amount: usdtquantity,
                            txId: result.transactionHash,
                            userId: req.user.id,
                            currencyType: 'USDT',
                            trnxType: 'send'
                        });
                        details.save(async (err, usdtDoc) => {
                            if (err) {
                                res.status(200).json({ success: false, msg: err });
                            } else {
                                res.status(200).json({ status: true, msg: `${usdtquantity} USDT transferred to ${receiverAddress}` });
                                await userTetherBalance(userTetherAddress).then(async (userTetherBalance: any) => {
                                    await Wallets.findOneAndUpdate({ userId: req.user.id, currencyId: currencyId }, { balance: userTetherBalance.balance }).then((result) => {
                                        if (result) {
                                            ioSocketss.emit(`sendReceive_${req.user.id}`, { symbol: wallet.symbol, transaction: usdtDoc, balance: userTetherBalance.balance });
                                        }
                                    }).catch((error) => {
                                        res.status(200).json({ success: false, msg: error });
                                    });
                                }).catch((error) => {
                                    res.status(200).json({ success: false, msg: error });
                                });
                            }
                        });
                    }
                }
            }
        });
    } catch (error) {
        res.status(200).json({ success: false, msg: error });
    }
}





/**
 * create USDT leadger of send receive
 */
let getSendReceiveTransactionTether = async () => {
    try {
        let txnRecords;
        Wallets.find({ symbol: 'USDT' }, async (err, wallet) => {
            if (err) {
                console.log(err);
            } else {
                if (wallet) {
                    for (let i = 0; i < wallet.length; i++) {
                        if (wallet[i].address) {
                            txnRecords = await getUSDTListTransaction(wallet[i].address, 2000);
                            if (isEmpty(txnRecords)) {
                                console.log('No transaction is availabel!');
                            } else {


                                let filterSend = {};
                                let filterReceive = {};

                                txnRecords.forEach(element => {

                                    if (wallet[i].userId) {
                                        filterReceive = { txId: element.txid, currencyType: "USDT", userId: wallet[i].userId, trnxType: "receive" };
                                        filterSend = { txId: element.txid, currencyType: "USDT", userId: wallet[i].userId, trnxType: "send" };

                                    } else if (wallet[i].adminId) {
                                        filterReceive = { txId: element.txid, currencyType: "USDT", adminId: wallet[i].adminId, trnxType: "receive" };
                                        filterSend = { txId: element.txid, currencyType: "USDT", adminId: wallet[i].adminId, trnxType: "send" };
                                    }

                                    if (element.referenceaddress === wallet[i].address) {
                                        if (element.confirmations <= 0) {
                                            console.log('This receive transaction is unconfirmed');
                                        } else {

                                            SendReceiveTrx.findOne(filterReceive).then((foundReceivedTransaction) => {
                                                if (!foundReceivedTransaction) {
                                                    let newReceived = new SendReceiveTrx({
                                                        senderAddress: element.sendingaddress,
                                                        receiverAddress: wallet[i].address,
                                                        amount: element.amount,
                                                        txId: element.txid,
                                                        userId: wallet[i].userId,
                                                        adminId: wallet[i].adminId,
                                                        currencyType: "USDT",
                                                        trnxType: "receive",
                                                        trnxn_Obj: element,
                                                        timestamp: element.blocktime * 1000,
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
                                                                balanceFilter = { symbol: 'USDT', userId: wallet[i].userId };
                                                            } else if (wallet[i].adminId) {
                                                                socketFilter.id = wallet[i].adminId;
                                                                balanceFilter = { symbol: 'USDT', adminId: wallet[i].adminId };
                                                            }
                                                            await userTetherBalance(wallet[i].address).then(async (userUSDTBalance: any) => {
                                                                await Wallets.findOneAndUpdate(balanceFilter, { balance: userUSDTBalance.balance }).then(async (result) => {
                                                                    if (result) {
                                                                        ioSocketss.emit(`sendReceive_${socketFilter.id}`, { symbol: wallet[i].symbol, transaction: recievedSaved, balance: userUSDTBalance.balance });
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
                                        }
                                    } else if (element.sendingaddress === wallet[i].address) {

                                        SendReceiveTrx.findOne(filterSend).then((foundTransaction) => {
                                            if (foundTransaction) {
                                                if (element.confirmations > 0) {
                                                    if (foundTransaction.TrnxStatus === "pending") {
                                                        foundTransaction.trnxFee = element.fee;
                                                        foundTransaction.amount = Number(element.amount) + Number(element.fee);
                                                        foundTransaction.trnxn_Obj = element;
                                                        foundTransaction.timestamp = element.blocktime * 1000;
                                                        foundTransaction.TrnxStatus = element.confirmations > 0 ? 'success' : 'cancel';

                                                        foundTransaction.save().then((result) => {
                                                            if (result) {
                                                                console.log('Transaction updated succesfully!');
                                                            }
                                                        });
                                                    } else {
                                                        console.log('Transaction is already Updated');
                                                    }
                                                } else {
                                                    console.log('This send transaction is unconfirmed!');
                                                }
                                            } else {
                                                let newSend = new SendReceiveTrx({
                                                    senderAddress: wallet[i].address,
                                                    receiverAddress: element.referenceaddress,
                                                    amount: Number(element.amount) + Number(element.fee),
                                                    txId: element.txid,
                                                    userId: wallet[i].userId,
                                                    adminId: wallet[i].adminId,
                                                    currencyType: "USDT",
                                                    trnxFee: element.fee,
                                                    trnxType: "send",
                                                    trnxn_Obj: element,
                                                    timestamp: element.confirmations > 0 ? element.blocktime * 1000 : '',
                                                    TrnxStatus: element.confirmations > 0 ? 'success' : 'pending',
                                                });
                                                // console.log(newSend)
                                                newSend.save().then((result) => {
                                                    if (result) {
                                                        console.log('Transaction created succesfully!');
                                                    }
                                                });
                                            }
                                        });

                                    }
                                });
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.log(error);
    }
};



/**
 * transfer tether to admin for traading
 */
let transferTetherForTrading = async (req, res, next) => {
    //return;
    try {
        let { topUpamount, cryptoValueInEuro, cryptoCurrentPrice, transactionFee, currencyId } = req.body;
        let { id } = req.user;

        await Wallets.findOne({ userId: id, currencyId: currencyId, status: true }).then(async (wallets) => {
            if (wallets) {
                let userUsdtAddress = wallets.address;
                let userUsdtPassword = wallets.account_name;
                if (userUsdtAddress) {
                    await userTetherBalance(userUsdtAddress).then(async (tetherBalance: any) => {
                        if (topUpamount > tetherBalance.balance) {
                            res.status(200).json({ success: false, msg: 'Your tether balance is insufficent!' });
                        } else {
                            await Wallets.findOne({ currencyId: currencyId, walletType: 'admin', status: true }).then(async (adminWallet) => {
                                if (adminWallet) {
                                    await transferTetherAmount(wallets.address, adminWallet.address, topUpamount, 31).then((result) => {
                                        if (result) {
                                            let addToUserTradeWallet = new Trade({
                                                userId: id,
                                                cryptoAmount: topUpamount,
                                                euroAmount: cryptoValueInEuro,
                                                cryptoCurrentPrice: cryptoCurrentPrice,
                                                cryptoType: 'USDT',
                                                txType: 'privateWallet',
                                                txId: result,
                                                type: 'credit',
                                                status: "completed"
                                            });
                                            addToUserTradeWallet.save(async (err, usdtDoc) => {
                                                if (err) {
                                                    res.status(200).json({ success: false, msg: err, type: 'err in transfer' });
                                                } else {
                                                    let details = new SendReceiveTrx({
                                                        senderAddress: wallets.address,
                                                        receiverAddress: adminWallet.address,
                                                        amount: topUpamount,
                                                        txId: result.transactionHash,
                                                        userId: id,
                                                        currencyType: 'USDT',
                                                        trnxType: 'send',
                                                        tradeId: addToUserTradeWallet._id
                                                    });
                                                    details.save(async (err, transferUSDT) => {
                                                        if (err) {
                                                            res.status(200).json({ success: false, msg: err, type: 'error in saving' })
                                                        } else {
                                                            await userCryptoTradeBalance(id, 'USDT').then(async (userTetherTradeBalance) => {
                                                                await TradeWallet.findOneAndUpdate({ userId: id, currencyId: currencyId }, { balance: userTetherTradeBalance }).then(async (result) => {
                                                                    await userTetherBalance(wallets.address).then(async (userTetherBalance: any) => {
                                                                        await Wallets.findOneAndUpdate({ userId: req.user.id, currencyId: currencyId }, { balance: userTetherBalance.balance }).then((result) => {
                                                                            if (result) {
                                                                                ioSocketss.emit(`sendReceive_${req.user.id}`, { symbol: wallets.symbol, transaction: usdtDoc, balance: userTetherBalance.balance });
                                                                                ioSocketss.emit(`sendReceiveTrade_${id}`, { symbol: wallets.symbol, transaction: usdtDoc, balance: userTetherTradeBalance });
                                                                                res.status(200).json({ success: true, msg: `${topUpamount} USDT added to your trade wallet` });
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
                                                userId: req.user.id,
                                                tradeId: addToUserTradeWallet.id,
                                                cryptoAmount: topUpamount,
                                                cryptoType: 'USDT',
                                                txType: 'userPrivateWallet',
                                                txId: result,
                                                type: 'credit',
                                                status: "completed"
                                            });
                                            addToAdminTradeWallet.save((err) => {
                                                if (err) {
                                                    res.status(200).json({ success: false, msg: err, type: 'err in transfer' });
                                                } else {
                                                    //  res.status(200).json({ success: true, msg: "Amount transferred" });
                                                }
                                            });
                                        }
                                    }).catch((error) => {
                                        res.status(200).json({ success: false, msg: error, type: 'err in transfer' });
                                    });
                                }
                            }).catch((error) => {
                                res.status(200).json({ success: false, msg: error, type: 'err in transfer' });
                            });
                        }
                    }).catch((error) => {
                        res.status(200).json({ success: false, msg: error, type: 'err in transfer' });
                    });
                }
            }
        }).catch((error) => {
            res.status(200).json({ success: false, msg: error, type: 'err in transfer' });
        });

    } catch (error) {
        console.log(error);
        res.status(200).json({ success: false, msg: error, type: 'err in transfer' });
    }
};





/**
 * withdraw usdt amount from trade account to personal account
 */
let withdrawUsdtFromTrade = async (req, res, next) => {

    let { id } = req.user;
    let { coinType, withdrawAmount, withdrawAmountInEuro, cryptoCurrentPrice, cryptoTransactionFee, verifyCode, currencyId } = req.body;
    let amoutToTransferWithFee = parseFloat(withdrawAmount) + parseFloat(cryptoTransactionFee);

    await UserProfile.findOne({ userId: id }).then(async (user) => {
        if (user) {
            if (user.smscode === verifyCode) {
                await userCryptoTradeBalance(id, 'USDT').then((userTradeBalance) => {
                    if (withdrawAmount > userTradeBalance) {
                        res.status(200).json({ success: false, msg: "Your Tether balance insufficient!", type: "low balance" });
                    } else {
                        let deductFromUserTradeWallet = new Trade({
                            userId: id,
                            cryptoAmount: -withdrawAmount,
                            euroAmount: withdrawAmountInEuro,
                            cryptoCurrentPrice: cryptoCurrentPrice,
                            cryptoType: 'USDT',
                            txType: 'privateWallet',
                            type: 'debit',
                            status: "completed",
                            withdrawalAmount: parseFloat(withdrawAmount).toFixed(8),
                            // withdrawalFee: parseFloat(cryptoTransactionFee).toFixed(8),
                            withdrawalStatus: "pending",
                        });

                        deductFromUserTradeWallet.save(async (err, usdtDoc) => {
                            if (err) {
                                res.status(200).json({ success: false, msg: err, type: "withdrawal fail" });
                            } else {
                                res.status(200).json({ success: true, msg: "Withdrawal Request Generated", type: "withdrawal success" });
                                await userCryptoTradeBalance(id, 'USDT').then(async (userTetherBalance) => {
                                    await TradeWallet.findOneAndUpdate({ userId: id, currencyId: currencyId }, { balance: userTetherBalance }).then((result) => {
                                        ioSocketss.emit(`sendReceiveTrade_${id}`, { symbol: "USDT", transaction: usdtDoc, balance: userTetherBalance });
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
            } else {
                res.status(200).json({ success: false, msg: "Your Email Code is invalid!", langid: "invalid code" });
            }
        }
    }).catch((error) => {
        res.status(200).json({ success: false, msg: error, type: 'error in saving' })
    });
}











/**
 * transfer tether from admin personal account to user personal account
 */
let transferTetherFromAdminToUser = async (req, res, next) => {
    try {
        let { cryptoAmount, cryptoType, userId, recordId } = req.body;
        let { id } = req.admin;

        await Wallets.findOne({ adminId: id, symbol: cryptoType, walletType: 'admin', status: true }).then(async (wallets) => {
            if (wallets) {
                if (cryptoAmount > wallets.balance) {
                    res.status(200).json({ success: false, msg: `Your ${cryptoType} balance is insufficent!`, type: 'balance is not sufficent' });
                } else {
                    await Wallets.findOne({ userId: userId, symbol: cryptoType, walletType: "user", status: true }).then(async (userwallets) => {
                        await transferTetherAmount(wallets.address, userwallets.address, cryptoAmount, 31).then((result) => {
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
                                        await userTetherBalance(wallets.account_name).then(async (usdtBalance: any) => {
                                            await Wallets.findOneAndUpdate({ adminId: id, symbol: cryptoType }, { balance: usdtBalance.balance }).then((result) => {
                                                if (result) {
                                                    Trade.findByIdAndUpdate(recordId, { withdrawalStatus: 'completed' }, (err, result) => {
                                                        if (err) {
                                                            res.status(200).json({ success: false, msg: err, type: 'error' });
                                                        } else {
                                                            ioSocketss.emit(`sendReceive_${req.admin.id}`, { symbol: wallets.symbol, transaction: btcDoc, balance: usdtBalance });
                                                            res.status(200).json({ success: true, msg: `${cryptoAmount} ${cryptoType} transfer to the user!`, type: 'send USDT' });
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
    activateTether,
    sendUsdtToOther,
    tetherTransactionFee,
    transferTetherForTrading,
    withdrawUsdtFromTrade,
    userTetherBalance,
    transferTetherFromAdminToUser
}