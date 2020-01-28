import { User } from "../../db/models/users/users.model";
import { Wallets } from "../../db/models/Wallets/wallet.model";
import { newAccount, getBalance, unlockAddress, sendTransaction, } from "../../services/WalletService/eth.Service";
import { SendReceiveTrx } from "../../db/models/Wallets/sendReceiveTransaction.model";
import * as Web3 from 'web3';
import { Blocks } from "../../db/models/Wallets/block.model";
import * as cron from 'node-cron';
import * as request from 'request';
import { Trade } from "../../db/models/Wallets/trade.model";
import { AdminTradeWallet } from "../../db/models/Wallets/adminTrade.model";
import { UserProfile } from "../../db/models/users/userProfile.model";
import { userCryptoTradeBalance } from "../../services/WalletService/trade.service";
import { TradeWallet } from "../../db/models/Wallets/trade.wallet.model";
import { activateUserToken } from "./userCryptoInfo.controller";
import { ioSocketss } from "../..";
import { EmailTemplate } from "../../db/models/emailTemplate/emailTemplate.model";
import { sender } from "../../config/config";
import { mailer } from "../../services/UserService/mail.service";

// main net ethereum
const urlWebsocket = 'ws://18.185.101.73:9546';
const web3s = new Web3(new Web3.providers.WebsocketProvider(urlWebsocket));



function isEmpty(obj) {
    for (var key in obj) {
        if (obj.hasOwnProperty(key))
            return false;
    }
    return true;
}


cron.schedule('*/15 * * * * *', () => {
    sendReceiveTransactionEthereum();
    // ethereumBlockManager();
});









/**
 * getting estimated fee
 */
let estimatedFee = async (req, res, next) => {
    try {
        // let fee = await getEstimatedGas()
        // res.status(200).json({etherumFee: fee});
    } catch (error) {
        console.log(error);
    }
};


/**
 * activating eth wallet controller
 * @param userId 
 */
let activateETH = async (req, res, next) => {
    try {
        let { currencyId, symbol, title } = req.body;
        User.findOne({ _id: req.user.id }, async (err, user) => {
            if (err || user === null) {
                res.status(200).json({ success: false, msg: err, type: 'activate ETH' });
            } else {
                let ethWalletPassword = `ethereum_${user.firstname}_${Date.now()}`;
                let ethAddress = await newAccount(ethWalletPassword);
                // let ethAddress = {address: 'dfndsfhskfhksjdfhkjdsfjksdf', key: 'dsfbjsdfjdsbfjsbfjbfjbsjdfbjdsf'};
                if (ethAddress) {
                    let etheremData = { address: ethAddress.address, password: ethAddress.key, account_name: ethWalletPassword, status: true };
                    await Wallets.findOneAndUpdate({ symbol: 'ETH', userId: req.user.id }, etheremData, { new: true }).then((result) => {
                        if (result) {
                            res.status(200).json({ success: true, msg: `${result.title} is activated!`, type: 'ethereum wallet activated!' });
                            activateUserToken(req, res, next);
                        }
                    }).catch((error) => {
                        console.log(error);
                        res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'activate ETH' });
                    });
                } else {
                    res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'activate ETH' });
                }
            }
        });
    } catch (error) {
        res.status(200).json({ success: false, msg: error, type: 'activate ETH' });
        console.log(error);
    }
};





/**
 * getting etherum balance from node
 * @param address 
 */
