import { SendReceiveTrx } from "../../db/models/Wallets/sendReceiveTransaction.model";
import { Wallets } from "../../db/models/Wallets/wallet.model";
import { getTokenBalance, transferTokenAmount } from "../../services/WalletService/token.service";
import * as request from 'request';
import * as cron from 'node-cron';
import { ioSocketss } from "../..";
import { User } from "../../db/models/users/users.model";
import { EmailTemplate } from "../../db/models/emailTemplate/emailTemplate.model";
import { sender } from "../../config/config";
import { mailer } from "../../services/UserService/mail.service";




// running cron in every five minute
cron.schedule('*/15 * * * * *', () => {
    sendReceiveTokenTransaction();
});





function isEmpty(obj) {
    for (var key in obj) {
        if (obj.hasOwnProperty(key))
            return false;
    }
    return true;
}




let sendEthereumTokenToOthers = async (req, res, next) => {
    try {
        let { id } = req.user;
        let { cryptoAmount, receiverAddress, cryptoToEuro, cryptoWithFee, symbol, currencyId, contractAddress, type } = req.body;
        await Wallets.findOne({ userId: id, symbol: symbol, currencyId: currencyId, contractAddress: contractAddress }).then(async (wallet) => {
            if (!wallet) {
                res.status(200).json({ success: false, msg: 'No wallet found!', type: 'wallet not exist' });
            } else {
                let userTokenAddress = wallet.address;
                let userTokenPassword = wallet.password;
                await getTokenBalance(userTokenAddress, contractAddress).then(async (tokenBalance) => {
                    if (cryptoAmount > tokenBalance) {
                        res.status(200).json({ success: false, msg: `Your ${wallet.title} balance is insufficent!` });
                    } else {
                        await transferTokenAmount(contractAddress, userTokenAddress, userTokenPassword, receiverAddress, cryptoAmount).then((result: any) => {
                            if (result) {
                                let details = new SendReceiveTrx({
                                    senderAddress: userTokenAddress,
                                    receiverAddress: receiverAddress,
                                    amount: cryptoAmount,
                                    txId: result.transactionHash,
                                    userId: req.user.id,
                                    currencyType: wallet.symbol,
                                    trnxType: 'send'
                                });
                                details.save(async (err, savedDoc) => {
                                    if (err) {
                                        res.status(200).json({ success: false, msg: err, type: 'error in saving' });
                                    } else {
                                        res.status(200).json({ success: true, msg: `${cryptoAmount} ${wallet.title} transfer to the ${receiverAddress}!`, type: 'save in db' });
                                        await getTokenBalance(userTokenAddress, contractAddress).then(async (tokenBalance: any) => {
                                            await Wallets.findOneAndUpdate({ userId: id, symbol: symbol, currencyId: currencyId, contractAddress: contractAddress }, { balance: tokenBalance }).then((result) => {
                                                if (result) {
                                                    ioSocketss.emit(`sendReceive_${id}`, {symbol: wallet.symbol, transaction: savedDoc, balance: tokenBalance});
                                                }
                                            }).catch((error) => {
                                                res.status(200).json({ success: false, msg: error, type: 'Error in token' });
                                            });
                                        }).catch((error) => {
                                            res.status(200).json({ success: false, msg: error, type: 'Error in token' });
                                        });
                                    }
                                });
                            }
                        }).catch((error) => {
                            res.status(200).json({ success: false, msg: error, type: 'Error in token' });
                        });
                    }
                }).catch((error) => {
                    res.status(200).json({ success: false, msg: error, type: 'Error in token' });
                });
            }
        }).catch((error) => {
            res.status(200).json({ success: false, msg: error, type: 'Error in token' });
        });

    } catch (error) {
        res.status(200).json({ success: false, msg: error, type: 'Error in token' });
    }

};






/**
 * send receive transaction of token from node
 */
