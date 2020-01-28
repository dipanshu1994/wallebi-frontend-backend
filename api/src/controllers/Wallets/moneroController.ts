import { User } from "../../db/models/users/users.model";
import { activateMoneroWalletService } from "../../services/WalletService/monero.Service";
import { Wallets } from "../../db/models/Wallets/wallet.model";
import { exec } from "child_process";
import { SendReceiveTrx } from "../../db/models/Wallets/sendReceiveTransaction.model";
import * as cron from 'node-cron';
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
    sendReceiveXmrTransactions();
});



/**
 * activating monero account
 * @param req 
 * @param res 
 * @param next 
 */
let activateMonero = async (req, res, next) => {
    try {
        let { currencyId, symbol, title } = req.body;
        User.findOne({ _id: req.user.id }, async (err, user) => {
            if (err || user === null) {
                res.status(200).json({ success: false, msg: err, type: 'activate Monero' });
            } else {
                let walletName = `monero_${user.firstname}_${Date.now()}`;
                try {
                    let moneroData;
                    await activateMoneroWalletService(walletName).then((cb) => {
                        moneroData = cb;
                    }).catch((error) => {
                        console.log(error);
                    });
                    if (moneroData) {
                        let moneroWallet = { address: moneroData.address, account_name: moneroData.name, account_index: moneroData.account_index, status: true };
                        await Wallets.findOneAndUpdate({ currencyId: currencyId, userId: req.user.id }, moneroWallet, { new: true }).then((result) => {
                            if (result) {
                                res.status(200).json({ success: true, msg: `${result.title} is activated!`, type: 'monero wallet activated!' });
                            }
                        }).catch((error) => {
                            console.log(error);
                            res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'activate XMR' });
                        });
                    } else {
                        res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'activate XMR' });
                    }

                } catch (error) {
                    console.log(error);
                }
            }
        });
    } catch (error) {
        console.log(error)
    }
};




/**
* getting monero  balance from bode
* @param userXmrAccountIndex 
*/
let moneroBalance = async (userXmrAccountIndex) => {
    return new Promise(async (resolve, reject) => {
        try {
            exec("curl -u ravi:123456 --digest -X POST http://18.184.224.23:18081/json_rpc -d '{\"jsonrpc\":\"2.0\",\"id\":\"0\",\"method\":\"get_balance\",\"params\":{\"account_index\":" + userXmrAccountIndex + "}}' -H 'Content-Type: application/json'", function (error, stdout, stderr) {
                let getJsonResp = JSON.parse(stdout);
                let getBalance = getJsonResp.result.balance;
                let senderBalance = getBalance / 1000000000000;
                resolve(senderBalance);
            });
        } catch (error) {
            reject(error);
        }
    });
};



/**
 * send XMR to to other
 */
let sendXmrToOther = async (req, res) => {
    try {
        let { cryptoAmount, xmrWithFee, receiverAddress, currencyId } = req.body;
        let amountToTransfer = cryptoAmount;

        let amountToTransferWithFee = xmrWithFee;

        Wallets.findOne({ userId: req.user.id, currencyId: currencyId }, async (err, wallets) => {
            if (err) {
                res.status(200).json({ status: "false", msg: "Insufficient Balance" });
            } else {
                let xmrQuantity = parseFloat(amountToTransfer).toFixed(8);
                let xmrQuantityWithFee = Number(parseFloat(amountToTransferWithFee).toFixed(8));

                let userXmrAddress = wallets.address;
                let userXmrAccount = wallets.account_name;
                let userXmrAccountIndex = wallets.account_index;

                exec("curl -u ravi:123456 --digest -X POST http://18.184.224.23:18081/json_rpc -d '{\"jsonrpc\":\"2.0\",\"id\":\"0\",\"method\":\"get_balance\",\"params\":{\"account_index\":" + userXmrAccountIndex + "}}' -H 'Content-Type: application/json'", function (error, stdout, stderr) {
                    let getJsonResp = JSON.parse(stdout);
                    let getBalance = getJsonResp.result.balance;
                    let senderBalance = getBalance / 1000000000000;
                    if (senderBalance < xmrQuantityWithFee) {
                        res.status(200).json({ success: false, msg: "Insufficient Balance", type: 'Send XMR to ohter' });
                    } else {
                        let transferAmt = Number(xmrQuantity) * 1000000000000;
                        exec("curl -u ravi:123456 --digest -X POST http://18.184.224.23:18081/json_rpc -d '{\"jsonrpc\":\"2.0\",\"id\":\"0\",\"method\":\"transfer\",\"params\":{\"destinations\":[{\"amount\":" + transferAmt + ",\"address\":\"" + receiverAddress + "\"}],\"account_index\":" + userXmrAccountIndex + ",\"subaddr_indices\":[0],\"priority\":0,\"ring_size\":7,\"get_tx_key\": true}}' -H 'Content-Type: application/json'", async (error, stdout, stderr) => {
                            let getJsonRespResult = JSON.parse(stdout);
                            if (getJsonResp.result !== undefined) {
                                let details = {
                                    senderAddress: userXmrAddress,
                                    receiverAddress: receiverAddress,
                                    amount: transferAmt,
                                    txId: getJsonRespResult.result.tx_hash,
                                    userId: req.user.id,
                                    currencyType: 'XMR',
                                    trnxType: 'send',
                                    trnxFee: getJsonRespResult.result.fee,
                                    trnxn_Obj: getJsonRespResult,
                                    TrnxStatus: 'pending'
                                };
                                SendReceiveTrx.create(details, async (savTrxerr, savTrxresp) => {
                                    if (savTrxerr) {
                                        res.status(200).json({ status: "false", msg: "Insufficient Balance", dta: stdout });
                                    } else {
                                        res.status(200).json({ status: "true", msg: `${transferAmt} transfer to the ${receiverAddress}!`, dta: stdout });
                                        await moneroBalance(userXmrAccountIndex).then(async (moneroBalance: any) => {
                                            await Wallets.findOneAndUpdate({ userId: req.user.id, currencyId: currencyId }, { balance: moneroBalance }).then((result) => {
                                                if (result) {
                                                    res.status(200).json({ success: true, msg: `${amountToTransfer} bitcoin transfer to ${receiverAddress}` });
                                                    ioSocketss.emit(`sendReceive_${req.user.id}`, {symbol: wallets.symbol, transaction: savTrxresp, balance: moneroBalance});
                                                }
                                            }).catch((error) => {
                                                console.log(error);
                                            });
                                        });
                                    }
                                });
                            } else {
                                console.log(stderr);
                            }
                        });
                    }
                });
            }
        });
    } catch (error) {
        console.log(error);
    }
};



