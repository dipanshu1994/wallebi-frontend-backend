import { User } from "../../db/models/users/users.model";
import { comparePassword } from "../../services/UserService/compare.password.service";
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import { sendSMSisAuthy } from "../../services/UserService/sms.omniChannel.service";
import { UserProfile } from "../../db/models/users/userProfile.model";
import { mailer } from "../../services/UserService/mail.service";
import { sender } from "../../config/config";
import { EmailTemplate } from "../../db/models/emailTemplate/emailTemplate.model";


/**
 * chnage user password controller
 * @param {String} oldPassword; 
 * @param {String} newPassword;
 */
let changePassword = async (req, res, next) => {
    try {
        User.findById(req.user.id, async (err, user) => {
            if (err) {
                res.status(200).json({ success: false, msg: err, type: 'change password' });
            } else {
                let isMatch;
                let newHash;
                isMatch = comparePassword(req.body.oldPassword, user.password);
                if (isMatch) {
                    if (user.isPasswordAuthy) {
                        let min = Math.ceil(100000);
                        let max = Math.floor(999999);
                        let randomNumber = Math.floor(Math.random() * (max - min)) + min;
                        let userProfile = await UserProfile.findOneAndUpdate({ userId: req.user.id }, { smscode: randomNumber }, { new: true });
                        if (userProfile) {
                            let smsResponse = await sendSMSisAuthy(randomNumber, userProfile.mobile, user, 'ChangePassword');
                            if (smsResponse) {
                                res.status(200).json({ success: true, msg: "Check your SMS for Verification code", type: "check Message", isAuthyPassword: true });
                            } else {
                                res.status(200).json({ success: false, msg: "SMS code send failed", type: "send  failed", error: err });
                            }
                        }
                    } else {
                        let salt = await bcrypt.genSaltSync(10);
                        newHash = await bcrypt.hashSync(req.body.newPassword, salt);
                        User.findByIdAndUpdate(req.user.id, { password: newHash }, { new: true }, async (err, response) => {
                            if (err) {
                                res.status(200).json({ success: false, msg: err, type: 'change password' });
                            } else {
                                let mailOptions;
                                await EmailTemplate.findOne({ mailType: 'password-reseted' }).then((passwordReseted) => {
                                    if (passwordReseted) {
                                        let emailHTML;
                                        let emailSubject;
                                        if (user.language === 'fa') {
                                            emailHTML = passwordReseted.emailBodyFarsi;
                                            emailSubject = passwordReseted.subjectFarsi;
                                            emailHTML = emailHTML.replace("{user_firstname}", user.firstname);
                                            mailOptions = {
                                                from: sender, // sender address
                                                to: user.email, // list of receivers
                                                subject: emailSubject, // Subject line
                                                html: emailHTML // html body
                                            };
                                        } else {
                                            emailHTML = passwordReseted.emailBody;
                                            emailSubject = passwordReseted.subject;
                                            emailHTML = emailHTML.replace("{user_firstname}", user.firstname);
                                            mailOptions = {
                                                from: sender, // sender address
                                                to: user.email, // list of receivers
                                                subject: emailSubject, // Subject line
                                                html: emailHTML // html body
                                            };
                                        }
                                        mailer(mailOptions);
                                    }
                                }).catch((error) => {
                                    res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'email template catch', error: error });
                                });
                                res.status(200).json({ success: true, msg: 'Password updated successfully!', type: 'chnage password' });
                            }
                        });
                    }
                } else {
                    res.status(200).json({ success: false, msg: 'Old password does not match!', type: 'change password' });
                }
            }
        });
    } catch (error) {
        res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'in main catch', error: error });
    }
}

/**
 * change user password when 2FA is enable
 * @param smscode 
 * @param oldPassword
 * @param newPassword
 */