let etherumBalance = async (address) => {
    return new Promise(async (resolve, reject) => {
        try {
            await getBalance(address).then((ethBalance) => {
                resolve(ethBalance);
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
 * send eth to another user
 */
let sendEthToOther = (req, res, next) => {
    try {

        let { cryptoAmount, ethWithFee, receiversAddress, currencyId } = req.body;
        let amoutToTransfer = cryptoAmount;
        let amountToTransferWithFee = ethWithFee;

        Wallets.findOne({ userId: req.user.id, currencyId: currencyId }, async (err, wallets) => {
            if (err) {
                res.status(200).json({ success: false, msg: "Insufficient Balance" });
            } else {
                let userEthAddress = wallets.address;
                let userEthAddressPass = wallets.password;
                let ethereumBalance = await getBalance(userEthAddress);
                let realBalance = ethereumBalance / 1000000000000000000;
                if (cryptoAmount > realBalance) {
                    res.status(200).json({ success: false, msg: "Your ethereum balance is insufficient!", type: 'send ETH to other user' });
                } else {
                    let unlock = await unlockAddress(userEthAddress, userEthAddressPass);
                    if (unlock) {
                        let data = await sendTransaction(userEthAddress, receiversAddress, amoutToTransfer);
                        let details = new SendReceiveTrx({
                            senderAddress: userEthAddress,
                            receiverAddress: receiversAddress,
                            amount: amoutToTransfer,
                            txId: data.transactionHash,
                            userId: req.user.id,
                            currencyType: 'ETH',
                            trnxType: 'send'
                        });
                        details.save(async (err, ethDoc) => {
                            if (err) {
                                res.status(200).json({ success: false, msg: "Insufficient Balance" });
                            } else {
                                res.success(200).json({ success: true, msg: `${cryptoAmount} ethereum transfer to the ${receiversAddress}` });
                                await etherumBalance(userEthAddress).then(async (ethereumBalance: any) => {
                                    let updatedBalance = ethereumBalance / 1000000000000000000;
                                    await Wallets.findOneAndUpdate({ userId: req.user.id, currencyId: currencyId }, { balance: updatedBalance }).then((result) => {
                                        if (result) {
                                            ioSocketss.emit(`sendReceive_${req.user.id}`, {symbol: wallets.symbol, transaction: ethDoc, balance: updatedBalance});
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
}



/**
 * ethereum send receive transaction block manager
 */
let ethereumBlockManager = async () => {
    try {
        web3s.eth.subscribe('newBlockHeaders', async (error, result) => {
            if (!error && result) {
                return;
            } else {
                console.error("Error in web3s.eth.subscribe", error.message);
            }
        }).on("data", async (blockHeader) => {
            if (blockHeader !== null) {
                if (blockHeader.number) {
                    await Blocks.findOne({ symbol: 'ETH' }).sort({ createdAt: -1 }).exec(async (blkErr, blkRes) => {
                        var blkOjb = {
                            symbol: 'ETH',
                            number: blockHeader.number,
                            blockID: blockHeader.hash,
                            parentHash: blockHeader.parentHash,
                            full_block: blockHeader
                        };
                        if (blkErr == null && blkRes == null) {
                            await Blocks.create(blkOjb, async (CrBlkErr, CRBlkRes) => {
                                if (!CrBlkErr && CRBlkRes) {
                                    // console.log("Save New Block")
                                }
                            });
                        } else {
                            if (Object.keys(blkRes).length > 0) {
                                await Blocks.findOneAndUpdate({ symbol: 'ETH' }, blkOjb, async (error, savedBlock) => {
                                    if (!error && savedBlock) {
                                        // console.log("Update Block")
                                    } else {
                                        console.log("Internal Server Error");
                                    }
                                });
                            }
                        }
                        if (blkRes == null) {
                            await singleBlockHandler(blockHeader)
                        } else {
                            if ((blockHeader.number - blkRes.number) == 0) {
                                await singleBlockHandler(blockHeader);
                            } else {
                                await multipleBlockHandler(blockHeader, blkRes);
                            }
                        }
                    });
                }
            }
        }).on("error", (blockHeader) => {
            console.log(blockHeader);
        });
    }
    catch (e) {
        throw e;
    }
};




let singleBlockHandler = async (BlockHeaders) => {
    await web3s.eth.getBlock(BlockHeaders.number).then(async (fetchedBlock) => {
        if (fetchedBlock !== null) {
            await receiveTransaction(fetchedBlock);
        }
    });
};


let multipleBlockHandler = async (fetchedBlock, blkRes) => {
    let diffBlock = fetchedBlock.number - blkRes.number;
    for (let i = 0; i <= diffBlock; i++) {
        await web3s.eth.getBlock(fetchedBlock.number - i).then(async (BlockHeaders) => {
            if (BlockHeaders !== null) {
                await receiveTransaction(BlockHeaders);
            }
        });
    }
};




let receiveTransaction = async (blockHeader) => {
    try {
        if (blockHeader !== null) {
            if (typeof blockHeader.number !== "undefined" && blockHeader.number && blockHeader.number !== '') {
                let block = await web3s.eth.getBlock(blockHeader.hash);
                let txns = block.transactions
                if (txns.length > 0) {
                    txns.forEach(async (Txhash) => {
                        let Txinfo = await web3s.eth.getTransaction(Txhash);
                        if (typeof Txinfo !== 'undefined' && Txinfo !== null) {
                            if (Txinfo.to !== null) {
                                await Wallets.find({ "ethereum.address": { $regex: new RegExp("^" + Txinfo.to.toLowerCase(), "i") } }, async (err, walletData) => {
                                    if (err) {
                                        console.log("err", err)
                                    } else {
                                        SendReceiveTrx.findOne({ txId: Txinfo.hash, trnxType: 'receive', currencyType: 'ETH' }, async (error, txnCheck) => {
                                            if (walletData.length > 0) {
                                                walletData.forEach(async (result) => {
                                                    var userid = result._id;
                                                    await Wallets.findOne({ _id: result.userid }, async (error, user) => {
                                                        var amount = web3s.utils.fromWei(Txinfo.value, 'ether');
                                                        if (error) {
                                                            console.log("error", error)
                                                        } else {
                                                            var txn = Txinfo
                                                            var userDetails = user
                                                            var walletDetails = result
                                                            try {
                                                                var receivetransaction = {
                                                                    receiverAddress: txn.to,
                                                                    senderAddress: txn.from,
                                                                    amount: amount,
                                                                    txId: txn.hash,
                                                                    userId: userid,
                                                                    currencyType: 'ETH',
                                                                    type: 'receive',
                                                                }
                                                                var updatedBalance = Number(walletDetails.balance) + Number(amount);
                                                            }
                                                            catch (e) {
                                                                console.log(e);
                                                            }
                                                            var walletUpdateObj = {
                                                                balance: Number(updatedBalance.toFixed(6))
                                                            }
                                                            SendReceiveTrx.find({ txId: txn.hash }, async (error, txnCheck) => {
                                                                if (error) {
                                                                    console.log("error 1768", error)
                                                                } else if (txnCheck.length == 0) {
                                                                    await SendReceiveTrx.create(receivetransaction, async (error, txnSaved) => {
                                                                        if (!error && txnSaved) {
                                                                            let balance = await getBalance(Txinfo.to);
                                                                        } else {
                                                                            console.log('ETH---1814', error)
                                                                        }
                                                                    });
                                                                }
                                                            });
                                                        }
                                                    })
                                                })
                                            }
                                        });
                                    }
                                })
                            }
                        }
                    });
                }
            }
        }
    } catch (e) {
        throw e;
    }
}



/**
 * getting ethereum received and send Transactions from node
 */
let sendReceiveTransactionEthereum = async () => {
    try {
        Wallets.find({ symbol: 'ETH' }, (err, wallet) => {
            if (err) {
                console.log(err);
            } else {
                for (let i = 0; i < wallet.length; i++) {
                    if (wallet[i].address) {
                        let options = {
                            method: 'GET',
                            url: `http://api.etherscan.io/api?module=account&action=txlist&address=${wallet[i].address}&startblock=0&endblock=99999999&sort=asc&apikey=YourApiKeyToken`,
                            qs: {},
                            headers: { 'Postman-Token': 'd4aa52e3-50ce-4b9f-9c1d-4bcd0de3a28e', 'cache-control': 'no-cache', },
                            json: true
                        };
                        request(options, (error, response, body) => {
                            let responsData;
                            if (error) {
                                console.log(error);
                            } else {
                                try {
                                    responsData = body.result;// JSON.parse(body).transactions;
                                } catch (jsonerr) {
                                    console.log(jsonerr);
                                }
                            }
                            if (isEmpty(responsData)) {
                                console.log(`ETH response data is empty  ${responsData}`);
                            } else {

                                let filterSend = {};
                                let filterReceive = {};


                                if (wallet[i].userId) {
                                    filterReceive = { currencyType: "ETH", userId: wallet[i].userId, trnxType: "receive" };
                                    filterSend = { currencyType: "ETH", userId: wallet[i].userId, trnxType: "send" };

                                } else if (wallet[i].adminId) {
                                    filterReceive = { currencyType: "ETH", adminId: wallet[i].adminId, trnxType: "receive" };
                                    filterSend = { currencyType: "ETH", adminId: wallet[i].adminId, trnxType: "send" };
                                }

                                let ethRecivedTrx = responsData.filter((val) => wallet[i].address.toUpperCase() === val.to.toUpperCase());

                                SendReceiveTrx.find(filterReceive, (err, receiveTnx) => {
                                    if (err) {
                                        console.log(err);
                                    } else {
                                        if (ethRecivedTrx.length === receiveTnx.length) {
                                            console.log(`Incoming Trx length : ${ethRecivedTrx.length} and available Trx length : ${receiveTnx.length}`);
                                        } else {
                                            ethRecivedTrx.forEach(element => {

                                                let filterReceived = {};

                                                if (wallet[i].userId) {
                                                    filterReceived = { txId: element.hash, currencyType: "ETH", userId: wallet[i].userId, trnxType: "receive" };

                                                } else if (wallet[i].adminId) {
                                                    filterReceive = { txId: element.hash, currencyType: "ETH", adminId: wallet[i].adminId, trnxType: "receive" };
                                                }

                                                SendReceiveTrx.findOne(filterReceived, (trxerror, txnCheck) => {
                                                    if (!trxerror) {
                                                        if (txnCheck === null) {
                                                            let receivetransaction = {
                                                                senderAddress: element.from,
                                                                receiverAddress: element.to,
                                                                amount: web3s.utils.fromWei(element.value, 'ether'),
                                                                txId: element.hash,
                                                                userId: wallet[i].userId,
                                                                adminId: wallet[i].adminId,
                                                                currencyType: 'ETH',
                                                                trnxType: 'receive',
                                                                trnxn_Obj: element,
                                                                timestamp: element.timeStamp * 1000,
                                                                TrnxStatus: element.txreceipt_status > 0 ? 'success' : 'pending',
                                                            }
                                                            SendReceiveTrx.create(receivetransaction, async (saveTrxerr, txnSaved) => {
                                                                if (saveTrxerr) {
                                                                    console.log('Error in saving receive transation');
                                                                } else {
                                                                    let balanceFilter = {};
                                                                    let socketFilter = {
                                                                        id: String
                                                                    };
                                                                    if (wallet[i].userId) {
                                                                        socketFilter.id = wallet[i].userId;
                                                                        balanceFilter = { symbol: 'ETH', userId: wallet[i].userId };
                                                                    } else if (wallet[i].adminId) {
                                                                        socketFilter.id = wallet[i].adminId;
                                                                        balanceFilter = { symbol: 'ETH', adminId: wallet[i].adminId };
                                                                    }
                                                                    await etherumBalance(wallet[i].address).then(async (userethereumBalance: any) => {
                                                                        let updatedBalance = userethereumBalance / 1000000000000000000;
                                                                        await Wallets.findOneAndUpdate(balanceFilter, { balance: updatedBalance }).then(async (result) => {
                                                                            if (result) {
                                                                               // sendReceiveETHPusher(txnSaved, updatedBalance, 'receive');
                                                                                ioSocketss.emit(`sendReceive_${socketFilter.id}`, {symbol: wallet[i].symbol, transaction: txnSaved, balance: updatedBalance});	
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
                                                        }
                                                    }
                                                });
                                            });

                                        }
                                    }
                                });

                                let ethSendTrx = responsData.filter((val) => wallet[i].address.toUpperCase() === val.from.toUpperCase());

                                SendReceiveTrx.find(filterSend, (err, sendTnx) => {
                                    if (err) {
                                        console.log(err);
                                    } else {
                                        if (ethSendTrx.length === sendTnx.length) {
                                            console.log(`Incoming Trx length : ${ethSendTrx.length} and available Trx length : ${sendTnx.length}`);
                                        } else {
                                            let filterSends = {};

                                            ethSendTrx.forEach(element => {
                                                if (wallet[i].userId) {
                                                    filterSends = { txId: element.hash, currencyType: "ETH", userId: wallet[i].userId, trnxType: "send" };

                                                } else if (wallet[i].adminId) {
                                                    filterSends = { txId: element.hash, currencyType: "ETH", adminId: wallet[i].adminId, trnxType: "send" };
                                                }

                                                let sendTransaction = {
                                                    senderAddress: element.to,
                                                    receiverAddress: element.from,
                                                    amount: web3s.utils.fromWei(element.value, 'ether'),
                                                    txId: element.hash,
                                                    userId: wallet[i].userId,
                                                    adminId: wallet[i].adminId,
                                                    currencyType: 'ETH',
                                                    trnxFee: (element.gasUsed * element.gasPrice) / 1000000000000000000,
                                                    trnxType: 'send',
                                                    trnxn_Obj: element,
                                                    timestamp: element.timeStamp * 1000,
                                                    TrnxStatus: element.txreceipt_status > 0 ? 'success' : 'pending',
                                                }
                                                SendReceiveTrx.findOneAndUpdate(filterSends, sendTransaction, { upsert: true, new: true }, (trxerror, txnCheck) => {
                                                    if (trxerror) {
                                                        console.log(trxerror)
                                                    } else {
                                                        let socketFilters: any;
                                                        if (wallet[i].userId) {
                                                            socketFilters = { symbol: 'ETH', Id: wallet[i].userId, updatedBalance : '' };
                                                        } else if (wallet[i].adminId) {
                                                            socketFilters = { symbol: 'ETH', Id: wallet[i].adminId, updatedBalance : ''};
                                                        }
                                                        ioSocketss.emit("sendReceiveETHsend"+socketFilters.Id, socketFilters)	
                                                        console.log('ETH send transaction saved');
                                                    }
                                                });
                                            });

                                        }
                                    }
                                });

                            }
                        });
                    }
                    else {
                        console.log('Addres not Activated');
                    }
                }
            }
        });
    } catch (error) {
        console.log(error);
    }
};



/**
 * transfer ethereum for trade 
 */
let transferEthereumForTrade = async (req, res, next) => {
    try {
        let { topUpamount, cryptoValueInEuro, cryptoCurrentPrice, transactionFee, currencyId } = req.body;
        let { id } = req.user;
        await Wallets.findOne({ userId: id, currencyId: currencyId, status: true }).then(async (wallet) => {
            if (wallet) {
                await etherumBalance(wallet.address).then(async (realBalance: any) => {
                    let nodeBalance = realBalance / 1000000000000000000;
                    if (topUpamount > nodeBalance) {
                        res.status(200).json({ success: false, msg: "Your etherum balance is insufficient!", type: 'low balance' });
                    } else {
                        await Wallets.findOne({ currencyId: currencyId, walletType: 'admin', status: true }).then(async (adminEthereumWallet) => {
                            if (adminEthereumWallet) {
                                await unlockAddress(wallet.address, wallet.account_name).then(async (unlock) => {
                                    if (unlock) {
                                        await sendTransaction(wallet.address, adminEthereumWallet.address, topUpamount).then((result) => {
                                            if (result) {
                                                let addToUserTradeWallet = new Trade({
                                                    userId: id,
                                                    cryptoAmount: topUpamount,
                                                    euroAmount: cryptoValueInEuro,
                                                    cryptoCurrentPrice: cryptoCurrentPrice,
                                                    cryptoType: 'ETH',
                                                    txType: 'privateWallet',
                                                    txId: result.transactionHash,
                                                    type: 'credit',
                                                    status: "completed"
                                                });
                                                addToUserTradeWallet.save(async (err, savedDoc) => {
                                                    if (err) {
                                                        res.status(200).json({ success: false, msg: err, type: 'error in saving' })
                                                    } else {
                                                        let details = new SendReceiveTrx({
                                                            senderAddress: wallet.address,
                                                            receiverAddress: adminEthereumWallet.address,
                                                            amount: topUpamount,
                                                            txId: result.transactionHash,
                                                            userId: id,
                                                            currencyType: 'ETH',
                                                            trnxType: 'send',
                                                            tradeId: addToUserTradeWallet._id
                                                        });
                                                        details.save(async (err, ethTransfer) => {
                                                            if (err) {
                                                                res.status(200).json({ success: false, msg: err, type: 'err in transfer' });
                                                            } else {
                                                                await userCryptoTradeBalance(id, 'ETH').then(async (userethereumBalance) => {
                                                                    await TradeWallet.findOneAndUpdate({userId: id, currencyId: currencyId },  { balance: userethereumBalance }).then(async (result) => {
                                                                        await etherumBalance(wallet.address).then(async (ethereumBalance: any) => {
                                                                            await Wallets.findOneAndUpdate({ userId: req.user.id, currencyId: currencyId }, { balance: ethereumBalance }).then((result) => {
                                                                                if (result) {
                                                                                    ioSocketss.emit(`sendReceiveTrade_${id}`, { symbol: wallet.symbol, transaction: savedDoc, balance: userethereumBalance});
                                                                                    ioSocketss.emit(`sendReceive_${req.user.id}`, {symbol: wallet.symbol, transaction: ethTransfer, balance: ethereumBalance});
                                                                                    res.status(200).json({ success: true, msg: `${topUpamount} ethereum added to your trade wallet` });
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
                                                    cryptoType: 'ETH',
                                                    txType: 'userPrivateWallet',
                                                    txId: result.transactionHash,
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
            }
        }).catch((error) => {
            res.status(200).json({ success: false, msg: error, type: 'error in saving' })
        });

    } catch (error) {
        console.log(error)
    }
};


/**
 * withdraw eth form trade
 */
let withdrawalEthFromTrade = async (req, res, next) => {
    try {
        let { coinType, withdrawAmount, withdrawAmountInEuro, cryptoCurrentPrice, cryptoTransactionFee, verifyCode, currencyId } = req.body;
        let { id } = req.user;
        let amoutToTransferWithFee = parseFloat(withdrawAmount) + parseFloat(cryptoTransactionFee);
        await UserProfile.findOne({ userId: id }).then(async (user) => {
            if (user) {
                if (user.smscode === verifyCode) {
                    await userCryptoTradeBalance(id, 'ETH').then((ethTradeResult) => {
                        if (withdrawAmount > ethTradeResult) {
                            res.status(200).json({ success: false, msg: "Your balance is insufficient!", type: "balance insufficent" });
                        } else {
                            let deductFromUserTradeWallet = new Trade({
                                userId: id,
                                cryptoAmount: -withdrawAmount,
                                euroAmount: withdrawAmountInEuro,
                                cryptoCurrentPrice: cryptoCurrentPrice,
                                cryptoType: 'ETH',
                                txType: 'privateWallet',
                                type: 'debit',
                                status: "completed",
                                withdrawalAmount: parseFloat(withdrawAmount).toFixed(8),
                                // withdrawalFee: parseFloat(cryptoTransactionFee).toFixed(8),
                                withdrawalStatus: "pending",
                            });
                            deductFromUserTradeWallet.save(async (err, savedDoc) => {
                                if (err) {
                                    res.status(200).json({ success: false, msg: err, type: 'error in saving ' });
                                } else {
                                    res.status(200).json({ success: true, msg: "Withdrawal Request Generated", type: "withdrawalsuccess" });
                                    await userCryptoTradeBalance(id, 'ETH').then(async (userethereumBalance) => {
                                        await TradeWallet.findOneAndUpdate({userId: id, currencyId: currencyId },  { balance: userethereumBalance }).then((result) => {
                                            ioSocketss.emit(`sendReceiveTrade_${id}`, { symbol: 'ETH', transaction: savedDoc, balance: userethereumBalance});
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
                    res.status(200).json({ success: false, msg: 'Your code in invalid!', type: 'code invalid' });
                }
            }
        }).catch((error) => {
            res.status(200).json({ success: false, msg: error, type: 'error in saving' })
        });
    } catch (error) {
        console.log(error);
    }
};





/**
 * transfer ethereum from admin personal account to user personal account
 */
let transferEthereumFromAdminToUser = async (req, res, next) => {
    try {
        let { cryptoAmount, cryptoType, userId , recordId } = req.body;
        let { id } = req.admin;

        await Wallets.findOne({ adminId: id, symbol: cryptoType, walletType: 'admin', status: true }).then(async (wallets) => {
            if (wallets) {
                if (cryptoAmount > wallets.balance) {
                    res.status(200).json({ success: false, msg: `Your ${cryptoType} balance is insufficent!`, type: 'balance is not sufficent' });
                } else {
                    await Wallets.findOne({ userId: userId, symbol: cryptoType, walletType: "user", status: true }).then(async (userwallets) => {
                        await sendTransaction(wallets.address, userwallets.address, cryptoAmount).then((result) => {
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
                                            await etherumBalance(wallets.address).then(async (ethBalance: any) => {
                                                await Wallets.findOneAndUpdate({ adminId: id, symbol: cryptoType }, { balance: ethBalance }).then((result) => {
                                                    if (result) {
                                                        Trade.findByIdAndUpdate(recordId, { withdrawalStatus: 'completed' }, (err, result) => {
                                                            if (err) {
                                                                 res.status(200).json({ success: false, msg: err, type: 'error' });
                                                            } else {
                                                                ioSocketss.emit(`sendReceive_${req.admin.id}`, {symbol: wallets.symbol, transaction: btcDoc, balance: ethBalance});
                                                                res.status(200).json({ success: true, msg: `${cryptoAmount} ${cryptoType} transfer to the user!`, type: 'send ETH' });
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
    activateETH,
    sendEthToOther,
    transferEthereumForTrade,
    withdrawalEthFromTrade,
    estimatedFee,
    etherumBalance,
    transferEthereumFromAdminToUser
}