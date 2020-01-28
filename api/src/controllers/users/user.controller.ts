import { User } from '../../db/models/users/users.model';
import { JwtSign } from '../../services/UserService/jwt.token.service';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import { mailer } from '../../services/UserService/mail.service';
import { sender, JWTSecret } from '../../config/config';
import { createSignuplogs, checkDevice, verifyNewDevice } from '../../services/UserService/device.verification.service';
import { comparePassword } from '../../services/UserService/compare.password.service';
import { sendSMSisAuthy } from '../../services/UserService/sms.omniChannel.service';
import * as macaddress from 'macaddress';
import { UserProfile } from '../../db/models/users/userProfile.model';
import { EmailTemplate } from '../../db/models/emailTemplate/emailTemplate.model';







/**
 * user registration controller 
 * @param {String} firstname;
 * @param {String} lastname;
 * @param {String} email;
 * @param {String} password;
 * @param {String} userLangulage;
 * @param {String} referralCode;
 * 
 * 
 */
let userRegister = async (req, res, next) => {
    try {
        if (req.body.referralCode != undefined && req.body.referralCode != '') {
            User.findOne({ referralCode: req.body.referralCode }, (err, data) => {
                if (data == undefined || data == '' || data == null) {
                    res.status(200).json({ success: false, msg: "The referral you entered is not valid!", type: "not valid" });
                    return false;
                } else {
                    let callRegister = registerComplete(req, res, data._id);
                }
            });
        } else {
            let callRegister = registerComplete(req, res);
        }
    } catch (error) {
        console.log(error);
    }
}

/**
 * @param {String} firstname;
 * @param {String} lastname;
 * @param {String} email;
 * @param {String} password;
 * @param {String} userLangulage;
 * @param {String} referralCode;
 * 
 * 
 */

let registerComplete = async (req, res, referralId = '') => {
    let { firstname, lastname, email, password, userLanguage, referralCode } = req.body;
    email = email.toLowerCase()

    userLanguage = userLanguage == '' ? 'en' : userLanguage;
    var user;
    /* 
    If referralId is not availabel
    */
    if (referralId == "") {
        user = {
            firstname: firstname,
            lastname: lastname,
            email: email,
            password: password,
            ethAddressUpdate: "Y",
            language: userLanguage,
            referralCode: 'WA-' + Math.floor(Date.now() / 1000),
            registerOn: req.headers.origin
        };
    }
    else {
        /**
         * If referralId is available
         *  */
        user = {
            firstname: firstname,
            lastname: lastname,
            email: email,
            password: password,
            ethAddressUpdate: "Y",
            language: userLanguage,
            referralId: referralId,
            referralCode: 'WA-' + Math.floor(Date.now() / 1000),
            registerOn: req.headers.origin
        };
    }
    User.findOne({ email: email }, async (err, data) => {
        /**
         *  checking if email id is already exists */

        if (err || data != null) {
            res.status(200).json({ success: false, msg: "This email already exists please provide another email address!", type: "email exists" });
        } else {
            /** 
             * if email id is not registered then create new account
             * */

            /**
             * hashing user password 
             */
            let salt = await bcrypt.genSaltSync(10);
            user.password = await bcrypt.hashSync(user.password, salt);

            /**
             * createing new user in the database
             */
            User.create(user, (err) => {
                if (err) {
                    res.status(400).json({ status: 'invalid' });
                } else {
                    /*
                    email for user registration and genrating token for verfying user email address.
                    **/
                    let mailOptions;
                    JwtSign({ email: user.email }, (err, token) => {
                        if (err) {
                            throw err;
                        } else {
                            EmailTemplate.findOne({ mailType: 'verify-email-address' }).then((mailVerifyTemplate) => {
                                if (mailVerifyTemplate) {
                                    let emailHTML;
                                    let emailSubject;
                                    let verifyButton = '<a href="' + req.headers.origin + '/emailVerification?token=' + token + '" style="background-color: #045ab6;border: none;color: white;padding: 15px 32px;text-align: center;text-decoration: none;display: inline-block;font-size: 16px;cursor: pointer;box-shadow: 0 0.2rem 0.2rem 0 rgba(0, 0, 0, 1.1) !important;">Verify Email</a>';
                                    let verifylink = '<a href="' + req.headers.origin + '/emailVerification?token=' + token + '">' + req.headers.origin + '/emailVerification?token=' + token + '</a>';
                                    if (user.language === 'fa') {
                                        emailHTML = mailVerifyTemplate.emailBodyFarsi;
                                        emailSubject = mailVerifyTemplate.subjectFarsi;
                                        emailHTML = emailHTML.replace("{verify_email}", verifyButton);
                                        emailHTML = emailHTML.replace("{verify_link}", verifylink);
                                        mailOptions = {
                                            from: sender, // sender address
                                            to: user.email, // list of receivers
                                            subject: emailSubject, // Subject line
                                            html: emailHTML // html body
                                        };
                                    } else {
                                        emailHTML = mailVerifyTemplate.emailBody;
                                        emailSubject = mailVerifyTemplate.subject;
                                        emailHTML = emailHTML.replace("{verify_email}", verifyButton);
                                        emailHTML = emailHTML.replace("{verify_link}", verifylink);
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
                                res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'no email template', error: error });
                            });
                        }
                    });
                    createSignuplogs(req, res, (err, response) => {
                        if (err) {
                            res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'create login logs', error: err });
                        } else {
                            res.status(200).json({ success: true, msg: "Thank You for Your Registration Please Check Your Email To Proceed Login", type: "email verification", });
                        }
                    });
                }
            })
        }
    })
}

