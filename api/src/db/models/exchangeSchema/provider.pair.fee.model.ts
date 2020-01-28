import * as mongoose from 'mongoose';
let Schema = mongoose.Schema;

let ProvidersPairFeeSchema = new Schema({
    pairName: { type: String, required: true, trim: true, unique: true },
    adminBuyFee: { type: Number, required: true, trim: true, default: 0 },
    adminBuyFeein: { type: String, required: true, trim: true, default: "percentage" },
    adminSellFee: { type: Number, required: true, trim: true, default: 0 },
    adminSellFeein: { type: String, required: true, trim: true, default: "percentage" },
    b2bxBuyFee: { type: Number, required: true, trim: true, default: 0 },
    b2bxBuyFeein: { type: String, required: true, trim: true, default: "percentage" },
    b2bxSellFee: { type: Number, required: true, trim: true, default: 0 },
    b2bxSellFeein: { type: String, required: true, trim: true, default: "percentage" },
    exmoBuyFee: { type: Number, required: true, trim: true, default: 0 },
    exmoBuyFeein: { type: String, required: true, trim: true, default: "percentage" },
    exmoSellFee: { type: Number, required: true, trim: true, default: 0 },
    exmoSellFeein: { type: String, required: true, trim: true, default: "percentage" },
    status: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});


let ProvidersPairFee = mongoose.model('ProvidersPairFee', ProvidersPairFeeSchema);
export { ProvidersPairFee };