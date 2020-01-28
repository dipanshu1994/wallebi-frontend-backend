import * as mongoose from 'mongoose';
let Schema = mongoose.Schema;



let tradeFromLiquidity = new Schema({
    tradeId: { type: Schema.Types.ObjectId, ref: 'Trade' },
    amount: { type: Number },
    cryptoamount: { type: Number },
    orderId: { type: Number },
    errormsg: { type: String },
    responseData: { type: String },
    cryptoType: { type: String },
    providerFee: { type: String },
    type: { type: String, enum: ["debit", "credit"] },
    orderType: { type: String, enum: ["sell", "buy"] },
    providerName: { type: String },
    status: { type: String },
    createdDate: { type: Date, default: Date.now }
});



let TradeFromLiquidity = mongoose.model('tradeFromLiquidity', tradeFromLiquidity);

export { TradeFromLiquidity };