/**
user emailVerification controller 
* @param {String} token;
*/

let emailVerification = async (req, res, next) => {
    try {
        jwt.verify(req.params.token, "secret", (err, decode) => {
            if (err) {
                res.json({ success: false, msg: "Your verification email has expired", type: "token expired" });
            } else {
                User.findOneAndUpdate({ email: decode.email }, { isemail: true }, { new: true }, (err, user) => {
                    if (err) {
                        res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'error in email verify', error: err });
                    } else {
                        let mailOptions;
                        EmailTemplate.findOne({ mailType: 'user-email-verified' }).then((mailVerifyTemplate) => {
                            if (mailVerifyTemplate) {
                                let emailHTML;
                                let emailSubject;
                                if (user.language === 'fa') {
                                    emailHTML = mailVerifyTemplate.emailBodyFarsi;
                                    emailSubject = mailVerifyTemplate.subjectFarsi;
                                    emailHTML = emailHTML.replace("{user_firstname}", user.firstname);
                                    mailOptions = {
                                        from: sender, // sender address
                                        to: user.email, // list of receivers
                                        subject: emailSubject, // Subject line
                                        html: emailHTML // html body
                                    };
                                } else {
                                    emailHTML = mailVerifyTemplate.emailBody;
                                    emailSubject = mailVerifyTemplate.subject;
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
                            res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'no email template', error: error });
                        });
                        res.json({ success: true, msg: "Welcome To Wallebi. Your Email Has Been Verified Successfully! You can login now.", type: "email verified" });
                    }
                });
            }
        });
    } catch (error) {
        console.log(error);
    }
}