let chnageAuthyPassword = async (req, res, next) => {
    try {
        let { smsCode, oldPassword, newPassword } = req.body;

        let userProfile = await UserProfile.findOne({ userId: req.user.id }).populate('userId');
        if (userProfile) {
            if (userProfile.smscode === smsCode) {
                let isMatch;
                let newHash;
                isMatch = comparePassword(oldPassword, userProfile.userId.password);
                if (isMatch) {
                    let salt = await bcrypt.genSaltSync(10);
                    newHash = await bcrypt.hashSync(newPassword, salt);
                    User.findByIdAndUpdate(req.user.id, { password: newHash }, async (err, response) => {
                        if (err) {
                            res.status(200).json({ success: false, msg: err, type: 'change password' });
                        } else {
                            let mailOptions;
                            await EmailTemplate.findOne({ mailType: 'password-reseted' }).then((passwordReseted) => {
                                if (passwordReseted) {
                                    let emailHTML;
                                    let emailSubject;
                                    if (response.language === 'fa') {
                                        emailHTML = passwordReseted.emailBodyFarsi;
                                        emailSubject = passwordReseted.subjectFarsi;
                                        emailHTML = emailHTML.replace("{user_firstname}", response.firstname);
                                        mailOptions = {
                                            from: sender, // sender address
                                            to: response.email, // list of receivers
                                            subject: emailSubject, // Subject line
                                            html: emailHTML // html body
                                        };
                                    } else {
                                        emailHTML = passwordReseted.emailBody;
                                        emailSubject = passwordReseted.subject;
                                        emailHTML = emailHTML.replace("{user_firstname}", response.firstname);
                                        mailOptions = {
                                            from: sender, // sender address
                                            to: response.email, // list of receivers
                                            subject: emailSubject, // Subject line
                                            html: emailHTML // html body
                                        };
                                    }
                                    mailer(mailOptions);
                                }
                            }).catch((error) => {
                                res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'email template catch', error: error });
                            });
                            res.status(200).json({ success: true, msg: 'Password updated successfully!', type: 'chnage password' });
                        }
                    });
                } else {
                    res.status(200).json({ success: false, msg: 'Old password does not match!', type: 'change password' });
                }
            } else {
                res.status(200).json({ success: false, msg: 'Your OTP is invalid!', type: 'change password' });
            }
        } else {
            res.status(200).json({ success: false, msg: 'Your OTP is invalid!', type: 'change password' });
        }
    } catch (error) {
        console.log(error);
    }
};



/**
 * enable/disable 2FA for user login controller
 * @param {boolean} isAuthy;  
 */
let twoFAForLogin = async (req, res, next) => {
    try {
        UserProfile.findOne({ userId: req.user.id }, (err, user) => {
            if (err || user === null) {
                res.status(200).json({ success: false, msg: 'Please complete your KYC first!', type: '2FA login' });
            } else {
                if (user.numberVerify) {
                    User.findByIdAndUpdate(req.user.id, { isAuthy: req.body.isAuthy }, { new: true }, (err, result) => {
                        if (err || result === null) {
                            res.status(200).json({ success: false, msg: 'Failed', type: '2FA Login' });
                        } else {
                            if (result.isAuthy === true) {
                                res.status(200).json({ success: true, msg: '2FA Enabled for login now', type: '2FA Login', isAuthy: result.isAuthy });
                            }
                            if (result.isAuthy === false) {
                                res.status(200).json({ success: true, msg: '2FA Disabled for login now', type: '2FA Login', isAuthy: result.isAuthy });
                            };
                        }
                    });
                } else {
                    res.status(200).json({ success: false, msg: 'Please complete your KYC first', type: '2FA Login' });
                }
            }
        });
    } catch (error) {
        console.log(error);
    }
};

/**
 * checking 2FA status for login controller 
 */
let statusTwoFALogin = async (req, res, next) => {
    try {
        User.findOne({ _id: req.user.id }, { isAuthy: 1 }, (err, result) => {
            if (err) {
                res.status(200).json({ success: false, msg: err, type: 'login 2FA status' });
            } else {
                res.json(result);
            }
        });
    } catch (error) {
        console.log(error);
    }
};

/**
 * enable/disable 2FA for withdraw controller
 * @param {boolean} isWithdrawAuthy;  
 */
let twoFAForWithdraw = async (req, res, next) => {
    try {
        UserProfile.findOne({ userId: req.user.id }, (err, user) => {
            if (err || user === null) {
                res.status(200).json({ success: false, msg: 'Please complete your KYC first!', type: '2FA withdraw' });
            } else {
                if (user.numberVerify) {
                    User.findByIdAndUpdate(req.user.id, { isWithdrawAuthy: req.body.isWithdrawAuthy }, { new: true }, (err, result) => {
                        if (err || result === null) {
                            res.status(200).json({ success: false, msg: 'Failed', type: '2FA Withdraw' });
                        } else {
                            if (result.isWithdrawAuthy === true) {
                                res.status(200).json({ success: true, msg: '2FA Enabled for widthdraw now', type: '2FA Withdraw' });
                            }
                            if (result.isWithdrawAuthy === false) {
                                res.status(200).json({ success: true, msg: '2FA Disabled for widthdraw now', type: '2FA Withdraw' });
                            }
                        }
                    });
                } else {
                    res.status(200).json({ success: false, msg: 'Please complete your KYC first', type: '2FA Withdraw' });
                }
            }
        });
    } catch (error) {
        console.log(error);
    }
};


