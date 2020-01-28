import { Admin } from "../../../db/models/admin/admin.model";
import { Wallets } from "../../../db/models/Wallets/wallet.model";
import { createMultiSigWallet, getLiteCoinBalance, transferAmount } from "../../../services/WalletService/liteCoin.service";
import { SendReceiveTrx } from "../../../db/models/Wallets/sendReceiveTransaction.model";
import { litecoinBalance } from "../../Wallets/liteCoinController";
import { sendReceiveLTCPusher } from "../../../services/Pusher/pusher";




/**
 * activating LTC wallet controller
 * @param adminId 
 * */
let activateAdminLiteCoin = async (req, res, next) => {
    try {
        let { currencyId, symbol, title } = req.body;
        Admin.findOne({ _id: req.admin.id }, async (err, admin) => {
            if (err || admin === null) {
                res.status(200).json({ success: false, msg: err, type: 'activate LTC' });
            } else {
                let ltcWalletPassword = `ltc_${admin.firstname}_${Date.now()}`;
                let ltcWallet = await createMultiSigWallet(ltcWalletPassword);
                if (ltcWallet) {
                    let ltcData = { address: ltcWallet.address, account_name: ltcWalletPassword, status: true };
                    await Wallets.findOneAndUpdate({ currencyId: currencyId, adminId: req.admin.id }, ltcData, { new: true }).then((result) => {
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
 * send lite coin to others
 */
let sendLitecoinToOther = (req, res) => {
    try {
        let { cryptoAmount, ltcWithFee, receiverAddress, currencyId } = req.body;

        Wallets.findOne({ adminId: req.admin.id, currencyId: currencyId }, async (err, wallets) => {
            if (err) {
                res.status(200).json({ success: false, msg: "Insufficient Balance", type: 'send Lite coin to other' });
            }
            else {
                let ltcquantity = parseFloat(cryptoAmount).toFixed(8);
                let ltcquantitywithFee = parseFloat(ltcWithFee).toFixed(8);

                let adminLtcAddress = wallets.address;
                var adminLtcAccount = wallets.account_name;

                let senderBalance = await getLiteCoinBalance(adminLtcAccount);
                if (senderBalance < ltcquantity) {
                    res.status(200).json({ success: false, msg: "Your litecoin balance is insufficient!" });
                } else {
                    // let setTransactionFee = await setTxFee(0.00000001);
                    let result = await transferAmount(adminLtcAccount, receiverAddress, ltcquantity, 1);
                    if (result) {
                        var details = new SendReceiveTrx({
                            senderAddress: adminLtcAddress,
                            receiverAddress: receiverAddress,
                            amount: ltcquantity,
                            txId: result,
                            adminId: req.admin.id,
                            currencyType: 'LTC',
                            trnxType: 'send'
                        });
                        details.save(async (err, ltcDoc) => {
                            if (err) {
                                res.status(200).json({ status: false, msg: "Insufficient Balance" });
                            }
                            else {
                                res.status(200).json({ status: true, msg: `${ltcquantity} litecoin transfer to the ${receiverAddress}!` });
                                await litecoinBalance(wallets.account_name).then(async (litecoinBalance: any) => {
                                    await Wallets.findOneAndUpdate({ adminId: req.admin.id, currencyId: currencyId }, { balance: litecoinBalance }).then((result) => {
                                        if (result) {
                                            sendReceiveLTCPusher(ltcDoc, litecoinBalance, 'send');
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




export {
    activateAdminLiteCoin,
    sendLitecoinToOther,
}