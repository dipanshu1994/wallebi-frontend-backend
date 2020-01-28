import * as mongoose from 'mongoose';
let Schema = mongoose.Schema;

let exchangeTrade = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    tradeId: { type: Schema.Types.ObjectId, ref: 'Trade' },
    bbxId: { type: Schema.Types.ObjectId, ref: 'Bbx' },
    cryptoAmount: { type: Number },
    cryptoType: { type: String },
    cryptoCurrentPrice: { type: Number },
    euroAmount: { type: Number },
    transferAccountType: { type: String },
    txType: { type: String },
    txId: { type: String },
    withdrawalAmount: { type: Number },
    withdrawalFee: { type: Number },
    withdrawalStatus: { type: String, enum: ["pending", "processing", "completed"], default: 'completed' },
    type: { type: String, enum: ["debit", "credit"], default: 'credit' },
    status: { type: String, enum: ["pending", "processing", "completed"], default: 'pending' },
    createdDate: { type: Date, default: Date.now }

});


let ExchangeTrade = mongoose.model('exchangeTrade', exchangeTrade);

export { ExchangeTrade };