/**
 * send receive transaction from block chian node
 */
let sendReceiveXmrTransactions = async () => {
    try {
        exec("curl -u ravi:123456 --digest -X POST http://18.184.224.23:18081/json_rpc -d '{\"jsonrpc\":\"2.0\",\"id\":\"0\",\"method\":\"get_accounts\",\"params\":{\"tag\":\"\"}' -H 'Content-Type: application/json'", async (error, getaccounts, stderr) => {

            let getJsonResponse = JSON.parse(getaccounts).result.subaddress_accounts;
            for (let index = 0; index < getJsonResponse.length; index++) {
                try {
                    exec("curl -u ravi:123456 --digest -X POST http://18.184.224.23:18081/json_rpc -d '{\"jsonrpc\":\"2.0\",\"id\":\"0\",\"method\":\"get_transfers\",\"params\":{\"in\":true,\"out\":true,\"account_index\":" + getJsonResponse[index].account_index + "}' -H 'Content-Type: application/json' ", async (error, stdout, stderr) => {
                        try {
                            let getJsonResp = JSON.parse(stdout);
                            let xrpTrnx = getJsonResp.result.in
                            let xrpTrnxOut = getJsonResp.result.out
                            if (isEmpty(getJsonResp.result)) {
                                console.log("no trx for this user");
                            }
                            else {
                                for (let i = 0; i < xrpTrnx.length; i++) {
                                    await Wallets.findOne({ symbol: "XMR", address: xrpTrnx[i].address }).exec(async (walletErr, wallet) => {
                                        if (walletErr) {
                                            console.log("walletErr", walletErr);
                                        } else {
                                            if (wallet) {
                                                let receiveFilter = {}

                                                if (wallet.userId) {
                                                    receiveFilter = { userId: wallet.userId, currencyType: wallet.symbol, trnxType: 'receive' };
                                                } else if (wallet.adminId) {
                                                    receiveFilter = { adminId: wallet.adminId, currencyType: wallet.symbol, trnxType: 'receive' };
                                                }


                                                SendReceiveTrx.find(receiveFilter, async (fndTrxerr, fndTrxDoc) => {
                                                    if (fndTrxerr) {
                                                        throw fndTrxerr
                                                    } else {
                                                        if (fndTrxDoc.length == getJsonResp.result.in.length) {
                                                            console.log('Received XMr TRx already updated');
                                                        } else {

                                                            SendReceiveTrx.findOne({ txId: xrpTrnx[i].txid, currencyType: wallet.symbol, trnxType: 'receive' }, async (error, txnCheck) => {
                                                                if (error) { console.log('this trx is already available'); }
                                                                else {
                                                                    if (txnCheck == null) {
                                                                        let receivetransaction = {
                                                                            senderAddress: '',
                                                                            receiverAddress: xrpTrnx[i].address,
                                                                            amount: xrpTrnx[i].amount/1000000000000,
                                                                            txId: xrpTrnx[i].txid,
                                                                            userId: wallet.userId,
                                                                            adminId: wallet.adminId,
                                                                            currencyType: 'XMR',
                                                                            trnxType: 'receive',
                                                                            trnxFee: xrpTrnx[i].fee/1000000000000,
                                                                            trnxn_Obj: xrpTrnx[i],
                                                                            timestamp: xrpTrnx[i].timestamp * 1000,
                                                                            TrnxStatus: xrpTrnx[i].confirmations > 0 ? 'success' : 'pending',
                                                                        }
                                                                        await SendReceiveTrx.create(receivetransaction, async (error, txnSaved) => {
                                                                            if (error) {
                                                                                console.log("error in receive create receive XMR", error);
                                                                            } else {
                                                                                let balanceFilter = {};
                                                                                let socketFilter = {
                                                                                    id: String
                                                                                };
                                                                                if (wallet.userId) {
                                                                                    socketFilter.id = wallet.userId;
                                                                                    balanceFilter = { symbol: wallet.symbol, userId: wallet.userId };
                                                                                } else if (wallet.adminId) {
                                                                                    socketFilter.id = wallet.adminId;
                                                                                    balanceFilter = { symbol: wallet.symbol, adminId: wallet.adminId };
                                                                                }
                                                                                await moneroBalance(wallet.account_index).then(async (moneroBalance: any) => {
                                                                                    await Wallets.findOneAndUpdate(balanceFilter, { balance: moneroBalance }).then(async (result) => {
                                                                                        if (result) {
                                                                                            // sendReceiveXMRPusher(txnSaved, moneroBalance, 'receive');
                                                                                            ioSocketss.emit(`sendReceive_${socketFilter.id}`, {symbol: wallet.symbol, transaction: txnSaved, balance: moneroBalance});	
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
                                                                        console.log('this receive trx is available in table');
                                                                    }
                                                                }
                                                            });
                                                        }
                                                    }
                                                });
                                            }

                                        }
                                    });
                                }

                                for (let i = 0; i < xrpTrnxOut.length; i++) {

                                    await Wallets.findOne({ symbol: "XMR", address: xrpTrnxOut[i].address }).exec(async (walletErr, wallet) => {
                                        if (walletErr) {
                                            console.log("walletErr", walletErr);
                                        } else {

                                            if (wallet) {

                                                let sendFilter = {};
                                                if (wallet.userId) {
                                                    sendFilter = { userId: wallet.userId, currencyType: 'XMR', trnxType: 'send' };
                                                } else if (wallet.adminId) {
                                                    sendFilter = { adminId: wallet.adminId, currencyType: 'XMR', trnxType: 'send' };
                                                }


                                                SendReceiveTrx.find(sendFilter, async (fndTrxerr, fndTrxDoc) => {
                                                    if (fndTrxerr) { throw fndTrxerr }
                                                    else {
                                                        if (fndTrxDoc.length == xrpTrnxOut.length) {
                                                            console.log('Send XMr TRx already updated');
                                                        }
                                                        else {
                                                            await SendReceiveTrx.findOne({ txId: xrpTrnxOut[i].txid, currencyType: 'XMR', trnxType: 'send' }, (error, txnCheck) => {
                                                                if (error) {
                                                                    console.log('this send trx is already available');
                                                                } else {
                                                                    if (txnCheck == null) {
                                                                        let receivetransaction = {
                                                                            senderAddress: xrpTrnxOut[i].address,
                                                                            receiverAddress: '',
                                                                            amount: xrpTrnxOut[i].amount/1000000000000,
                                                                            txId: xrpTrnxOut[i].txid,
                                                                            userId: wallet.userId,
                                                                            adminId: wallet.adminId,
                                                                            currencyType: 'XMR',
                                                                            trnxType: 'send',
                                                                            trnxFee: xrpTrnxOut[i].fee/1000000000000,
                                                                            trnxn_Obj: xrpTrnxOut[i],
                                                                            timestamp: xrpTrnxOut[i].timestamp * 1000,
                                                                            TrnxStatus: xrpTrnxOut[i].confirmations > 0 ? 'success' : 'pending',
                                                                        }
                                                                        SendReceiveTrx.create(receivetransaction, (error, txnSaved) => {
                                                                            if (error) { 
                                                                                console.log("error in send create receive XMR", error)
                                                                             } else if(txnSaved){
                                                                                let socketFilters: any;
                                                                                if (wallet.userId) {
                                                                                    socketFilters = { symbol: 'XMR', Id: wallet.userId, updatedBalance :'' };
                                                                                } else if (wallet.adminId) {
                                                                                    socketFilters = { symbol: 'XMR', Id: wallet.adminId, updatedBalance :'' };
                                                                                }
                                                                                ioSocketss.emit("sendReceiveXMRsend"+socketFilters.Id, socketFilters)	
                                                                                console.log("save send XMR Trnx")
                                                                             }
                                                                            
                                                                        });
                                                                    }
                                                                    else {
                                                                        console.log('this send  trx is available in table');
                                                                    }
                                                                }
                                                            });
                                                        }
                                                    }
                                                });
                                            }

                                        }
                                    });
                                }
                            }
                        } catch (e) {
                            console.log("Error in catch block", e)
                        }
                    });
                } catch (e) {
                    console.log('curl Error', e);
                }
            }
        });
    } catch (error) {
        console.log(error);
    }
};


export {
    activateMonero,
    sendXmrToOther,
    moneroBalance

}