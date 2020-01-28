import * as mongoose from 'mongoose';
let Schema = mongoose.Schema;


let networkFeeSchema = new Schema({
    status: { type: Boolean, default: true },
    bitCoinFee: { type: Object},
    etherumFee: { type: Object },
    tetherFee: { type: Object },
    liteCoinFee: { type: Object },
    moneroFee: { type: Object },
    bitCoinCashFee: { type: Object },
    rippleFee: { type: Object },
    stellarFee: { type: Object },
});


let Fees = mongoose.model('fees', networkFeeSchema);

export { Fees };
