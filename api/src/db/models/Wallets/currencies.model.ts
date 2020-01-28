import * as mongoose from 'mongoose';
let Schema = mongoose.Schema;

let CurrencySchema = new Schema({
    title: { type: String, trim: true, unique: true },
    type: { type: String, required: true, trim: true },
    fee: { type: Number, required: true, trim: true, default: 0 },
    feein: { type: String, required: true, trim: true, default: "percentage" },
    exchangeFee: { type: Number, required: true, trim: true, default: 0 },
    exchangeFeein: { type: String, required: true, trim: true, default: "percentage" },
    tradeFee: { type: Number, required: true, trim: true, default: 0 },
    tradeFeein: { type: String, required: true, trim: true, default: "percentage" },
    logo: { type: String, trim: true },
    contractAddress: { type: String, trim: true },
    symbol: { type: String, trim: true, unique: true },
    status: { type: String, trim: true, default: "Active" },
    tradeStatus: { type: Boolean, trim: true, default: false },
    buySellStatus: { type: Boolean, trim: true, default: false },
    createdAt: { type: Date, default: Date.now }
});


let Currency = mongoose.model('Currency', CurrencySchema);
export { Currency };