import * as mongoose from 'mongoose';
var Schema = mongoose.Schema;

var userProfileSchema = new Schema({
    mobile: { type: Number },
    smscode: { type: String },
    middlename: { type: String },
    gender: { type: String, enum: ["Male", "Female"], required: true },
    address: { type: String, required: true },
    housename: { type: String, required: true },
    district: { type: String, required: true },
    city: { type: String, required: true },
    pincode: { type: String },
    country: { type: String, required: true },
    documents: { type: String },
    dob: {
        year: { type: Number, required: true },
        month: { type: Number, required: true },
        date: { type: Number, required: true }
    },
    id_data: { type: JSON },
    userId: { type: Schema.Types.ObjectId, ref: 'User', unique: true },
    numberVerify: { type: Boolean, default: false },
    id_proof_front: { type: String },
    id_proof_back: { type: String },
    selfie: { type: String },
    doc_verification: { type: String, enum: ["pending", "rejected", "verified"], default: "pending" },
    doc_verification_front_rejection_reason: { type: String, default: undefined },
    address_verification: { type: String, enum: ["pending", "rejected", "verified"], default: "pending" },
    address_rejection_reason: { type: String, default: undefined },
    step: { type: Number, enum: ["0", "1", "2", "3", "4"], default: 0 },
    isenterprise: { type: String, enum: ["pending", "degrade", "upgrade"], default: "pending" },
    paidout: { type: String, enum: ["Pending", "Paidout"], default: "Pending" },
    pending_address_verification: { type: String },
    denied_description: { type: String },
    denied_selfie: { type: Number, enum: ["0", "1",], default: 0 },
    doc_verification_back: { type: String, enum: ["pending", "rejected", "verified"], default: "pending" },
    doc_verification_back_rejection_reason: { type: String, default: undefined },
    selfie_verification: { type: String, enum: ["pending", "rejected", "verified"], default: "pending" },
    selfie_verification_rejection_reason: { type: String, default: undefined },
    kyc_status: { type: String, enum: ["pending", "rejected", "verified" ], default: "pending" }
});



let UserProfile = mongoose.model('UserProfile', userProfileSchema);

export { UserProfile };

