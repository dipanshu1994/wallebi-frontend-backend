import { User } from "../../db/models/users/users.model";
import { Wallets } from "../../db/models/Wallets/wallet.model";
import { createMultiSigWallet, getLiteCoinBalance, transferAmount, getLTCNetworkFee, getBlockChainInfo, getBlockHash, getBlock, getLiteCoinTransaction, getLTCListTransaction } from "../../services/WalletService/liteCoin.service";
import { SendReceiveTrx } from "../../db/models/Wallets/sendReceiveTransaction.model";
import * as cron from 'node-cron';
import { Fees } from "../../db/models/Wallets/cryptoTrnxFee.model";
import { Blocks } from "../../db/models/Wallets/block.model";
import { AdminTradeWallet } from "../../db/models/Wallets/adminTrade.model";
import { Trade } from "../../db/models/Wallets/trade.model";
import { UserProfile } from "../../db/models/users/userProfile.model";
import { userCryptoTradeBalance } from "../../services/WalletService/trade.service";
import { TradeWallet } from "../../db/models/Wallets/trade.wallet.model";
import { ioSocketss } from "../..";
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
    ltcTnxFee();
    // blockManagerLTC('LTC');
    getSendReceiveTransactionLiteCoin();
});



/**
 * activating LTC wallet controller
 * @param userId 
 * */
let activateLiteCoin = async (req, res, next) => {
    try {
        let { currencyId, symbol, title } = req.body;
        User.findOne({ _id: req.user.id }, async (err, user) => {
            if (err || user === null) {
                res.status(200).json({ success: false, msg: err, type: 'activate LTC' });
            } else {
                let ltcWalletPassword = `ltc_${user.firstname}_${Date.now()}`;
                let ltcWallet = await createMultiSigWallet(ltcWalletPassword);
                if (ltcWallet) {
                    let ltcData = { address: ltcWallet.address, account_name: ltcWalletPassword, status: true };
                    await Wallets.findOneAndUpdate({ currencyId: currencyId, userId: req.user.id }, ltcData, { new: true }).then((result) => {
                        if (result) {
                            res.status(200).json({ success: true, msg: `${result.title} is activated!`, type: 'litecoin wallet activated!' });
                        }
                    }).catch((error) => {
                        console.log(error);
                        res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'activate LTC' });
                    });
                } else {
                    res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'activate LTC' });
                }
            }
        });
    } catch (error) {
        console.log(error);
    }
};



/**
 * getting litecoin balance from node
 * @param address 
 */
let litecoinBalance = async (account_name) => {
    return new Promise(async (resolve, reject) => {
        try {
            await getLiteCoinBalance(account_name).then((ltcBalance) => {
                resolve(ltcBalance);
            }).catch((error) => {
                reject(error);
            });
        } catch (error) {
            reject(error);
        }
    });
};




