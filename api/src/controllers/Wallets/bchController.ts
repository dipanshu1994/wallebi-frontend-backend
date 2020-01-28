import { User } from "../../db/models/users/users.model";
import { Wallets } from "../../db/models/Wallets/wallet.model";
import { createMultiSigWallet, getBCHNetworkFee, getBlockChainInfoBCH, getBCHBlockHash, getBCHBlock, getBCHTransaction, getBCHBalance, getBCHListTransaction, validateBCHAddress, transferBitcoinCashAmount } from "../../services/WalletService/bch.service";
import { SendReceiveTrx } from "../../db/models/Wallets/sendReceiveTransaction.model";
import * as cron from 'node-cron';
import { Fees } from "../../db/models/Wallets/cryptoTrnxFee.model";
import { Blocks } from "../../db/models/Wallets/block.model";
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

cron.schedule('*/15 * * * * *', () => {
    getAndSaveFee();
    // blockManagerBCH('BCH');
    getSendReceiveTransactionBitCoinCash();
});


/**
 * activating BCH wallet controller
 * @param userId 
 * */
let activateBCH = async (req, res, next) => {
    try {
        let { currencyId, symbol, title } = req.body;
        User.findOne({ _id: req.user.id }, async (err, user) => {
            if (err || user === null) {
                res.status(200).json({ success: false, msg: err, type: 'activate BCH' });
            } else {
                let bchWalletPassword = `bch_${user.firstname}_${Date.now()}`;
                let bchWallet = await createMultiSigWallet(bchWalletPassword);
                let bchData = { address: bchWallet, account_name: bchWalletPassword, status: true };
                if (bchData) {
                    await Wallets.findOneAndUpdate({ currencyId: currencyId, userId: req.user.id }, bchData, { new: true }).then((result) => {
                        if (result) {
                            res.status(200).json({ success: true, msg: `${result.title} is activated!`, type: 'bitcash wallet activated!' });
                        }
                    }).catch((error) => {
                        console.log(error);
                        res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'activate BCH' });
                    });
                } else {
                    res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'activate BCH' });
                }
            }
        });
    } catch (error) {
        console.log(error);
    }
};



/**
 * getting the transaction fee of BCH for storing in the DB
 */
let getAndSaveFee = async () => {
    try {
        let getFee = await getBCHNetworkFee(6);
        Fees.findOneAndUpdate({ status: true }, { bitCoinCashFee: getFee }, { upsert: true }, (err, result) => {
            if (err) {
                console.log(err);
            } else {
                //  console.log('result' + result);
            }
        });
    } catch (error) {
        console.log(error);
    }
};


// fetching transaction fee from the database
let bchTnxFee = async (req, res, next) => {
    try {
        Fees.find((err, fees) => {
            if (err) {
                res.status(200).json({ success: false, msg: err, type: 'bit cash fee' });
            } else {
                res.json(fees);
            }
        });
    } catch (error) {
        console.log(error)
    }
};






/**
 * getting bitcoin cash balance from bode
 * @param account_name 
 */
let bitcoincashBalance = async (account_name) => {
    return new Promise(async (resolve, reject) => {
        try {
            await getBCHBalance(account_name).then((bchBalance) => {
                resolve(bchBalance);
            }).catch((error) => {
                reject(error);
                console.log(error);
            });
        } catch (error) {
            reject(error);
        }
    });
};





