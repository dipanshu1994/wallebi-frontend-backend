import * as mongoose from 'mongoose';
let Schema = mongoose.Schema;

let trade = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    adminId: { type: Schema.Types.ObjectId, ref: 'Admin' },
    tradeId: { type: Schema.Types.ObjectId, ref: 'Trade' },
    providerId: { type: Schema.Types.ObjectId, ref: 'TradeFromLiquidity' },
    cryptoAmount: { type: Number },
    cryptoType: { type: String },
    cryptoCurrentPrice: { type: Number },
    euroAmount: { type: Number },
    transferAccountType: { type: String },
    txType: { type: String },
    txId: { type: String },
    txFee: {type: String },
    withdrawalAmount: { type: Number },
    withdrawalFee: { type: Number },
    withdrawalStatus: { type: String, enum: ["pending", "processing", "completed"], default: 'completed' },
    type: { type: String, enum: ["debit", "credit"], default: 'credit' },
    status: { type: String, enum: ["pending", "processing", "completed"], default: 'pending' },
    createdDate: { type: Date, default: Date.now }

});


let Trade = mongoose.model('trade', trade);

export { Trade };