/**
 * checking 2FA status for withdraw controller 
 */
let statusTwoFAWithdraw = async (req, res, next) => {
    try {
        User.findOne({ _id: req.user.id }, { isWithdrawAuthy: 1 }, (err, result) => {
            if (err) {
                res.status(200).json({ success: false, msg: err, type: 'withdraw 2FA status' });
            } else {
                res.json(result);
            }
        });
    } catch (error) {
        console.log(error);
    }
};

/**
 * enable / disable 2FA for trade controller
 * @param {boolean} isTradeAuthy;
 */
let twoFAForTrade = async (req, res, next) => {
    try {
        UserProfile.findOne({ userId: req.user.id }, (err, user) => {
            if (err || user === null) {
                res.status(200).json({ success: false, msg: 'Please complete your KYC first!', type: '2FA trade' });
            } else {
                if (user.numberVerify) {
                    User.findByIdAndUpdate(req.user.id, { isTradeAuthy: req.body.isTradeAuthy }, { new: true }, (err, result) => {
                        if (err || result == null) {
                            res.status(200).json({ success: false, msg: "Failed", type: "2FA Trade" });
                        } else {
                            if (result.isTradeAuthy === true) {
                                res.status(200).json({ success: true, msg: '2FA Enabled for trade now', type: '2FA trade' });
                            }
                            if (result.isTradeAuthy === false) {
                                res.status(200).json({ success: true, msg: '2FA Disabled for trade now', type: '2FA trade' });
                            }
                        }
                    });
                } else {
                    res.status(200).json({ success: false, msg: 'Please complete your KYC first', type: '2FA trade' });
                }
            }
        });
    } catch (error) {
        console.log(error);
    }
};

/**
 * checking 2FA status for withdraw controller 
 */
let statusTwoFATrade = async (req, res, next) => {
    try {
        User.findOne({ _id: req.user.id }, { isTradeAuthy: 1 }, (err, result) => {
            if (err) {
                res.status(200).json({ success: false, msg: err, type: 'trade 2FA status' });
            } else {
                res.json(result);
            }
        });
    } catch (error) {
        console.log(error);
    }
};

/**
 * enable/disable 2FA for password change controller
 * @param {boolean} isPasswordAuthy
 */
let twoFAForPasswordChange = async (req, res, next) => {
    try {
        UserProfile.findOne({ userId: req.user.id }, (err, user) => {
            if (err || user === null) {
                res.status(200).json({ success: false, msg: 'Please complete your KYC first!', type: '2FA password change' })
            } else {
                if (user.numberVerify) {
                    User.findByIdAndUpdate(req.user.id, { isPasswordAuthy: req.body.isPasswordAuthy }, { new: true }, (err, result) => {
                        if (err || result == null) {
                            res.status(200).json({ success: false, msg: err, type: '2FA password change' });
                        } else {
                            if (result.isPasswordAuthy === true) {
                                res.status(200).json({ success: true, msg: '2FA Enabled for password change now', type: '2FA password chnage' });
                            }
                            if (result.isPasswordAuthy === false) {
                                res.status(200).json({ success: true, msg: '2FA Disabled for password change now', type: '2FA password change' });
                            }
                        }
                    });
                } else {
                    res.status(200).json({ success: false, msg: 'Please verify your number first', type: '2FA password change' });
                }
            }
        });
    } catch (error) {
        console.log(error);
    }
};

/**
 * checking 2FA status for withdraw controller 
 */
let statusTwoFAChangePassword = async (req, res, next) => {
    try {
        User.findOne({ _id: req.user.id }, { isPasswordAuthy: 1 }, (err, result) => {
            if (err) {
                res.status(200).json({ success: false, msg: err, type: 'trade 2FA status' });
            } else {
                res.json(result);
            }
        });
    } catch (error) {
        console.log(error);
    }
};

/**
 * getting google QR code controller 
 */
