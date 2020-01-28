import { Admin } from "../../../db/models/admin/admin.model";
import { Wallets } from "../../../db/models/Wallets/wallet.model";
import { createMultiSigWallet, getBCHBalance, validateBCHAddress, transferBitcoinCashAmount } from "../../../services/WalletService/bch.service";
import { SendReceiveTrx } from "../../../db/models/Wallets/sendReceiveTransaction.model";
import { bitcoincashBalance } from "../../Wallets/bchController";
import { sendReceiveBCHPusher } from "../../../services/Pusher/pusher";





/**
 * activating BCH wallet controller
 * @param adminId 
 * */
let activateAdminBitcashWallet = async (req, res, next) => {
    try {
        let { id, symbol, title, currencyId } = req.body;
        Admin.findOne({ _id: req.admin.id }, async (err, admin) => {
            if (err || admin === null) {
                res.status(200).json({ success: false, msg: err, type: 'activate BCH' });
            } else {
                let bchWalletPassword = `bch_${admin.firstname}_${Date.now()}`;
                let bchWallet = await createMultiSigWallet(bchWalletPassword);
                if (bchWallet) {
                    let bchData = { address: bchWallet, account_name: bchWalletPassword, status: true };
                    await Wallets.findOneAndUpdate({ currencyId: currencyId, adminId: req.admin.id }, bchData, { new: true }).then((result) => {
                        if (result) {
                            res.status(200).json({ success: true, msg: `${result.title} is activated!`, type: 'bitcoin cash wallet activated!' });
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
 * send Bitcoin cash to others
 */
let adminSendBitCashToOther = (req, res, next) => {

    let { cryptoAmount, bchWithFee, receiverAddress, bchToEuro, currencyId } = req.body;

    let amountToTransfer = cryptoAmount;
    let amountToTransferWithFee = bchWithFee;

    Wallets.findOne({ adminId: req.admin.id, currencyId: currencyId }, async (err, wallet) => {
        if (err) {
            res.status(200).json({ success: false, msg: err, type: 'Send BCH to others' });
        }
        else {
            let bchquantity = parseFloat(amountToTransfer).toFixed(8);
            let bchquantitywithfee = parseFloat(amountToTransferWithFee).toFixed(8);

            let adminBchAddress = wallet.address;
            let adminBchAccount = wallet.account_name;

            let senderBalance = await getBCHBalance(adminBchAccount);
            let validateAddress = await validateBCHAddress(receiverAddress);

            if (!validateAddress.isvalid) {
                res.status(200).json({ success: false, msg: "Receiver address is not valid", validateAddress: validateAddress.isvalid });
            } else {
                if (senderBalance < bchquantity) {
                    res.status(200).json({ success: false, msg: "Your bitcoincash balnce is insufficient!", type: 'balance insufficent' });
                } else {
                    let result = await transferBitcoinCashAmount(adminBchAccount, receiverAddress, bchquantity, 1);
                    if (result) {
                        let details = new SendReceiveTrx({
                            senderAddress: adminBchAddress,
                            receiverAddress: receiverAddress,
                            amount: bchquantity,
                            txId: result,
                            adminId: req.admin.id,
                            currencyType: 'BCH',
                            trnxType: 'send',
                        });
                        details.save(async (err, bchDoc) => {
                            if (err) {
                                res.status(200).json({ success: false, msg: "Insufficient Balance", type: 'send bch' });
                            } else {
                                if (err) {
                                    res.status(200).json({ success: false, msg: "Insufficient Balance", type: 'send bch' });
                                } else {
                                    res.status(200).json({ success: true, msg: `${amountToTransfer} bitcoin cash transfer to ${receiverAddress}` });
                                    await bitcoincashBalance(adminBchAccount).then(async (bitcoincashBalance: any) => {
                                        await Wallets.findOneAndUpdate({ admin: req.admin.id, currencyId: currencyId }, { balance: bitcoincashBalance }).then((result) => {
                                            if (result) {
                                                sendReceiveBCHPusher(bchDoc, bitcoincashBalance, 'send');
                                            }
                                        }).catch((error) => {
                                            console.log(error);
                                        });
                                    });
                                }
                            }
                        });
                    }
                }
            }

        }
    });
};







export {
    activateAdminBitcashWallet,
    adminSendBitCashToOther,
}