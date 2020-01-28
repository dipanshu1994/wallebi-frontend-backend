import { Admin } from "../../../db/models/admin/admin.model";
import { RippleAPI } from "ripple-lib";
import { Wallets } from "../../../db/models/Wallets/wallet.model";
import { SendReceiveTrx } from "../../../db/models/Wallets/sendReceiveTransaction.model";
import { rippleBalance } from "../../Wallets/xrpController";
import { sendReceiveXRPPusher } from "../../../services/Pusher/pusher";


let liveServer = 'wss://r.ripple.com';
let api = new RippleAPI({
    server: liveServer
});



/**
 * activating ripple wallet controller
 * @param adminId 
 */
let activateAdminRipple = async (req, res, next) => {
    try {
        let { currencyId, symbol, title } = req.body;
        Admin.findOne({ _id: req.admin.id }, async (err, admin) => {
            if (err || admin === null) {
                res.status(200).json({ success: false, msg: err, type: 'activate XRP' });
            } else {
                let walletName = `ripple_${admin.firstname}_${Date.now()}`;
                await api.connect();
                let addressInfo = await api.generateAddress();
                if (addressInfo) {
                    let accountAddress = addressInfo.address;
                    let accountSecret = addressInfo.secret;
                    let xrpData = { address: accountAddress, account_name: walletName, secret: accountSecret, status: true };
                    await Wallets.findOneAndUpdate({ currencyId: currencyId, adminId: req.admin.id }, xrpData, { new: true }).then((result) => {
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
 * sending xrp to another admin
 */
let adminSendRippleToOther = function (req, res) {
    try {
        let { cryptoAmount, rippleWithFee, currencyId, receiverAddress } = req.body;
        let amountToTransfer = cryptoAmount;
        let amountToTransferWithFee = rippleWithFee;

        Wallets.findOne({ adminId: req.admin.id, currencyId: currencyId }, async (err, wallets) => {
            if (err) {
                res.status(200).json({ success: false, msg: err, type: 'sending ripple to another admin' });
            }
            else {
                let adminXrpAddress = wallets.address;
                let adminXrpSecret = wallets.secret;

                const senderAddress = adminXrpAddress;
                const senderSecret = adminXrpSecret;


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
                            res.status(200).json({ success: false, msg: "Your ripple balance is insufficient!", type: 'sending XRP to another admin' });
                        }
                        api.preparePayment(senderAddress, payment, instructions).then(prepared => {
                            const { signedTransaction, id } = api.sign(prepared.txJSON, senderSecret)
                            api.submit(signedTransaction).then((result: any) => {
                                let details = {
                                    receiverAddress: receiverAddress,
                                    senderAddress: adminXrpAddress,
                                    amount: amountToTransfer,
                                    txId: result.tx_json.hash,
                                    adminId: req.admin.id,
                                    currencyType: 'XRP',
                                    trnxType: 'send',
                                    trnxFee: result.tx_json.Fee,
                                    trnxn_Obj: result,
                                    TrnxStatus: result.tx_json.Flags > 0 ? 'success' : 'pending',
                                };
                                SendReceiveTrx.create(details, async (err, Xrpdoc) => {
                                    if (err) {
                                        res.status(200).json({ success: false, msg: "Insufficient Balance", type: 'data not save' });
                                    }
                                    else {
                                        res.status(200).json({ success: true, msg: `${amountToTransfer} transfer to the ${req.body.receiverAddress}`, type: 'sending XRP' });
                                        await rippleBalance(adminXrpAddress).then(async (rippleBalance: any) => {
                                            await Wallets.findOneAndUpdate({ adminId: req.admin.id, currencyId: currencyId }, { balance: rippleBalance }).then((result) => {
                                                if (result) {
                                                    sendReceiveXRPPusher(Xrpdoc, rippleBalance, 'send');
                                                }
                                            }).catch((error) => {
                                                console.log(error);
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
};







export {
    activateAdminRipple,
    adminSendRippleToOther,
}