let getGoogleQRCode = async (req, res, next) => {
    try {
        User.findById(req.user.id, (err, user) => {
            if (err) {
                res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'Google QR code ' });
            } else {
                if (user.googleQrUrl) {
                    res.status(200).json(user.googleQrUrl);
                } else {
                    let secret = speakeasy.generateSecret({ name: "wallebi.com", issuer: "wallebiIssuer", length: 30 });
                    let token = speakeasy.totp({
                        secret: secret.base32,
                        encoding: 'base32'
                    });
                    User.findByIdAndUpdate(req.user.id, { googleQrUrl: secret.otpauth_url, googleUserKey: secret.base32 }, { new: true }, (err, result) => {
                        if (err) {
                            res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'Google QR code ' });
                        } else {
                            res.status(200).json(result.googleQrUrl);
                        }
                    });
                }
            }
        });
    } catch (error) {
        res.status(200).json({success: false, msg: 'Something went wrong!', type: 'main catch'});
    }
};

/**
 * 2FA google verify controller
 */
let twoFAGoogleVerify = async (req, res, nextt) => {
    try {
        User.findOne({ email: req.body.email }, (err, user) => {
            if (err) {
                res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'Verify Google' });
            } else {
                if (user.googleUserKey) {
                    let userToken = req.body.verifyCode;
                    let secret = user.googleUserKey;
                    let verified = speakeasy.totp.verify({
                        secret: secret,
                        encoding: 'base32',
                        token: userToken
                    });
                    if (verified === true) {
                        User.findByIdAndUpdate(req.user.id, { googleVerify: true }, { new: true }, (err, result) => {
                            if (err) {
                                res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'Verify Google' });
                            } else {
                                res.status(200).json({ msg: " Google Verify Successfully!", type: "Verify Google" });
                            }
                        });
                    } else {
                        res.status(200).json({ success: false, msg: 'Google verify failed!', type: 'Verify Google' });
                    }
                } else {
                    res.status(200).json({ success: false, msg: 'Google Verify Failed', type: 'Verify Google' });
                }
            }
        });
    } catch (error) {
        res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'Verify Google' });
    }
};


/**
 * 2FA verify google controller
 */
let twoFAVerifyGoogle = async (req, res, next) => {
    try {
        User.findById(req.user.id, (err, user) => {
            if (err) {
                res.status.json({ success: false, msg: err, type: 'Verify Google' });
            } else {
                if (user.googleUserKey) {
                    let userToken = req.body.verifyCode;
                    let secret = user.googleUserKey;
                    let verified = speakeasy.totp.verify({
                        secret: secret,
                        encoding: 'base32',
                        token: userToken
                    });
                    if (verified === true) {
                        User.findByIdAndUpdate(req.user.id, { googleVerify: true }, { new: true }, (err, data) => {
                            if (err || data === null) {
                                res.status(200).json({ success: false, msg: err, type: 'Verify Google' });
                            } else {
                                res.status(200).json({ success: true, msg: 'Google Verify Successfully!', type: 'Verify Google' });
                            }
                        });
                    } else {
                        res.status(200).json({ success: false, msg: 'Google Verify Failed', type: 'Verify Google' });
                    }
                } else {
                    res.status(200).json({ success: false, msg: 'Google Verify Failed', type: 'Verify Google' });
                }
            }
        });
    } catch (error) {
        res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'Verify Google' });
    }
};

/**
 * enable/disable 2FA google verify controller
 */
let twoFAForGoogle = async (req, res, next) => {
    try {
        User.findByIdAndUpdate(req.user.id, { isGoogleAuthy: req.body.isGoogleAuthy }, { new: true }, (err, result) => {
            if (err || result === null) {
                res.status(200).json({ success: false, msg: 'Failed', type: '2FA Google' });
            } else {
                if (result.isGoogleAuthy === true) {
                    res.status(200).json({ success: true, msg: '2FA Enabled for google now', type: '2FA google' });
                }
                if (result.isGoogleAuthy === false) {
                    res.status(200).json({ success: true, msg: '2FA Disabled for google now', type: '2FA google' });
                }
            }
        });
    } catch (error) {
        res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'Verify Google' });
    }
};


export {
    changePassword,
    chnageAuthyPassword,
    twoFAForLogin,
    statusTwoFALogin,
    twoFAForWithdraw,
    statusTwoFAWithdraw,
    twoFAForTrade,
    statusTwoFATrade,
    twoFAForPasswordChange,
    statusTwoFAChangePassword,
    getGoogleQRCode,
    twoFAGoogleVerify,
    twoFAForGoogle,
    twoFAVerifyGoogle
}