/**
user login controller 
* @param {String} email;
* @param {String} password;
*/
let login = async (req, res, next) => {
    try {
        let { email, password } = req.body;
        email = email.toLowerCase();
        User.findOne({ email: email }, async (err, user) => {
            if (err || user == null) {
                res.status(200).json({ success: false, msg: "Please check your email or password", type: "invalid email or password" });
            } else {
                if (user.isemail) {
                    let isMatch = comparePassword(password, user.password);
                    if (isMatch) {
                        if (!user.isPreventLogin) {
                            macaddress.one((err, mac) => {
                                if (err || mac === null) {
                                    res.status(200).json({ success: false, msg: 'Something went wrong', type: 'No Mac' });
                                } else {
                                    checkDevice(req, res, user, mac, async (err, data) => {
                                        if (err) {
                                            res.status(200).json({ success: false, msg: 'Unknown device', type: 'device verification' });
                                        } else {
                                            if (user.isAuthy) {
                                                let min = Math.ceil(100000);
                                                let max = Math.floor(999999);
                                                let randomNumber = Math.floor(Math.random() * (max - min)) + min;
                                                let userProfile = await UserProfile.findOneAndUpdate({ userId: user.id }, { smscode: randomNumber }, { new: true });
                                                if (userProfile) {
                                                    let smsResponse = await sendSMSisAuthy(randomNumber, userProfile.mobile, user, 'Login');
                                                    if (smsResponse) {
                                                        res.status(200).json({ success: true, msg: "Check your SMS for Verification code", type: "check Message", isAuthy: true });
                                                    } else {
                                                        res.status(200).json({ success: false, msg: "SMS code send failed", type: "send  failed", error: err });
                                                    }
                                                } else {
                                                    res.status(200).json({ success: false, msg: "SMS code send failed", type: "send  failed", error: err });
                                                }
                                            } else {
                                                jwt.sign({
                                                    id: user._id,
                                                    firstname: user.firstname,
                                                    lastname: user.lastname,
                                                    email: user.email,
                                                    language: user.language,
                                                    currency: user.currency,
                                                    referralCode: user.referralCode,
                                                    isemail: user.isemail,
                                                    isAuthy: user.isAuthy,
                                                    approval: user.approval,
                                                    numberVerify: user.numberVerify,
                                                    googleVerify: user.googleVerify,
                                                    isPasswordAuthy: user.isPasswordAuthy,
                                                    isWithdrawAuthy: user.isWithdrawAuthy,
                                                    isTradeAuthy: user.isTradeAuthy,
                                                    isGoogleAuthy: user.isGoogleAuthy,
                                                    ethAddressUpdate: user.ethAddressUpdate
                                                }, JWTSecret, { expiresIn: 60 * 60 * 12 }, async (err, token) => {
                                                    if (err) {
                                                        res.status(200).json({ success: false, msg: 'Unable to login!', type: 'login' });
                                                    } else {
                                                        let mailOptions;
                                                        await EmailTemplate.findOne({ mailType: "user-account-logged-in" }).then((loginTemplate) => {
                                                            if (loginTemplate) {
                                                                let emailHTML;
                                                                let emailSubject;
                                                                let resetButton = `<a href="https://wallebi.com/forgot-password" style="background-color: #045ab6;
                                                                border: none;
                                                                color: white;
                                                                padding: 15px 32px;
                                                                text-align: center;
                                                                text-decoration: none;
                                                                display: inline-block;
                                                                font-size: 16px;
                                                                cursor: pointer;
                                                                box-shadow: 0 0.2rem 0.2rem 0 rgba(0, 0, 0, 1.1) !important;">Reset</a>`;
                                                                let deviceInfo;
                                                                if (user.language === 'fa') {
                                                                    deviceInfo = ` ${req.useragent.platform}, ${req.useragent.browser} در ${Date()}حساب شما وارد شده است`
                                                                    emailHTML = loginTemplate.emailBodyFarsi;
                                                                    emailSubject = loginTemplate.subjectFarsi;
                                                                    emailHTML = emailHTML.replace("{logged_in_device_info}", deviceInfo);
                                                                    emailHTML = emailHTML.replace("{reset-password-button}", resetButton);
                                                                    mailOptions = {
                                                                        from: sender, // sender address
                                                                        to: user.email, // list of receivers
                                                                        subject: emailSubject, // Subject line
                                                                        html: emailHTML // html body
                                                                    };
                                                                } else {
                                                                    deviceInfo = `Your account logged in on ${req.useragent.platform}, ${req.useragent.browser} at ${Date()}`;
                                                                    emailHTML = loginTemplate.emailBody;
                                                                    emailSubject = loginTemplate.subject;
                                                                    emailHTML = emailHTML.replace("{logged_in_device_info}", deviceInfo);
                                                                    emailHTML = emailHTML.replace("{reset-password-button}", resetButton);
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
                                                            res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'in email template catch', error: error });
                                                        });
                                                        res.status(200).json({ token, success: true, msg: 'Login Successfully', type: 'login' });
                                                    }
                                                });
                                            }
                                        }
                                    });
                                }
                            });
                        } else {
                            res.status(200).json({ success: false, msg: 'Please contact to our customer support!', type: 'customer disabled' });
                        }
                    } else {
                        res.status(200).json({ success: false, msg: 'Please check your email or password', type: 'details not match' });
                    }
                } else {
                    res.status(200).json({ success: false, msg: 'Please verify your email first', openResend: true, type: 'email not verifyied' });
                }
            }
        });
    } catch (error) {
        res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'main catch', error: error });
    }
}


