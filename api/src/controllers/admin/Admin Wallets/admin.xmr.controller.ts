import { Admin } from "../../../db/models/admin/admin.model";
import { Wallets } from "../../../db/models/Wallets/wallet.model";
import { activateMoneroWalletService } from "../../../services/WalletService/monero.Service";
import { SendReceiveTrx } from "../../../db/models/Wallets/sendReceiveTransaction.model";
import { exec } from "child_process";
import { moneroBalance } from "../../Wallets/moneroController";
import { sendReceiveXMRPusher } from "../../../services/Pusher/pusher";


/**
 * activating monero account on monero node
 * @param adminId 
 */
let activateAdminMoneroWallet = async (req, res, next) => {
    try {
        let { currencyId, symbol, title } = req.body;
        Admin.findOne({ _id: req.admin.id }, async (err, admin) => {
            if (err || admin === null) {
                res.status(200).json({ success: false, msg: err, type: 'activate Monero' });
            } else {
                let walletName = `monero_${admin.firstname}_${Date.now()}`;
                try {
                    let moneroData;
                    await activateMoneroWalletService(walletName).then((cb) => {
                        moneroData = cb;
                    }).catch((error) => {
                        console.log(error);
                    });
                    if (moneroData) {
                        let moneroWallet = { address: moneroData.address, account_name: moneroData.name, account_index: moneroData.account_index, status: true };
                        await Wallets.findOneAndUpdate({ currencyId: currencyId, adminId: req.admin.id }, moneroWallet, { new: true }).then((result) => {
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
 * send XMR to to other
 */
let adminSendMoneroToOther = async (req, res) => {
    try {
        let { cryptoAmount, xmrWithFee, receiverAddress, currencyId } = req.body;
        let amountToTransfer = cryptoAmount;

        let amountToTransferWithFee = xmrWithFee;

        Wallets.findOne({ adminId: req.admin.id, currencyId: currencyId }, async (err, wallets) => {
            if (err) {
                res.status(200).json({ status: "false", msg: "Insufficient Balance" });
            } else {
                let xmrQuantity = parseFloat(amountToTransfer).toFixed(8);
                let xmrQuantityWithFee = Number(parseFloat(amountToTransferWithFee).toFixed(8));

                let adminXmrAddress = wallets.address;
                let adminXmrAccount = wallets.account_name;
                let adminXmrAccountIndex = wallets.account_index;

                exec("curl -u ravi:123456 --digest -X POST http://18.184.224.23:18081/json_rpc -d '{\"jsonrpc\":\"2.0\",\"id\":\"0\",\"method\":\"get_balance\",\"params\":{\"account_index\":" + adminXmrAccountIndex + "}}' -H 'Content-Type: application/json'", function (error, stdout, stderr) {
                    let getJsonResp = JSON.parse(stdout);
                    let getBalance = getJsonResp.result.balance;
                    let senderBalance = getBalance / 1000000000000;
                    if (senderBalance < xmrQuantityWithFee) {
                        res.status(200).json({ success: false, msg: "Insufficient Balance", type: 'Send XMR to ohter' });
                    } else {
                        let transferAmt = Number(xmrQuantity) * 1000000000000;
                        exec("curl -u ravi:123456 --digest -X POST http://18.184.224.23:18081/json_rpc -d '{\"jsonrpc\":\"2.0\",\"id\":\"0\",\"method\":\"transfer\",\"params\":{\"destinations\":[{\"amount\":" + transferAmt + ",\"address\":\"" + receiverAddress + "\"}],\"account_index\":" + adminXmrAccountIndex + ",\"subaddr_indices\":[0],\"priority\":0,\"ring_size\":7,\"get_tx_key\": true}}' -H 'Content-Type: application/json'", async (error, stdout, stderr) => {
                            let getJsonRespResult = JSON.parse(stdout);
                            if (getJsonResp.result !== undefined) {
                                let details = {
                                    senderAddress: adminXmrAddress,
                                    receiverAddress: receiverAddress,
                                    amount: transferAmt,
                                    txId: getJsonRespResult.result.tx_hash,
                                    adminId: req.admin.id,
                                    currencyType: 'XMR',
                                    trnxType: 'send',
                                    trnxFee: getJsonRespResult.result.fee,
                                    trnxn_Obj: getJsonRespResult,
                                    TrnxStatus: 'pending'
                                };
                                SendReceiveTrx.create(details, (savTrxerr, savTrxresp) => {
                                    if (savTrxerr) {
                                        res.status(200).json({ status: "false", msg: "Insufficient Balance", dta: stdout });
                                    }
                                    else {
                                        res.status(200).json({ status: "true", msg: "Amount transferred", dta: stdout });
                                        setTimeout(() => {
                                            exec("curl -u ravi:123456 --digest -X POST http://18.184.224.23:18081/json_rpc -d '{\"jsonrpc\":\"2.0\",\"id\":\"0\",\"method\":\"get_balance\",\"params\":{\"account_index\":" + adminXmrAccountIndex + "}}' -H 'Content-Type: application/json'", async (error, stdout, stderr) => {
                                                if (error) {
                                                    console.log('Balance Error :', error);
                                                } else {
                                                    res.status(200).json({ status: "true", msg: `${transferAmt} transfer to the ${receiverAddress}!`, dta: stdout });
                                                    await moneroBalance(adminXmrAccountIndex).then(async (moneroBalance: any) => {
                                                        await Wallets.findOneAndUpdate({ adminId: req.admin.id, currencyId: currencyId }, { balance: moneroBalance }).then((result) => {
                                                            if (result) {
                                                                res.status(200).json({ success: true, msg: `${amountToTransfer} bitcoin transfer to ${receiverAddress}` });
                                                                sendReceiveXMRPusher(savTrxresp, moneroBalance, 'send');
                                                            }
                                                        }).catch((error) => {
                                                            console.log(error);
                                                        });
                                                    });
                                                }
                                            })
                                        }, 5000);
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
}






export {
    activateAdminMoneroWallet,
    adminSendMoneroToOther,
}
