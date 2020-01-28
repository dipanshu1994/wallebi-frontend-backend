import { Trade } from "../../db/models/Wallets/trade.model";




function isEmpty(obj) {
    for (var key in obj) {
        if (obj.hasOwnProperty(key))
            return false;
    }
    return true;
}




/**
 * calculating user trade balance and returning it
 * @param userId 
 */
let userCryptoTradeBalance = async (userId, cryptoType) => {
    return new Promise(async (resolve, reject) => {
        try {
            let totalAmount = 0;
            await Trade.find({ userId: userId, cryptoType: cryptoType, status: 'completed' }).then(async (userTradeBalance) => {
                await userTradeBalance.forEach((value) => {
                    totalAmount = totalAmount + value['cryptoAmount'];
                });
                resolve(totalAmount);
            }).catch((error) => {
                reject(error);
                console.log(error);
            });
        } catch (error) {
            reject(error);
        }
    });
};



export {
    userCryptoTradeBalance
}