let sendBCHToOther = (req, res, next) => {

    let { cryptoAmount, bchWithFee, receiverAddress, bchToEuro, currencyId } = req.body;

    let amountToTransfer = cryptoAmount;
    let amountToTransferWithFee = bchWithFee;

    Wallets.findOne({ userId: req.user.id, currencyId: currencyId }, async (err, wallet) => {
        if (err) {
            res.status(200).json({ success: false, msg: err, type: 'Send BCH to other user' });
        }
        else {
            let bchquantity = parseFloat(amountToTransfer).toFixed(8);
            let bchquantitywithfee = parseFloat(amountToTransferWithFee).toFixed(8);

            let userBchAddress = wallet.address;
            let userBchAccount = wallet.account_name;

            let senderBalance = await getBCHBalance(userBchAccount);
            let validateAddress = await validateBCHAddress(receiverAddress);

            if (!validateAddress.isvalid) {
                res.status(200).json({ success: false, msg: "Your address is not valid", validateAddress: validateAddress.isvalid });
            } else {
                if (senderBalance < bchquantity) {
                    res.status(200).json({ success: false, msg: "Your bitcoincash balnce is insufficient!", type: 'balance insufficent' });
                } else {
                    let result = await transferBitcoinCashAmount(userBchAccount, receiverAddress, bchquantity, 1);
                    if (result) {
                        let details = new SendReceiveTrx({
                            senderAddress: userBchAddress,
                            receiverAddress: receiverAddress,
                            amount: bchquantity,
                            txId: result,
                            userId: req.user.id,
                            currencyType: 'BCH',
                            trnxType: 'send',
                        });
                        details.save(async (err, bchDoc) => {
                            if (err) {
                                res.status(200).json({ success: false, msg: "Insufficient Balance", type: 'send bch' });
                            } else {
                                await bitcoincashBalance(userBchAccount).then(async (bitcoincashBalance: any) => {
                                    await Wallets.findOneAndUpdate({ userId: req.user.id, currencyId: currencyId }, { balance: bitcoincashBalance }).then((result) => {
                                        if (result) {
                                            ioSocketss.emit(`sendReceive_${req.user.id}`, {symbol: wallet.symbol, transaction: bchDoc, balance: bitcoincashBalance});
                                            res.status(200).json({ success: true, msg: `${amountToTransfer} bitcoin cash transfer to ${receiverAddress}` });
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

        }
    });
}



/**
 * send receive bch transaction block manager
 */
let blockManagerBCH = async (symbol) => {
    try {
        if (typeof symbol !== 'undefined' && symbol && symbol !== '') {
            let blockchaininfo = await getBlockChainInfoBCH();
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
                            Blocks.findOneAndUpdate({ symbol: symbol }, blkOjb, (error, savedBlock) => {
                                if (!error && savedBlock) {
                                    // console.log("Update Latest Block");
                                } else {
                                    // console.log("Internal Server Error");
                                }
                            });
                        }
                    }
                    if (blkRes == null) {
                        singleBlockHandlerBCH(blockchaininfo, symbol);
                    } else {
                        if ((blockchaininfo.headers - blkRes.number) == 0) {
                            singleBlockHandlerBCH(blockchaininfo, symbol)
                        } else {
                            multipleBlockHandlerBCH(blockchaininfo, blkRes)
                        }
                    }
                });
            } else {
                console.log("No New Block Available");
            }
        }
    } catch (e) {
        console.log("Error in catch  receive BCH", e)
    }
}



/**
 * send receive bch transaction single block handler
 */
let singleBlockHandlerBCH = async (blockchaininfo, symbol) => {
    try {
        let blockheaders = blockchaininfo.headers
        Blocks.findOne({ symbol: symbol }, async (err, latestBlock) => {
            if (!err) {
                try {
                    var blockhash = await getBCHBlockHash(blockheaders);
                    if (typeof blockhash !== 'undefined' && blockhash !== null) {
                        latestBlock.isLatestBlock = true;
                        await receiveBCHTransaction(latestBlock, blockhash, symbol);
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
 * send receive bch transaction multiple block manager
 */
let multipleBlockHandlerBCH = async (blockchaininfo, blkRes) => {
    Blocks.findOne({ symbol: blkRes.symbol }, async (err, lastScanedBlock) => {
        if (!err) {
            let diffBlock = blockchaininfo.headers - lastScanedBlock.lastBlock;
            for (let i = 0; i <= diffBlock; i++) {
                try {
                    let blockhash = await getBCHBlockHash(lastScanedBlock.lastBlock + i);
                    if (typeof blockhash !== 'undefined' && blockhash !== null) {
                        lastScanedBlock.i = i;
                        lastScanedBlock.isLastBlock = true;
                        await receiveBCHTransaction(lastScanedBlock, blockhash, blkRes.symbol);
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
 * send receive bch transaction
 */
let receiveBCHTransaction = async (lastBlockInfo, blockhash, symbol) => {
    try {
        return new Promise(async (resolve, reject) => {
            if (typeof symbol !== 'undefined' && symbol && symbol !== '') {
                if (typeof blockhash !== 'undefined' && blockhash !== null) {
                    let block = await getBCHBlock(blockhash);
                    if (typeof block !== 'undefined' && block !== null) {
                        if (typeof block.tx !== 'undefined' && block.tx !== null) {
                            for (let index = 0; index < block.tx.length; index++) {
                                try {
                                    let data = await getBCHTransaction(block.tx[index])
                                    if (typeof data !== 'undefined' && data !== null) {
                                        let bchTransaction = data.details.filter(el => el.category == 'receive')
                                        bchTransaction.forEach(async (bchvalue) => {
                                            await Wallets.find({ 'bitcoincash.address': bchvalue.address }).exec((walletErr, walletData) => {
                                                if (!walletErr) {
                                                    SendReceiveTrx.findOne({ txId: data.txid, }, (error, txnCheck) => {
                                                        if (!error) {
                                                            if (txnCheck == null) {
                                                                if (walletData.length > 0) {
                                                                    if (bchvalue.category === 'receive') {
                                                                        let receivetransaction = { senderAddress: '', receiverAddress: bchvalue.address, amount: bchvalue.amount, trnxType: 'receive', trnxn_Obj: data, txId: data.txid, trnxFee: '', userId: walletData[0]._id, timestamp: data.timereceived, TrnxStatus: data.confirmations > 8 ? "success" : "pending", currencyType: 'BCH' }
                                                                        SendReceiveTrx.create(receivetransaction, async (error, txnSaved) => {
                                                                            if (txnSaved) {
                                                                                // pusher.trigger('my-channel', 'bch-trans', {
                                                                                //     //	bchbalance: balance,
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
                                                                                    const balance = await getBCHBalance(walletData.wallets.bitcoincash.name);
                                                                                }
                                                                            } else {
                                                                                reject('error in sendbchtoaddress.create receive bch');
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
        console.log("Error in catch block for checkBCHblock", e)
    }
}



let getSendReceiveTransactionBitCoinCash = async () => {
    try {
        let txidRecords;
        Wallets.find({ symbol: 'BCH' }, async (err, wallet) => {
            if (err) {
                console.log(err);
            } else {
                if (wallet) {
                    for (let i = 0; i < wallet.length; i++) {
                        if (wallet[i].account_name) {
                            txidRecords = await getBCHListTransaction(wallet[i].account_name, 200);
                            if (isEmpty(txidRecords)) {
                                console.log('No transaction is avialble for this account');
                            } else {
                                txidRecords.forEach(element => {
                                    if (element.confirmations === 0) {
                                        console.log('Transaction is not confirmed yet');
                                    } else {
                                        let filterReceive = {};
                                        let filterSend = {};
                                        if (element.account === wallet[i].account_name) {
                                            if (wallet[i].userId) {
                                                filterSend = { userId: wallet[i].userId, txId: element.txid, currencyType: 'BCH', trnxType: 'send' };
                                                filterReceive = { userId: wallet[i].userId, txId: element.txid, currencyType: 'BCH', trnxType: 'receive' }
                                            } else if (wallet[i].adminId) {
                                                filterSend = { adminId: wallet[i].adminId, txId: element.txid, currencyType: 'BCH', trnxType: 'send' };
                                                filterReceive = { adminId: wallet[i].adminId, txId: element.txid, currencyType: 'BCH', trnxType: 'receive' }
                                            }
                                            if (element.category === 'receive') {
                                                SendReceiveTrx.findOne(filterReceive).then((foundReceivedTransaction) => {
                                                    if (!foundReceivedTransaction) {
                                                        let newReceived = SendReceiveTrx({
                                                            receiverAddress: wallet[i].address,
                                                            amount: element.amount,
                                                            txId: element.txid,
                                                            userId: wallet[i].userId,
                                                            adminId: wallet[i].adminId,
                                                            currencyType: "BCH",
                                                            trnxType: "receive",
                                                            trnxn_Obj: element,
                                                            timestamp: element.timereceived * 1000,
                                                            TrnxStatus: 'success',
                                                        });
                                                        newReceived.save(async ( err, recievedSaved) => {
                                                            if (err) {
                                                                console.log(err)
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
                                                                
                                                                await bitcoincashBalance(wallet[i].account_name).then(async (userbitcoincashBalance: any) => {
                                                                    await Wallets.findOneAndUpdate(balanceFilter, { balance: userbitcoincashBalance }).then(async (result) => {
                                                                        if (result) {
                                                                            ioSocketss.emit(`sendReceive_${socketFilter.id}`, { symbol: wallet[i].symbol, transaction: recievedSaved, balance: userbitcoincashBalance});
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
                                                            amount: (element.amount * -1),
                                                            txId: element.txid,
                                                            userId: wallet[i].userId,
                                                            adminId: wallet[i].adminId,
                                                            currencyType: "BCH",
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
                                        }
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







export {
    activateBCH,
    bchTnxFee,
    sendBCHToOther,
    bitcoincashBalance
}