/**
 * resend email for the verification of email 
 * @param req 
 * @param res 
 * @param next 
 */
let resendEmailForVerification = async (req, res, next) => {
    try {
        let { email } = req.body;
        await User.findOne({ email: email }).then((user) => {
            if (user) {
                let mailOptions;
                JwtSign({ email: user.email }, (err, token) => {
                    if (err) {
                        res.status(200).json({success: false, msg: 'Something went wrong!', type: 'in JWT'});
                    } else {
                        EmailTemplate.findOne({ mailType: 'verify-email-address' }).then((mailVerifyTemplate) => {
                            if (mailVerifyTemplate) {
                                let emailHTML;
                                let emailSubject;
                                let verifyButton = '<a href="' + req.headers.origin + '/emailVerification?token=' + token + '" style="background-color: #045ab6;border: none;color: white;padding: 15px 32px;text-align: center;text-decoration: none;display: inline-block;font-size: 16px;cursor: pointer;box-shadow: 0 0.2rem 0.2rem 0 rgba(0, 0, 0, 1.1) !important;">Verify Email</a>';
                                let verifylink = '<a href="' + req.headers.origin + '/emailVerification?token=' + token + '">' + req.headers.origin + '/emailVerification?token=' + token + '</a>';
                                if (user.language === 'fa') {
                                    emailHTML = mailVerifyTemplate.emailBodyFarsi;
                                    emailSubject = mailVerifyTemplate.subjectFarsi;
                                    emailHTML = emailHTML.replace("{verify_email}", verifyButton);
                                    emailHTML = emailHTML.replace("{verify_link}", verifylink);
                                    mailOptions = {
                                        from: sender, // sender address
                                        to: user.email, // list of receivers
                                        subject: emailSubject, // Subject line
                                        html: emailHTML // html body
                                    };
                                } else {
                                    emailHTML = mailVerifyTemplate.emailBody;
                                    emailSubject = mailVerifyTemplate.subject;
                                    emailHTML = emailHTML.replace("{verify_email}", verifyButton);
                                    emailHTML = emailHTML.replace("{verify_link}", verifylink);
                                    mailOptions = {
                                        from: sender, // sender address
                                        to: user.email, // list of receivers
                                        subject: emailSubject, // Subject line
                                        html: emailHTML // html body
                                    };
                                }
                                mailer(mailOptions);
                                res.status(200).json({ success: true, msg: 'Please check your email address. We have sent you a verification email!', type: 'mail sent' });
                            }
                        }).catch((error) => {
                            res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'no email template', error: error });
                        });
                    }
                });
            }
        }).catch((error) => {
            res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'in find user catch' });
        });
    } catch (error) {
        res.status(200).json({ success: false, msg: 'something went wrong!', type: 'in main catch' });
    }
};




/**
 * verify login otp
 * @param req 
 * @param res 
 * @param next 
 */