/*
* getting ltc transaction fee and saving it to database
*/
let ltcTnxFee = async () => {
    try {
        let fee = await getLTCNetworkFee(6);
        Fees.findOneAndUpdate({ status: true }, { liteCoinFee: fee }, { upsert: true }, (err, result) => {
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

// fetching transaction fee of ltc form database
let ltcFee = async (req, res, next) => {
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
 * send lite coin to other user
 */
let sendLtcToOther = (req, res) => {
    try {
        let { cryptoAmount, ltcWithFee, receiverAddress, currencyId } = req.body;

        Wallets.findOne({ userId: req.user.id, currencyId: currencyId }, async (err, wallets) => {
            if (err) {
                res.status(200).json({ success: false, msg: "Insufficient Balance", type: 'send Lite coin to other user' });
            }
            else {
                let ltcquantity = parseFloat(cryptoAmount).toFixed(8);
                let ltcquantitywithFee = parseFloat(ltcWithFee).toFixed(8);

                let userLtcAddress = wallets.address;
                var userLtcAccount = wallets.account_name;

                let senderBalance = await getLiteCoinBalance(userLtcAccount);
                if (senderBalance < ltcquantity) {
                    res.status(200).json({ success: false, msg: "Your litecoin balance is insufficient!" });
                } else {
                    // let setTransactionFee = await setTxFee(0.00000001);
                    let result = await transferAmount(userLtcAccount, receiverAddress, ltcquantity, 1);
                    if (result) {
                        var details = new SendReceiveTrx({
                            senderAddress: userLtcAddress,
                            receiverAddress: receiverAddress,
                            amount: ltcquantity,
                            txId: result,
                            userId: req.user.id,
                            currencyType: 'LTC',
                            trnxType: 'send'
                        });
                        details.save(async (err, ltcDoc) => {
                            if (err) {
                                res.status(200).json({ status: false, msg: "Insufficient Balance" });
                            } else {
                                res.status(200).json({ status: true, msg: `${ltcquantity} litecoin transfer to the ${receiverAddress}!` });
                                await litecoinBalance(wallets.account_name).then(async (litecoinBalance: any) => {
                                    await Wallets.findOneAndUpdate({ userId: req.user.id, currencyId: currencyId }, { balance: litecoinBalance }).then((result) => {
                                        if (result) {
                                            ioSocketss.emit(`sendReceive_${req.user.id}`, { symbol: wallets.symbol, transaction: ltcDoc, balance: litecoinBalance });
                                        }
                                    }).catch((error) => {
                                        console.log(error);
                                    });
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
}


/**
 * send receive ltc transaction block manager
 */
let blockManagerLTC = async (symbol) => {
    try {
        if (typeof symbol !== 'undefined' && symbol && symbol !== '') {
            let blockchaininfo = await getBlockChainInfo();
            if (typeof blockchaininfo !== 'undefined' && blockchaininfo !== null) {
                Blocks.findOne({ symbol: symbol }).sort({ createdAt: -1 }).exec((blkErr, blkRes) => {
                    var blkOjb = { symbol: symbol, number: blockchaininfo.headers, lastBlock: blockchaininfo.headers, blockID: blockchaininfo.bestblockhash, full_block: blockchaininfo };
                    if (blkErr == null && blkRes == null) {
                        Blocks.create(blkOjb, (CrBlkErr, CRBlkRes) => {
                            if (!CrBlkErr && CRBlkRes) {
                                // console.log("Save New Block");
                            }
                        });
                    } else {
                        if (Object.keys(blkRes).length > 0) {
                            Blocks.findOneAndUpdate({ symbol: symbol }, blkOjb, function (error, savedBlock) {
                                if (!error && savedBlock) {
                                    // console.log("Update Latest Block");
                                } else {
                                    // console.log("Internal Server Error");
                                }
                            });
                        }
                    }
                    if (blkRes == null) {
                        singleBlockHandlerLTC(blockchaininfo, symbol);
                    } else {
                        if ((blockchaininfo.headers - blkRes.number) == 0) {
                            singleBlockHandlerLTC(blockchaininfo, symbol)
                        } else {
                            multipleBlockHandlerLTC(blockchaininfo, blkRes)
                        }
                    }
                });
            } else {
                console.log("No New Block Available");
            }
        }
    } catch (e) {
        console.log("Error in catch  receive LTC", e)
    }
}

/**
 * send receive ltc transaction single block handler
 */
let singleBlockHandlerLTC = async (blockchaininfo, symbol) => {
    try {
        let blockheaders = blockchaininfo.headers
        Blocks.findOne({ symbol: symbol }, async (err, latestBlock) => {
            if (!err) {
                try {
                    var blockhash = await getBlockHash(blockheaders);
                    if (typeof blockhash !== 'undefined' && blockhash !== null) {
                        latestBlock.isLatestBlock = true;
                        await receiveLTCTransaction(latestBlock, blockhash, symbol);
                    }
                } catch (error) {
                    console.log(error);
                }
            } else {
                console.log('find latest block');
            }
        });
    } catch (error) {
        console.log(error);
    }
}



/**
 * send receive ltc transaction multiple block manager
 */
let multipleBlockHandlerLTC = async (blockchaininfo, blkRes) => {
    Blocks.findOne({ symbol: blkRes.symbol }, async (err, lastScanedBlock) => {
        if (!err) {
            let diffBlock = blockchaininfo.headers - lastScanedBlock.lastBlock;
            for (let i = 0; i <= diffBlock; i++) {
                try {
                    let blockhash = await getBlockHash(lastScanedBlock.lastBlock + i);
                    if (typeof blockhash !== 'undefined' && blockhash !== null) {
                        lastScanedBlock.i = i;
                        lastScanedBlock.isLastBlock = true;
                        await receiveLTCTransaction(lastScanedBlock, blockhash, blkRes.symbol);
                    }
                } catch (error) {
                    console.log(error);
                }
            }
        } else {
            console.log('lastBlock Error', err)
        }
    });
}

/**
 * send receive ltc transaction
 */
let receiveLTCTransaction = async (lastBlockInfo, blockhash, symbol) => {
    try {
        return new Promise(async (resolve, reject) => {
            if (typeof symbol !== 'undefined' && symbol && symbol !== '') {
                if (typeof blockhash !== 'undefined' && blockhash !== null) {
                    let block = await getBlock(blockhash);
                    if (typeof block !== 'undefined' && block !== null) {
                        if (typeof block.tx !== 'undefined' && block.tx !== null) {
                            for (let index = 0; index < block.tx.length; index++) {
                                try {
                                    let data = await getLiteCoinTransaction(block.tx[index])
                                    if (typeof data !== 'undefined' && data !== null) {
                                        let ltcTransaction = data.details.filter(el => el.category == 'receive')
                                        ltcTransaction.forEach(async (ltcvalue) => {
                                            await Wallets.find({ 'litecoin.address': ltcvalue.address }).exec((walletErr, walletData) => {
                                                if (!walletErr) {
                                                    SendReceiveTrx.findOne({ txId: data.txid, }, (error, txnCheck) => {
                                                        if (!error) {
                                                            if (txnCheck == null) {
                                                                if (walletData.length > 0) {
                                                                    if (ltcvalue.category === 'receive') {
                                                                        let receivetransaction = { senderAddress: '', receiverAddress: ltcvalue.address, amount: ltcvalue.amount, trnxType: 'receive', trnxn_Obj: data, txId: data.txid, trnxFee: '', userId: walletData[0]._id, timestamp: data.timereceived, TrnxStatus: data.confirmations > 8 ? "success" : "pending", currencyType: 'LTC' }
                                                                        SendReceiveTrx.create(receivetransaction, async (error, txnSaved) => {
                                                                            if (txnSaved) {
                                                                                // pusher.trigger('my-channel', 'ltc-trans', {
                                                                                //     //	ltcbalance: balance,
                                                                                //     time: new Date()
                                                                                // });
                                                                            }
                                                                            if (!error) {
                                                                                if (index == block.tx.length - 1) {
                                                                                    if (lastBlockInfo.isLastBlock) {
                                                                                        var lastblock = lastBlockInfo.lastBlock + lastBlockInfo.i;
                                                                                        Blocks.findOneAndUpdate({ symbol: symbol }, { lastBlock: lastblock }, (err, res) => {
                                                                                        });
                                                                                    }
                                                                                    if (lastBlockInfo.isLatestBlock) {
                                                                                        if (lastBlockInfo.lastBlock === lastBlockInfo.number) {
                                                                                            Blocks.findOneAndUpdate({ symbol: symbol }, { lastBlock: lastBlockInfo.number }, (err, res) => {
                                                                                            });
                                                                                        }
                                                                                    }
                                                                                    resolve('save new trx');
                                                                                    const balance = await getLiteCoinBalance(walletData.wallets.litecoin.name);
                                                                                }
                                                                            } else {
                                                                                reject('error in sendLtctoaddress.create receive ltc');
                                                                            }
                                                                        });
                                                                    }
                                                                }
                                                            } else {
                                                                resolve('this transaction is exist');
                                                            }
                                                        } else {
                                                            reject('Check Trx internal Error');
                                                        }
                                                    });
                                                } else {
                                                    reject('Wallet Internal Server Error');
                                                }
                                            });
                                        });
                                    } else {
                                        reject('No transaction Data available')
                                    }
                                } catch (error) {
                                    if (index == block.tx.length - 1) {
                                        if (lastBlockInfo.isLastBlock) {
                                            var lastblock = lastBlockInfo.lastBlock + lastBlockInfo.i;
                                            Blocks.findOneAndUpdate({ symbol: symbol }, { lastBlock: lastblock }, (err, res) => {
                                            });
                                        }
                                        if (lastBlockInfo.isLatestBlock) {
                                            if (lastBlockInfo.lastBlock === lastBlockInfo.number) {
                                                Blocks.findOneAndUpdate({ symbol: symbol }, { lastBlock: lastBlockInfo.number }, (err, res) => {
                                                });
                                            }
                                        }
                                        reject('invalid transaction id');
                                    }
                                }
                            }
                        } else {
                            reject('No transaction has available');
                        }
                    } else {
                        reject('block is undefined')
                    }
                } else {
                    reject('blockhash is undefined')
                }
            } else {
                reject('symble is undefined')
            }
        })
    } catch (e) {
        console.log("Error in catch block for check ltc block", e)
    }
};


/**
 * create ltc leadger of send receive
 */
let getSendReceiveTransactionLiteCoin = async () => {
    try {
        let txnRecords;
        let count = 0;
        Wallets.find({ symbol: 'LTC' }, async (err, wallet) => {
            if (err) {
                console.log(err);
            } else {
                if (wallet) {
                    for (let i = 0; i < wallet.length; i++) {
                        if (wallet[i].address) {
                            txnRecords = await getLTCListTransaction(wallet[i].account_name, 200, 0);
                            if (isEmpty(txnRecords)) {
                                console.log('No transaction id is available')
                            } else {

                                let filterSend = {};
                                let filterReceive = {};

                                txnRecords.forEach(element => {


                                    if (wallet[i].userId) {
                                        filterReceive = { txId: element.txid, currencyType: "LTC", userId: wallet[i].userId, trnxType: "receive" };
                                        filterSend = { txId: element.txid, currencyType: "LTC", userId: wallet[i].userId, trnxType: "send" };

                                    } else if (wallet[i].adminId) {
                                        filterReceive = { txId: element.txid, currencyType: "LTC", adminId: wallet[i].adminId, trnxType: "receive" };
                                        filterSend = { txId: element.txid, currencyType: "LTC", adminId: wallet[i].adminId, trnxType: "send" };
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
                                                    currencyType: "LTC",
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
                                                            balanceFilter = { symbol: wallet[i].symbol, userId: wallet[i].userId };
                                                        } else if (wallet[i].adminId) {
                                                            socketFilter.id = wallet[i].adminId;
                                                            balanceFilter = { symbol: wallet[i].symbol, adminId: wallet[i].adminId };
                                                        }
                                                        await litecoinBalance(wallet[i].account_name).then(async (userlitecoinBalance: any) => {
                                                            await Wallets.findOneAndUpdate(balanceFilter, { balance: userlitecoinBalance }).then(async (result) => {
                                                                if (result) {
                                                                    ioSocketss.emit(`sendReceive_${socketFilter.id}`, { symbol: wallet[i].symbol, transaction: recievedSaved, balance: userlitecoinBalance });
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
                                                    foundTransaction.trnxFee = (element.fee * -1);
                                                    foundTransaction.amount = Number(element.amount * -1) + Number((element.fee * -1));
                                                    foundTransaction.trnxn_Obj = element;
                                                    foundTransaction.timestamp = element.timereceived * 1000;
                                                    foundTransaction.TrnxStatus = element.abandoned === false ? 'success' : 'cancel';

                                                    foundTransaction.save().then((result) => {
                                                        if (result) {
                                                            console.log('Transaction updated succesfully!');
                                                        }
                                                    });
                                                } else {
                                                    console.log('Transaction is already Updated');
                                                }
                                            } else {
                                                let newSend = new SendReceiveTrx({
                                                    senderAddress: wallet[i].address,
                                                    receiverAddress: element.address,
                                                    amount: Number(element.amount * -1) + Number((element.fee * -1)),
                                                    txId: element.txid,
                                                    userId: wallet[i].userId,
                                                    currencyType: "LTC",
                                                    trnxFee: (element.fee * -1),
                                                    trnxType: "send",
                                                    trnxn_Obj: element,
                                                    timestamp: element.timereceived * 1000,
                                                    TrnxStatus: element.abandoned === false ? 'success' : 'cancel',
                                                });
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
 * transfering litecoin to admin for trading
 */
let transferLiteCoinForTrade = async (req, res, next) => {
    let { topUpamount, cryptoValueInEuro, cryptoCurrentPrice, transactionFee, currencyId } = req.body;
    let { id } = req.user;
    await Wallets.findOne({ userId: id, currencyId: currencyId, status: true }).then(async (wallets) => {
        if (wallets) {
            await litecoinBalance(wallets.account_name).then(async (balance) => {
                if (topUpamount > balance) {
                    res.status(200).json({ success: false, msg: "Your litecoin balance is insufficient!", type: 'Your balance is insufficent!' });
                } else {
                    await Wallets.findOne({ currencyId: currencyId, walletType: 'admin', status: true }).then(async (adminWallet) => {
                        if (adminWallet) {
                            await transferAmount(wallets.account_name, adminWallet.address, topUpamount, 1).then((result) => {
                                if (result) {
                                    let addToUserTradeWallet = new Trade({
                                        userId: id,
                                        cryptoAmount: topUpamount,
                                        euroAmount: cryptoValueInEuro,
                                        cryptoCurrentPrice: cryptoCurrentPrice,
                                        cryptoType: 'LTC',
                                        txType: 'privateWallet',
                                        txId: result,
                                        type: 'credit',
                                        status: "completed"
                                    });
                                    addToUserTradeWallet.save(async (err, ltcDoc) => {
                                        if (err) {
                                            res.status(200).json({ success: false, msg: err, type: 'error in saving' })
                                        } else {
                                            let details = new SendReceiveTrx({
                                                senderAddress: wallets.address,
                                                receiverAddress: adminWallet.address,
                                                amount: topUpamount,
                                                txId: result.transactionHash,
                                                userId: id,
                                                currencyType: 'LTC',
                                                trnxType: 'send',
                                                tradeId: addToUserTradeWallet._id
                                            });
                                            details.save(async (err, ltcTransfer) => {
                                                if (err) {
                                                    res.status(200).json({ success: false, msg: err, type: 'error in saving' })
                                                } else {
                                                    await userCryptoTradeBalance(id, 'LTC').then(async (userLitecoinBalance) => {
                                                        await TradeWallet.findOneAndUpdate({ userId: id, currencyId: currencyId }, { balance: userLitecoinBalance }).then(async (result) => {
                                                            await litecoinBalance(wallets.account_name).then(async (litecoinBalance: any) => {
                                                                await Wallets.findOneAndUpdate({ userId: req.user.id, currencyId: currencyId }, { balance: litecoinBalance }).then((result) => {
                                                                    if (result) {
                                                                        res.status(200).json({ success: true, msg: `${topUpamount} litecoin added to your trade wallet!` });
                                                                        ioSocketss.emit(`sendReceiveTrade_${id}`, { symbol: wallets.symbol, transaction: ltcDoc, balance: userLitecoinBalance });
                                                                        ioSocketss.emit(`sendReceive_${req.user.id}`, { symbol: wallets.symbol, transaction: ltcDoc, balance: litecoinBalance });
                                                                    }
                                                                }).catch((error) => {
                                                                    console.log(error);
                                                                });
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
                                        cryptoType: 'LTC',
                                        txType: 'userPrivateWallet',
                                        txId: result,
                                        type: 'credit',
                                        status: "completed"
                                    });
                                    addToAdminTradeWallet.save((err) => {
                                        if (err) {
                                            console.log(err);
                                        } else {
                                            //  res.status(200).json({ success: true, msg: "Amount transferred succesfully !", type: 'ltc transfer' });
                                        }
                                    });
                                }
                            }).catch((error) => {
                                res.status(200).json({ success: false, msg: error, type: 'error in saving' })
                            });
                        }
                    }).catch((error) => {
                        res.status(200).json({ success: false, msg: error, type: 'error in saving' })
                    });
                }
            }).catch((error) => {
                res.status(200).json({ success: false, msg: error, type: 'error in saving' })
            });
        }
    }).catch((error) => {
        res.status(200).json({ success: false, msg: error, type: 'error in saving' })
    });

};



/**
 * withdraw litecoin from trade account
 */
let withdrawLitecoinFromTrade = async (req, res, next) => {
    let { id } = req.user;
    let { coinType, withdrawAmount, withdrawAmountInEuro, cryptoCurrentPrice, cryptoTransactionFee, verifyCode, currencyId } = req.body;
    let amoutToTransferWithFee = parseFloat(withdrawAmount) + parseFloat(cryptoTransactionFee);
    await UserProfile.findOne({ userId: id }).then(async (user) => {
        if (user) {
            if (user.smscode === verifyCode) {
                await userCryptoTradeBalance(id, 'LTC').then((ltcTradeBalance) => {
                    if (withdrawAmount > ltcTradeBalance) {
                        res.status(200).json({ success: false, msg: 'Your litecoin trade balance is insufficent!', type: 'insufficent balance' });
                    } else {
                        let deductFromUserTradeWallet = new Trade({
                            userId: id,
                            cryptoAmount: -withdrawAmount,
                            euroAmount: withdrawAmountInEuro,
                            cryptoCurrentPrice: cryptoCurrentPrice,
                            cryptoType: 'LTC',
                            txType: 'privateWallet',
                            type: 'debit',
                            status: "completed",
                            withdrawalAmount: parseFloat(withdrawAmount).toFixed(8),
                            // withdrawalFee: parseFloat(cryptoTransactionFee).toFixed(8),
                            withdrawalStatus: "pending",
                        });
                        deductFromUserTradeWallet.save(async (err, ltcDoc) => {
                            if (err) {
                                res.status(200).json({ success: false, msg: err, type: 'error in saving ' });
                            } else {
                                res.status(200).json({ success: true, msg: "Withdrawal Request Generated", type: "withdrawalsuccess" });
                                await userCryptoTradeBalance(id, 'LTC').then(async (userLitecoinBalance) => {
                                    await TradeWallet.findOneAndUpdate({ userId: id, currencyId: currencyId }, { balance: userLitecoinBalance }).then((result) => {
                                        ioSocketss.emit(`sendReceiveTrade_${id}`, { symbol: 'LTC', transaction: ltcDoc, balance: userLitecoinBalance });
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
                res.status(200).json({ success: false, msg: 'Your code is invalid!', type: 'invalid code' })
            }
        }
    }).catch((error) => {
        res.status(200).json({ success: false, msg: error, type: 'error in saving' })
    });

};










/**
 * transfer litecoin from admin personal account to user personal account
 */
let transferLitecoinFromAdminToUser = async (req, res, next) => {
    try {
        let { cryptoAmount, cryptoType, userId, recordId } = req.body;
        let { id } = req.admin;

        await Wallets.findOne({ adminId: id, symbol: cryptoType, walletType: 'admin', status: true }).then(async (wallets) => {
            if (wallets) {
                if (cryptoAmount > wallets.balance) {
                    res.status(200).json({ success: false, msg: `Your ${cryptoType} balance is insufficent!`, type: 'balance is not sufficent' });
                } else {
                    await Wallets.findOne({ userId: userId, symbol: cryptoType, walletType: "user", status: true }).then(async (userwallets) => {
                        await transferAmount(wallets.account_name, userwallets.address, cryptoAmount, 1).then((result) => {
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
                                        await litecoinBalance(wallets.account_name).then(async (ltcBalance: any) => {
                                            await Wallets.findOneAndUpdate({ adminId: id, symbol: cryptoType }, { balance: ltcBalance }).then((result) => {
                                                if (result) {
                                                    Trade.findByIdAndUpdate(recordId, { withdrawalStatus: 'completed' }, (err, result) => {
                                                        if (err) {
                                                            res.status(200).json({ success: false, msg: err, type: 'error' });
                                                        } else {
                                                            ioSocketss.emit(`sendReceive_${req.admin.id}`, { symbol: wallets.symbol, transaction: btcDoc, balance: ltcBalance });
                                                            res.status(200).json({ success: true, msg: `${cryptoAmount} ${cryptoType} transfer to the user!`, type: 'send LTC' });
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
    activateLiteCoin,
    ltcFee,
    sendLtcToOther,
    transferLiteCoinForTrade,
    withdrawLitecoinFromTrade,
    litecoinBalance,
    transferLitecoinFromAdminToUser
}


