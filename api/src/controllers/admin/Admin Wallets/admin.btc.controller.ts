import { Admin } from "../../../db/models/admin/admin.model";
import { Wallets } from "../../../db/models/Wallets/wallet.model";
import { createMultiSigWallet, getBTCBalance, transferBTCAmount } from "../../../services/WalletService/btc.Service";
import { SendReceiveTrx } from "../../../db/models/Wallets/sendReceiveTransaction.model";
import { sendReceiveBTCPusher } from "../../../services/Pusher/pusher";
import { bitcoinBalance } from "../../Wallets/btcController";





/**
 * activating btc wallet controller for admin
 * @param adminId 
 * */
let activateAdminBitcoinWallet = async (req, res, next) => {
    try {
        let { id, symbol, title, currencyId } = req.body;
        Admin.findOne({ _id: req.admin.id }, async (err, admin) => {
            if (err || admin === null) {
                res.status(200).json({ success: false, msg: err, type: 'activate BTC' });
            } else {
                let walletName = `bitcoin_${admin.firstname}_${Date.now()}`;
                let btcWallet = await createMultiSigWallet(walletName);
                if (btcWallet) {
                    let bitcoinData = { address: btcWallet.address, account_name: walletName, status: true };
                    await Wallets.findOneAndUpdate({ currencyId: currencyId, adminId: req.admin.id }, bitcoinData, { new: true }).then((result) => {
                        if (result) {
                            res.status(200).json({ success: true, msg: `${result.title} is activated!`, type: 'bitcoin wallet activated!'});
                        }
                    }).catch((error) => {
                        console.log(error);
                        res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'activate BTC' });
                    });
                } else {
                    res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'activate BTC' });
                }
            }
        });
    } catch (error) {
        console.log(error);
    }
};




/**
 * send btc to others
 */
let sendBitcoinToOther = async (req, res) => {
    try {
        let { cryptoAmount, btcWithFee, receiverAddress, currencyId } = req.body;

        let amountToTransfer = cryptoAmount;
        let amountToTransferWithFee = btcWithFee;

        Wallets.findOne({ adminId: req.admin.id, currencyId: currencyId }, async (err, wallets) => {
            if (err) {
                res.status(200).json({ success: false, msg: err, type: 'sending btc to others' });
            }
            else {
                let btcquantity = parseFloat(amountToTransfer).toFixed(8);
                let btcquantitywithfee = parseFloat(amountToTransferWithFee).toFixed(8);

                let adminBtcAddress = wallets.address;
                let adminBtcAccount = wallets.account_name;
                let senderBalance = await getBTCBalance(adminBtcAccount);
                let realBalance = senderBalance / 1000000000000000000;
                if (senderBalance < cryptoAmount) {
                    res.status(200).json({ success: false, msg: "Insufficient Balance", type: 'balance is insufficient' });
                } else {
                    // let setTransactionFee = await setBTCTxFee(0.00000001);
                    let result = await transferBTCAmount(adminBtcAccount, receiverAddress, btcquantity, 1);
                    if (result) {
                        let details = new SendReceiveTrx({
                            senderAddress: adminBtcAddress,
                            receiverAddress: receiverAddress,
                            amount: btcquantity,
                            txId: result.transactionHash,
                            adminId: req.admin.id,
                            currencyType: 'BTC',
                            trnxType: 'send'
                        });
                        details.save(async (err, btcDoc) => {
                            if (err) {
                                res.status(200).json({ success: false, msg: "Error sending" });
                            } else {
                                res.status(200).json({ success: true, msg: `${amountToTransfer} bitcoin transfer to ${receiverAddress}!` });
                                await bitcoinBalance(adminBtcAccount).then(async (bitcoinBalance: any) => {
                                    await Wallets.findOneAndUpdate({ adminId: req.admin.id, currencyId: currencyId }, { balance: bitcoinBalance }).then((result) => {
                                        if (result) {
                                            let updatedBalance = bitcoinBalance / 1000000000000000000;
                                            sendReceiveBTCPusher(btcDoc, updatedBalance, 'send');
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




export { 
    activateAdminBitcoinWallet,
    sendBitcoinToOther,
}