let verifyLoginOtp = async (req, res, next) => {
    let { email, smsCode } = req.body;
    email = email.toLowerCase();
    try {
        let user = await User.findOne({ email: email });
        if (user) {
            let userProfile = await UserProfile.findOne({ userId: user.id });
            if (userProfile) {
                if (userProfile.smscode === smsCode) {
                    jwt.sign({
                        id: user._id,
                        firstname: user.firstname,
                        lastname: user.lastname,
                        email: user.email,
                        mobile: userProfile.mobile,
                        language: user.language,
                        currency: user.currency,
                        referralCode: user.referralCode,
                        isemail: user.isemail,
                        isAuthy: user.isAuthy,
                        approval: user.approval,
                        myWallet: user.myWallet,
                        numberVerify: userProfile.numberVerify,
                        googleVerify: user.googleVerify,
                        isPasswordAuthy: user.isPasswordAuthy,
                        isWithdrawAuthy: user.isWithdrawAuthy,
                        isTradeAuthy: user.isTradeAuthy,
                        isGoogleAuthy: user.isGoogleAuthy,
                        ethAddressUpdate: user.ethAddressUpdate
                    }, JWTSecret, { expiresIn: 60 * 60 * 60 }, async (err, token) => {
                        if (err) {
                            res.status(200).json({ success: false, msg: 'Unable to login!', type: 'login' });
                        } else {
                            let mailOptions;
                            await EmailTemplate.findOne({ mailType: "user-account-logged-in" }).then((loginTemplate) => {
                                if (loginTemplate) {
                                    let emailHTML;
                                    let emailSubject;
                                    let resetButton = `<a href="https://wallebi.com/forgot-password" style="background-color: #045ab6;
                                    border: none;
                                    color: white;
                                    padding: 15px 32px;
                                    text-align: center;
                                    text-decoration: none;
                                    display: inline-block;
                                    font-size: 16px;
                                    cursor: pointer;
                                    box-shadow: 0 0.2rem 0.2rem 0 rgba(0, 0, 0, 1.1) !important;">Reset</a>`;
                                    let deviceInfo;
                                    if (user.language === 'fa') {
                                        deviceInfo = ` ${req.useragent.platform}, ${req.useragent.browser} در ${Date()}حساب شما وارد شده است`
                                        emailHTML = loginTemplate.emailBodyFarsi;
                                        emailSubject = loginTemplate.subjectFarsi;
                                        emailHTML = emailHTML.replace("{logged_in_device_info}", deviceInfo);
                                        emailHTML = emailHTML.replace("{reset-password-button}", resetButton);
                                        mailOptions = {
                                            from: sender, // sender address
                                            to: user.email, // list of receivers
                                            subject: emailSubject, // Subject line
                                            html: emailHTML // html body
                                        };
                                    } else {
                                        deviceInfo = `Your account logged in on ${req.useragent.platform}, ${req.useragent.browser} at ${Date()}`;
                                        emailHTML = loginTemplate.emailBody;
                                        emailSubject = loginTemplate.subject;
                                        emailHTML = emailHTML.replace("{logged_in_device_info}", deviceInfo);
                                        emailHTML = emailHTML.replace("{reset-password-button}", resetButton);
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
                                res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'in email template catch', error: error });
                            });
                            res.status(200).json({ token, success: true, msg: 'Login Successfully', type: 'login' });
                        }
                    });
                } else {
                    res.status(200).json({ success: false, msg: 'Your verification OTP is invalid', type: 'verify 2FA otp' });
                }
            } else {
                res.status(200).json({ success: false, msg: 'Your verification OTP is invalid', type: 'verify 2FA otp' });
            }
        } else {
            res.status(200).json({ success: false, msg: 'Your verification OTP is invalid', type: 'verify 2FA otp' });
        }
    } catch (error) {
        console.log(error);
    }
};

/**
user device verification controller 
* @param {String} mac address in base 64;
*/
let deviceVerification = async (req, res, next) => {
    try {
        let { token, email } = req.body;
        let mac = Buffer.from(token, 'base64').toString('ascii');
        macaddress.one((err, currentmac) => {
            if (err) {
                res.status(500).json({ success: false, msg: err, type: 'device verification' });
            }
            if (mac === currentmac) {
                verifyNewDevice(req, res, currentmac, (err, data) => {
                    if (err) {
                        res.status(500).json({ success: false, msg: err, type: 'device verification' });
                    } else {
                        res.status(200).json({ success: true, msg: 'Your device is verified now.', type: 'device verification' });
                    }
                });
            } else {
                res.json({ success: false, msg: 'Please use that device which you are using at registeration time', type: 'device verification' });
            }
        });
    } catch (error) {
        console.log(error);
    }
}

