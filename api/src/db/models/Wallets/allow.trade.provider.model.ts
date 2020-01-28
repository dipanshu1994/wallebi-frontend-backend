import * as mongoose from 'mongoose';
let Schema = mongoose.Schema;


let allowTradebyAdmin = new Schema({
    pairId: { type: Schema.Types.ObjectId, ref: 'ProvidersPairFee' },
    pairName: { type: String, required: true },
    tradeType: { type: String, required: true },
    admin: { type: Boolean, default: true },
    b2bx: { type: Boolean, default: false },
    exmo: { type: Boolean, default: false },
    createdDate: { type: Date, default: Date.now }
});


let AllowTradeByAdmin = mongoose.model('AllowTradeByAdmin', allowTradebyAdmin)

export {
    AllowTradeByAdmin
}