let sendReceiveTokenTransaction = async () => {
    try {
        await Wallets.find({ type: 'erc20', status: true }).then(async (wallet) => {
            if (wallet) {
                for (let i = 0; i < wallet.length; i++) {
                    if (wallet[i].address) {
                        var options = {
                            method: 'GET',
                            url: `https://api.etherscan.io/api?module=account&action=tokentx&contractaddress=${wallet[i].contractAddress}&address=${wallet[i].address}&offset=9999`,
                            headers:
                            {
                                'Postman-Token': '9aab1b7e-156f-4168-becc-a32c59de7f93',
                                'cache-control': 'no-cache'
                            },
                            json: true
                        };
                        request(options, (error, response, body) => {
                            if (error) {
                                console.log(error);
                            } else {
                                let records = body
                                if (isEmpty(records.result)) {
                                    console.log('No Transaction found');
                                } else {


                                    let receiveTnx = records.result.filter((value) => value.to === wallet[i].address.toLowerCase())
                                    let sendTnx = records.result.filter((value) => value.from === wallet[i].address.toLowerCase());

                                    let sendFilter = {};
                                    let receiveFilter = {};


                                    receiveTnx.forEach(async receiveElement => {
                                        if (wallet[i].userId) {
                                            receiveFilter = { userId: wallet[i].userId, txId: receiveElement.hash, currencyType: wallet[i].symbol, trnxType: 'receive' };
                                        } else if (wallet[i].adminId) {
                                            receiveFilter = { adminId: wallet[i].adminId, txId: receiveElement.hash, currencyType: wallet[i].symbol, trnxType: 'receive' };
                                        }
                                        await SendReceiveTrx.findOne(receiveFilter).then((reciveTransactions) => {
                                            if (reciveTransactions === null) {
                                                let receiveTransaction = {
                                                    senderAddress: receiveElement.from,
                                                    receiverAddress: receiveElement.to,
                                                    amount: parseFloat(receiveElement.value) / 1000000000000000000,
                                                    txId: receiveElement.hash,
                                                    userId: wallet[i].userId,
                                                    adminId: wallet[i].adminId,
                                                    currencyType: wallet[i].symbol,
                                                    trnxType: 'receive',
                                                    trnxn_Obj: receiveElement,
                                                    timestamp: new Date(receiveElement.timeStamp * 1000),
                                                    TrnxStatus: receiveElement.confirmations > 0 ? 'success' : 'pending',
                                                }
                                                // console.log(receiveTransaction);

                                                SendReceiveTrx.create(receiveTransaction, async (saveTrxerr, txnSaved) => {
                                                    if (saveTrxerr) {
                                                        console.log("error in send recive trxes MKR");
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
                                                        await getTokenBalance(wallet[i].address, wallet[i].contractAddress).then(async (tokenBalance: any) => {
                                                            await Wallets.findOneAndUpdate(balanceFilter, { balance: tokenBalance }).then(async (result) => {
                                                                if (result) {
                                                                    ioSocketss.emit(`sendReceive_${socketFilter.id}`, {symbol: wallet[i].symbol, transaction: txnSaved, balance: tokenBalance});
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
                                                                                        emailHTML = emailHTML.replace("{crypto_amount}", receiveTransaction.amount);
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
                                                                                        emailHTML = emailHTML.replace("{crypto_amount}", receiveTransaction.amount);
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
                                                console.log( wallet[i].symbol, 'Transaction is already exist!');
                                            }
                                        });

                                    });



                                    sendTnx.forEach(async sendElement => {
                                        if (wallet[i].userId) {
                                            sendFilter = { userId: wallet[i].userId, txId: sendElement.hash, currencyType: wallet[i].symbol, trnxType: 'send' }
                                        } else if (wallet[i].adminId) {
                                            sendFilter = { adminId: wallet[i].adminId, txId: sendElement.hash, currencyType: wallet[i].symbol, trnxType: 'send' }
                                        }
                                        await SendReceiveTrx.findOne(sendFilter).then((sendTrx) => {
                                            if (sendTrx === null) {
                                                let sendTransaction = {
                                                    senderAddress: sendElement.from,
                                                    receiverAddress: sendElement.to,
                                                    amount: parseFloat(sendElement.value) / 1000000000000000000,
                                                    txId: sendElement.hash,
                                                    userId: wallet[i].userId,
                                                    adminId: wallet[i].adminId,
                                                    currencyType: wallet[i].symbol,
                                                    trnxType: 'send',
                                                    trnxFee: (sendElement.gasUsed * sendElement.gasPrice) / 1000000000000000000,
                                                    trnxn_Obj: sendElement,
                                                    timestamp: new Date(sendElement.timeStamp * 1000),
                                                    TrnxStatus: sendElement.confirmations > 0 ? 'success' : 'pending',
                                                }
                                                SendReceiveTrx.create(sendTransaction, async (saveTrxerr, txnSaved) => {
                                                    if (!saveTrxerr) {
                                                        console.log('MKR transaction saved!')
                                                    } else {
                                                        console.log("error in send recive trxes MKR");
                                                    }
                                                });
                                            } else {
                                                console.log('MKR Transaction is already exist!');
                                            }
                                        }).catch((error) => { });

                                    });
                                }
                            }
                        });
                    }
                }
            }
        }).catch((error) => { });

    } catch (error) {
        console.log(error);
    }
};




export {
    sendEthereumTokenToOthers
}