/**
user reset Password controller 
* @param {String} email;
*/
let forgetPassword = async (req, res, next) => {
    try {
        User.findOne({ email: req.body.email }, (err, user) => {
            if (err) {
                res.status(500).json({ success: false, msg: err, type: 'forgot password' });
            }
            if (user) {
                let mailOptions;
                JwtSign({ email: user.email }, async (err, token) => {
                    if (err) {
                        res.status(500).json({ success: false, msg: 'Error in genrating forgot token', type: 'forgot password' });
                    } else {
                        await EmailTemplate.findOne({ mailType: 'user-reset-password' }).then((resetPasswordTemplate) => {
                            if (resetPasswordTemplate) {
                                let emailHTML;
                                let emailSubject;
                                let resetButton = '<a href="' + req.headers.origin + '/reset-password?token=' + token + '" style="background-color: #045ab6;border: none;color: white;padding: 15px 32px;text-align: center;text-decoration: none;display: inline-block;font-size: 16px;cursor: pointer;box-shadow: 0 0.2rem 0.2rem 0 rgba(0, 0, 0, 1.1) !important;">Reset Password</a>';;
                                if (user.language === 'fa') {
                                    emailHTML = resetPasswordTemplate.emailBodyFarsi;
                                    emailSubject = resetPasswordTemplate.subjectFarsi;
                                    emailHTML = emailHTML.replace("{user_firstname}", user.firstname);
                                    emailHTML = emailHTML.replace("{reset-password-button}", resetButton);
                                    mailOptions = {
                                        from: sender, // sender address
                                        to: user.email, // list of receivers
                                        subject: emailSubject, // Subject line
                                        html: emailHTML // html body
                                    };
                                } else {
                                    emailHTML = resetPasswordTemplate.emailBody;
                                    emailSubject = resetPasswordTemplate.subject;
                                    emailHTML = emailHTML.replace("{user_firstname}", user.firstname);
                                    emailHTML = emailHTML.replace("{reset-password-button}", resetButton);
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
                            res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'in email template catch', error: error });
                        });
                        res.status(200).json({ success: true, msg: "Please check your email for reset password process!", type: "forget password", });
                    }
                });
            } else {
                res.json({ success: false, msg: 'User not found', type: 'Forgot Password' });
            }
        });
    } catch (error) {
        console.log(error);
    }
}


/**
user reset Password controller 
* @param {String} email;
*/
let resetPassword = async (req, res, next) => {
    try {
        jwt.verify(req.body.tokens, JWTSecret, (err, decode) => {
            if (err) {
                res.json({ success: false, msg: 'Your link is expired', type: 'reset password' });
            } else {
                var email = decode.email;
                User.findOne({ email: email }, (err, user) => {
                    if (err) {
                        res.json({ success: false, msg: err, type: 'reset password' });
                    } else {
                        bcrypt.hash(req.body.password, 10, (err, hash) => {
                            var password = hash;
                            User.findOneAndUpdate({ email: email }, { password: password }, async (err, data) => {
                                if (err) {
                                    res.json({ success: false, msg: err, type: "password update error" });
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
                                    res.json({ success: true, msg: "Your password updated successfully!", type: "password update" });
                                }
                            })
                        });
                    }
                });
            }
        });
    } catch (error) {
        console.log(error);
    }
}


/**
 * getting the user profile
 */
let userProfile = async (req, res, next) => {
    try {
        let user = await User.findById(req.user.id, { password: 0 }).populate('userProfileId');
        if (user) {
            res.json({ user });
        }
    } catch (error) {
        res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'in main catch' });
    }
};


/**
 * updating user language
 */
let updateLanguage = async (req, res, next) => {
    try {
        User.findByIdAndUpdate(req.user.id, { language: req.body.language }, (err, user) => {
            if (err || user === null) {
                res.status(200).json({ success: false, msg: err, type: 'update language' });
            } else {
                res.status(200).json({ success: true, msg: 'Your language updated successfully!' });
            }
        });
    } catch (error) {
        res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'in main catch' });
    }
};

/**
 * 
 * @param userId
 */

let chanageCurrency = async (req, res, next) => {
    try {
        User.findByIdAndUpdate(req.user.id, { currency: req.body.currency }, { new: true }, (err, result) => {
            if (err) {
                res.status(200).json({ success: false, msg: err, type: 'Update Currency' });
            } else {
                res.status(200).json({ success: true, msg: 'Your currency updated successfully!', type: 'Update Currency' });
            }
        });
    } catch (error) {
        console.log(error);
    }
};


/**
 * getting referral user 
 */
let getReferralUser = async (req, res, next) => {
    try {
        User.find({ referralId: req.user.id }, (err, user) => {
            if (err || user === null) {
                res.status(200).json({ success: false, msg: err, type: 'update language' });
            } else {
                res.json(user);
            }
        }).select('date firstname lastname email approval');
    } catch (error) {
        console.log(error);
    }
};





export {
    userRegister,
    emailVerification,
    login,
    verifyLoginOtp,
    deviceVerification,
    forgetPassword,
    resetPassword,
    userProfile,
    updateLanguage,
    chanageCurrency,
    getReferralUser,
    resendEmailForVerification
}