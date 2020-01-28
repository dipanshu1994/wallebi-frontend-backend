import * as mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';

var Schema = mongoose.Schema;


var UserSchema = new Schema({
    userProfileId: { type: Schema.Types.ObjectId, ref: 'UserProfile' },
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    countryCode: { type: Number },
    date: { type: Date, default: Date.now },
    approval: { type: String, enum: ["pending", "active", "frozen"], default: "pending" },
    reset_password_token: { type: String },
    isemail: { type: Boolean, default: false },
    profileImage: { type: String },
    googleVerify: { type: Boolean, default: false },
    isPasswordAuthy: { type: Boolean, default: false },
    isWithdrawAuthy: { type: Boolean, default: false },
    isTradeAuthy: { type: Boolean, default: false },
    isAuthy: { type: Boolean, default: false },
    isGoogleAuthy: { type: Boolean, default: false },
    googleQrUrl: { type: String },
    googleUserKey: { type: String },
    ethAddressUpdate: { type: String, enum: ["Y", "N"], default: "N" },
    language: { type: String },
    currency: { type: String, default: 'EUR' },
    referralCode: { type: String },
    referralId: { type: Schema.Types.ObjectId, ref: 'User' },
    isPreventLogin: { type: Boolean, default: false },
    registerOn: { type: String, trim: true }
});

let User = mongoose.model('User', UserSchema);

export { User };


UserSchema.pre('save', function (next) {
    var user = this;

    // only hash the password if it has been modified (or is new)
    if (!user.isModified('password')) return next();

    // generate a salt
    bcrypt.genSalt(function (err, salt) {
        if (err) return next(err);

        // hash the password along with our new salt
        bcrypt.hash(user.password, salt, function (err, hash) {
            if (err) return next(err);

            // override the cleartext password with the hashed one
            user.password = hash;
            next();
        });
    });
});

