import * as mongoose from 'mongoose';
var Schema = mongoose.Schema;


var BankAccountsSchema = new Schema({
    account_no: { type: String, required: true },
    swift_code: { type: String, required: false },
    card_no: { type: String, required: false },
    ac_holder_firstname: { type: String, required: true },
    ac_holder_lastname: { type: String, required: true },
    ac_holder_moblile: { type: Number },
    ac_holder_email: { type: String, required: true },
    ac_holdername: { type: String, required: true },
    branch_name: { type: String, required: true },
    currency: { type: String },
    ac_statement: { type: String },
    status: { type: String, enum: ["pending", "rejected", "verified"], default: "pending" },
    createdDate: { type: Date, default: Date.now },
    userId: { type: Schema.Types.ObjectId, ref: 'User', unique: false },
    description: { type: String },
    operations: { type: String },

});


let BankAccount = mongoose.model('BankAccount', BankAccountsSchema);

export { BankAccount }