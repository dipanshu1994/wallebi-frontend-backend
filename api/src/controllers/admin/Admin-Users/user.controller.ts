import { User } from "../../../db/models/users/users.model";
import { Wallets } from "../../../db/models/Wallets/wallet.model";
import { LoginLog } from "../../../db/models/users/login.loges.model";
import { UserProfile } from "../../../db/models/users/userProfile.model";
import { mailer } from "../../../services/UserService/mail.service";
import { sender } from "../../../config/config";
import { removeFile } from "../../../services/AdminService/admin.service";
import * as fs from 'fs';
import { SendReceiveTrx } from "../../../db/models/Wallets/sendReceiveTransaction.model";
import { BankAccount } from "../../../db/models/users/userBankAccount.model";
import { TradeWallet } from "../../../db/models/Wallets/trade.wallet.model";
import { EmailTemplate } from "../../../db/models/emailTemplate/emailTemplate.model";


/**
 * getting all users all data for pagination 
 */
let allUsersDetails = async (req, res, next) => {
    try {
        let filter = {};
        let { pageIndex, pageSize, search } = req.query;
        let pgNo = Number(pageIndex);
        let recordPerPage = Number(pageSize);
        let pageSkip = Math.abs(recordPerPage * pgNo);
        if (req.query.search === '' || req.query.search === 'undefined') {
            filter = {};
        } else {
            filter = { $or: [{ firstname: { $regex: search } }, { lastname: { $regex: search } }, { email: { $regex: search } }, { approval: { $regex: search } }] };
        }
        let user = await User.find(filter).populate('userProfileId').skip(pageSkip).limit(recordPerPage).sort({ date: -1 });
        let count = await User.find(filter).countDocuments();
        res.status(200).json({ users: user, count: count, success: true, current: pgNo, pages: Math.ceil(count / recordPerPage) })
    } catch (error) {
        res.status(200).json({ success: false, msg: 'Something went wrong', type: 'in main catch', error: error });
    }
};



/**
 * getting all information of single user
 */
let userCompleteProfile = async (req, res, next) => {
    try {
        let { id } = req.params;
        let user = await User.findById(id, { password: 0 }).populate('userProfileId');
        if (user) {
            res.json({ user });
        } else {
            res.status(200).json({ success: false, msg: `something went wrong!` });
        }
    } catch (error) {
        res.status(200).json({ success: false, msg: 'Something went wrong', type: 'in main catch', error: error });
    }
};



/**
 * getting singal user main wallet
 * @param req 
 * @param res 
 * @param next 
 */
let userWallets = async (req, res, next) => {
    try {
        let { id } = req.params;
        await Wallets.find({ userId: id }, { userId: 0, decimals: 0, secret: 0, account_name: 0, password: 0, account_index: 0, contractAddress: 0 }).then((wallet) => {
            if (wallet) {
                res.status(200).json(wallet);
            }
        }).catch((error) => {
            res.status(200).json({ success: false, msg: error, type: error });
        });
    } catch (error) {
        res.status(200).json({ success: false, msg: error, type: error });
    }
};




/**
 * getting singal user main wallet
 * @param req 
 * @param res 
 * @param next 
 */
let userTradeWallets = async (req, res, next) => {
    try {
        let { id } = req.params;
        await TradeWallet.find({ userId: id }).populate('currencyId').then((tradeWallet) => {
            if (tradeWallet) {
                res.status(200).json(tradeWallet);
            }
        }).catch((error) => {
            res.status(200).json({ success: false, msg: error, type: error });
        });
    } catch (error) {
        res.status(200).json({ success: false, msg: error, type: error });
    }
};



/**
 * getting all login logs information of single user
 */
let userLoginLogsInfo = async (req, res, next) => {
    try {
        let { id } = req.params;
        let logs = await LoginLog.find({ userid: id }, { _id: 0, userid: 0 });
        if (logs) {
            res.json(logs);
        } else {
            res.status(200).json({ success: false, msg: `something went wrong!` });
        }
    } catch (error) {
        res.status(200).json({ success: false, msg: 'Something went wrong', type: 'in main catch', error: error });
    }
};


/**
 * approve or freez user profile
 */
let approveOrFreezUserProfile = async (req, res, next) => {
    try {
        let { id, approval } = req.body;
        let user = await User.findByIdAndUpdate(id, { approval: approval }, { new: true });
        if (user) {
            res.json({ success: true, msg: `User profile is now ${user.approval}` });
        } else {
            res.status(200).json({ success: false, msg: `something went wrong!` });
        }

    } catch (error) {
        res.status(200).json({ success: false, msg: 'Something went wrong', type: 'in main catch', error: error });
    }
};



/**
 * prevent customer from login
 */
let disableCustomer = async (req, res, next) => {
    try {
        let { userId, typeOfUser, rejectionResosn } = req.body;
        await User.findOneAndUpdate({ _id: userId }, { isPreventLogin: typeOfUser }, { new: true }).then(async (users) => {
            let mailOptions;
            let type = '';
            if (users.isPreventLogin === true) {
                type = 'disabled';
                await EmailTemplate.findOne({ mailType: 'account-blocked' }).then((disableTemplate) => {
                    let emailHtml;
                    if (disableTemplate) {
                        if (users.language === 'fa') {
                            emailHtml = disableTemplate.emailBodyFarsi;
                            emailHtml = emailHtml.replace("{blocked_reason}", rejectionResosn);
                            emailHtml = emailHtml.replace("{user_firstname}", users.firstname);
                            mailOptions = {
                                from: sender, // sender address
                                to: users.email, // list of receivers
                                subject: disableTemplate.subjectFarsi, // Subject line
                                html: emailHtml // html body
                            }
                        } else {
                            emailHtml = disableTemplate.emailBody;
                            emailHtml = emailHtml.replace("{blocked_reason}", rejectionResosn);
                            emailHtml = emailHtml.replace("{user_firstname}", users.firstname);
                            mailOptions = {
                                from: sender, // sender address
                                to: users.email, // list of receivers
                                subject: disableTemplate.subject, // Subject line
                                html: emailHtml // html body
                            }
                        }
                    }
                    mailer(mailOptions);
                    res.status(200).json({ success: true, msg: `Customer profile is now ${type}!`, type: 'user prevent' });
                }).catch((error) => {
                    res.status(200).json({ success: false, msg: 'Something went wrong', type: 'in template catch', error: error });
                });
            }
            if (users.isPreventLogin === false) {
                type = 'enable';
                await EmailTemplate.findOne({ mailType: 'account-active' }).then((emailTemplate) => {
                    let emailHtml;
                    if (emailTemplate) {
                        if (users.language === 'fa') {
                            emailHtml = emailTemplate.emailBodyFarsi;
                            emailHtml = emailHtml.replace("{user_firstname}", users.firstname);
                            mailOptions = {
                                from: sender, // sender address
                                to: users.email, // list of receivers
                                subject: emailTemplate.subjectFarsi, // Subject line
                                html: emailHtml // html body
                            }
                        } else {
                            emailHtml = emailTemplate.emailBody;
                            emailHtml = emailHtml.replace("{user_firstname}", users.firstname);
                            mailOptions = {
                                from: sender, // sender address
                                to: users.email, // list of receivers
                                subject: emailTemplate.subject, // Subject line
                                html: emailHtml // html body
                            }
                        }
                    }
                    mailer(mailOptions);
                    res.status(200).json({ success: true, msg: `Customer profile is now ${type}!`, type: 'user prevent' });
                }).catch((error) => {
                    res.status(200).json({ success: false, msg: 'Something went wrong', type: 'in template catch', error: error });
                });
            }
        }).catch((error) => {
            res.status(200).json({ success: false, msg: 'Something went wrong', type: 'in find user catch', error: error });
        });
    } catch (error) {
        res.status(200).json({ success: false, msg: 'Something went wrong', type: 'in main catch', error: error });
    }
};


/**
 * verify user id proof front
 */
let verifyCustomerFrontProof = async (req, res, next) => {
    try {
        let { id, doc_verification } = req.body;
        let updatedData = {};
        updatedData['doc_verification'] = doc_verification;
        let updatedKyc = await UserProfile.findOneAndUpdate({ userId: id }, updatedData);
        if (updatedKyc) {
            let user = await User.findById({ _id: id });
            if (user) {
                let mailOptions;
                await EmailTemplate.findOne({ mailType: 'front-side-verified' }).then((userVerified) => {
                    if (userVerified) {
                        let emailHTML;
                        let emailSubject;
                        if (user.language === 'fa') {
                            emailHTML = userVerified.emailBodyFarsi;
                            emailSubject = userVerified.subjectFarsi;
                            emailHTML = emailHTML.replace("{user_firstname}", user.firstname);
                            mailOptions = {
                                from: sender, // sender address
                                to: user.email, // list of receivers
                                subject: emailSubject, // Subject line
                                html: emailHTML // html body
                            };
                        } else {
                            emailHTML = userVerified.emailBody;
                            emailSubject = userVerified.subject;
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
                res.status(200).json({ success: true, msg: `Customer front proof is ${doc_verification}!`, type: 'id verified' });
            } else {
                res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'Error in verify id proof!' });
            }
        } else {
            res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'Error in verify id proof!' });
        }
    } catch (error) {
        res.status(200).json({ success: false, msg: 'Something went wrong', type: 'in main catch', error: error });
    }
};



/***
 * reject customer id proof front side
 */
let rejectCustomerFrontProof = async (req, res) => {
    try {
        let { userId, rejectionResosn, rejectedDocument } = req.body;
        let updatedData = {};
        updatedData['doc_verification'] = rejectedDocument.doc_verification;
        updatedData['doc_verification_front_rejection_reason'] = rejectionResosn;
        if (rejectedDocument.doc_verification === 'rejected') {
            updatedData['id_proof_front'] = '';
        }
        let updatedKyc = await UserProfile.findOneAndUpdate({ userId: userId }, updatedData);
        if (updatedKyc) {
            fs.unlink(`./dist/public/images/userIDProof/${updatedKyc.id_proof_front}`, async (err) => {
                if (err) {
                    res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'No file' });
                } else {
                    let user = await User.findById({ _id: userId });
                    if (user) {
                        let mailOptions;
                        await EmailTemplate.findOne({ mailType: 'front-side-rejected' }).then((frontSideRejected) => {
                            if (frontSideRejected) {
                                let emailHTML;
                                let emailSubject;
                                if (user.language === 'fa') {
                                    emailHTML = frontSideRejected.emailBodyFarsi;
                                    emailSubject = frontSideRejected.subjectFarsi;
                                    emailHTML = emailHTML.replace("{user_firstname}", user.firstname);
                                    emailHTML = emailHTML.replace("{reject_reason}", rejectionResosn)
                                    mailOptions = {
                                        from: sender, // sender address
                                        to: user.email, // list of receivers
                                        subject: emailSubject, // Subject line
                                        html: emailHTML // html body
                                    };
                                } else {
                                    emailHTML = frontSideRejected.emailBody;
                                    emailSubject = frontSideRejected.subject;
                                    emailHTML = emailHTML.replace("{user_firstname}", user.firstname);
                                    emailHTML = emailHTML.replace("{reject_reason}", rejectionResosn)
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
                        res.status(200).json({ success: true, msg: `Customer Front side is ${rejectedDocument.doc_verification}!`, type: 'front side rejected' });
                    } else {
                        res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'Error in rejection of id proof!' });
                    }
                }
            });
        } else {
            res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'Error in rejection of id proof!' });
        }

    } catch (error) {
        res.status(200).json({ success: false, msg: 'Something went wrong', type: 'in main catch', error: error });
    }
};





/**
 * verify user id proof back
 */
let verifyCustomerBackProof = async (req, res, next) => {
    try {
        let { id, doc_verification_back } = req.body;
        let updatedData = {};
        updatedData['doc_verification_back'] = doc_verification_back
        let updatedKyc = await UserProfile.findOneAndUpdate({ userId: id }, updatedData);
        if (updatedKyc) {
            let user = await User.findById({ _id: id });
            if (user) {
                let mailOptions;
                await EmailTemplate.findOne({ mailType: 'back-side-verified' }).then((backVerified) => {
                    if (backVerified) {
                        let emailHTML;
                        let emailSubject;
                        if (user.language === 'fa') {
                            emailHTML = backVerified.emailBodyFarsi;
                            emailSubject = backVerified.subjectFarsi;
                            emailHTML = emailHTML.replace("{user_firstname}", user.firstname);
                            mailOptions = {
                                from: sender, // sender address
                                to: user.email, // list of receivers
                                subject: emailSubject, // Subject line
                                html: emailHTML // html body
                            };
                        } else {
                            emailHTML = backVerified.emailBody;
                            emailSubject = backVerified.subject;
                            emailHTML = emailHTML.replace("{user_firstname}", user.firstname);
                            mailOptions = {
                                from: sender, // sender address
                                to: user.email, // list of receivers
                                subject: emailSubject, // Subject line
                                html: emailHTML // html body
                            };
                        }
                        mailer(mailOptions);
                        res.status(200).json({ success: true, msg: `Customer back id proof is ${doc_verification_back}!`, type: 'id verified' });
                    }
                }).catch((error) => {
                    res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'email template catch', error: error });
                });
            } else {
                res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'Error in verify id proof!' });
            }
        } else {
            res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'Error in verify id proof!' });
        }
    } catch (error) {
        res.status(200).json({ success: false, msg: 'Something went wrong', type: 'in main catch', error: error });
    }
};


/***
 * reject customer id proof back side
 */
let rejectCustomerBackProof = async (req, res) => {
    try {
        let { userId, rejectionResosn, rejectedDocument } = req.body;
        let updatedData = {};
        updatedData['doc_verification_back'] = rejectedDocument.doc_verification_back;
        updatedData['doc_verification_back_rejection_reason'] = rejectionResosn;
        if (rejectedDocument.doc_verification_back === 'rejected') {
            updatedData['id_proof_back'] = '';
        }
        let updatedKyc = await UserProfile.findOneAndUpdate({ userId: userId }, updatedData);
        if (updatedKyc) {
            fs.unlink(`./dist/public/images/userIDProof/${updatedKyc.id_proof_back}`, async (err) => {
                if (err) {
                    res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'No file' });
                } else {
                    let user = await User.findById({ _id: userId });
                    if (user) {
                        let mailOptions;
                        await EmailTemplate.findOne({ mailType: 'front-side-rejected' }).then((frontSideRejected) => {
                            if (frontSideRejected) {
                                let emailHTML;
                                let emailSubject;
                                if (user.language === 'fa') {
                                    emailHTML = frontSideRejected.emailBodyFarsi;
                                    emailSubject = 'پشتی اثبات شناسه شما رد شد!';
                                    emailHTML = emailHTML.replace("{user_firstname}", user.firstname);
                                    emailHTML = emailHTML.replace("{reject_reason}", rejectionResosn)
                                    mailOptions = {
                                        from: sender, // sender address
                                        to: user.email, // list of receivers
                                        subject: emailSubject, // Subject line
                                        html: emailHTML // html body
                                    };
                                } else {
                                    emailHTML = frontSideRejected.emailBody;
                                    emailSubject = 'Your Id proof backside rejected!';
                                    emailHTML = emailHTML.replace("{user_firstname}", user.firstname);
                                    emailHTML = emailHTML.replace("{reject_reason}", rejectionResosn)
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
                        res.status(200).json({ success: true, msg: `Customer Back side is ${rejectedDocument.doc_verification_back}!`, type: 'back side rejected' });
                    } else {
                        res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'Error in rejection of id proof!' });
                    }
                }
            });
        } else {
            res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'Error in rejection of id proof!' });
        }

    } catch (error) {
        res.status(200).json({ success: false, msg: 'Something went wrong', type: 'in main catch', error: error });
    }
};



/** 
 * verify customer selfie 
*/
let verifyCustomerSelfie = async (req, res, next) => {
    try {
        let { id, selfie_verification } = req.body;
        let updatedData = {};
        updatedData['selfie_verification'] = selfie_verification
        let updatedKyc = await UserProfile.findOneAndUpdate({ userId: id }, updatedData);
        if (updatedKyc) {
            let user = await User.findById({ _id: id });
            if (user) {
                let mailOptions;
                await EmailTemplate.findOne({ mailType: 'user-selfie-verified' }).then((backVerified) => {
                    if (backVerified) {
                        let emailHTML;
                        let emailSubject;
                        if (user.language === 'fa') {
                            emailHTML = backVerified.emailBodyFarsi;
                            emailSubject = backVerified.subjectFarsi;
                            emailHTML = emailHTML.replace("{user_firstname}", user.firstname);
                            mailOptions = {
                                from: sender, // sender address
                                to: user.email, // list of receivers
                                subject: emailSubject, // Subject line
                                html: emailHTML // html body
                            };
                        } else {
                            emailHTML = backVerified.emailBody;
                            emailSubject = backVerified.subject;
                            emailHTML = emailHTML.replace("{user_firstname}", user.firstname);
                            mailOptions = {
                                from: sender, // sender address
                                to: user.email, // list of receivers
                                subject: emailSubject, // Subject line
                                html: emailHTML // html body
                            };
                        }
                        mailer(mailOptions);
                        res.status(200).json({ success: true, msg: `Customer selfie is ${selfie_verification}!`, type: 'selfie verified' });
                    }
                }).catch((error) => {
                    res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'email template catch', error: error });
                });
            } else {
                res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'Error in verify selfie proof!' });
            }
        } else {
            res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'Error in verify selfie proof!' });
        }
    } catch (error) {
        res.status(200).json({ success: false, msg: 'Something went wrong', type: 'in main catch', error: error });
    }
};




/***
 * reject customer selfie
 */
let rejectCustomerSelfie = async (req, res) => {
    try {
        let { userId, rejectionResosn, rejectedDocument } = req.body;
        let updatedData = {};
        updatedData['selfie_verification'] = rejectedDocument.selfie_verification;
        updatedData['selfie_verification_rejection_reason'] = rejectionResosn;
        if (rejectedDocument.selfie_verification === 'rejected') {
            updatedData['selfie'] = '';
        }
        let updatedKyc = await UserProfile.findOneAndUpdate({ userId: userId }, updatedData);
        if (updatedKyc) {
            fs.unlink(`./dist/public/images/selfies/${updatedKyc.selfie}`, async (err) => {
                if (err) {
                    res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'No file' });
                } else {
                    let user = await User.findById({ _id: userId });
                    if (user) {
                        let mailOptions;
                        await EmailTemplate.findOne({ mailType: 'user-selfie-rejected' }).then((selfieRejected) => {
                            if (selfieRejected) {
                                let emailHTML;
                                let emailSubject;
                                if (user.language === 'fa') {
                                    emailHTML = selfieRejected.emailBodyFarsi;
                                    emailSubject = selfieRejected.subjectFarsi;
                                    emailHTML = emailHTML.replace("{user_firstname}", user.firstname);
                                    emailHTML = emailHTML.replace("{reject_reason}", rejectionResosn)
                                    mailOptions = {
                                        from: sender, // sender address
                                        to: user.email, // list of receivers
                                        subject: emailSubject, // Subject line
                                        html: emailHTML // html body
                                    };
                                } else {
                                    emailHTML = selfieRejected.emailBody;
                                    emailSubject = selfieRejected.subject;
                                    emailHTML = emailHTML.replace("{user_firstname}", user.firstname);
                                    emailHTML = emailHTML.replace("{reject_reason}", rejectionResosn)
                                    mailOptions = {
                                        from: sender, // sender address
                                        to: user.email, // list of receivers
                                        subject: emailSubject, // Subject line
                                        html: emailHTML // html body
                                    };
                                }
                                mailer(mailOptions);
                                res.status(200).json({ success: true, msg: `Customer selfie is ${rejectedDocument.selfie_verification}!`, type: 'selfie rejected' });
                            }
                        }).catch((error) => {
                            res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'email template catch', error: error });
                        });
                    } else {
                        res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'Error in rejection of slefief!' });
                    }
                }
            });
        } else {
            res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'Error in rejection of selfie!' });
        }
    } catch (error) {
        res.status(200).json({ success: false, msg: 'Something went wrong', type: 'in main catch', error: error });
    }
};



/***
 * verify user address proof
 */
let verifyAddressProof = async (req, res) => {
    try {
        let { id, address_verification } = req.body;
        let updatedData = {};
        updatedData['address_verification'] = address_verification
        let updatedKyc = await UserProfile.findOneAndUpdate({ userId: id }, updatedData);
        if (updatedKyc) {
            let user = await User.findById({ _id: id });
            if (user) {
                let mailOptions;
                await EmailTemplate.findOne({ mailType: 'address-proof-verified' }).then((userVerified) => {
                    if (userVerified) {
                        let emailHTML;
                        let emailSubject;
                        if (user.language === 'fa') {
                            emailHTML = userVerified.emailBodyFarsi;
                            emailSubject = userVerified.subjectFarsi;
                            emailHTML = emailHTML.replace("{user_firstname}", user.firstname);
                            mailOptions = {
                                from: sender, // sender address
                                to: user.email, // list of receivers
                                subject: emailSubject, // Subject line
                                html: emailHTML // html body
                            };
                        } else {
                            emailHTML = userVerified.emailBody;
                            emailSubject = userVerified.subject;
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
                res.status(200).json({ success: true, msg: `Customer address is ${address_verification}!`, type: 'address verified / rejected' });
            } else {
                res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'Error in verify address proof!' });
            }
        } else {
            res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'Error in verify address proof!' });
        }

    } catch (error) {
        res.status(200).json({ success: false, msg: 'Something went wrong', type: 'in main catch', error: error });
    }
};



/***
 * reject user address proof
 */
let rejectAddressProof = async (req, res) => {
    try {
        let { userId, rejectionResosn, rejectedDocument } = req.body;
        let updatedData = {};
        updatedData['address_verification'] = rejectedDocument.address_verification;
        updatedData['address_rejection_reason'] = rejectionResosn;
        if (rejectedDocument.address_verification === 'rejected') {
            updatedData['address'] = '';
            updatedData['city'] = '';
            updatedData['country'] = '';
            updatedData['district'] = '';
            updatedData['documents'] = ''
            updatedData['housename'] = '';
            updatedData['pincode'] = '';
        }
        let updatedKyc = await UserProfile.findOneAndUpdate({ userId: userId }, updatedData);
        if (updatedKyc) {
            fs.unlink(`./dist/public/images/userAddressProof/${updatedKyc.documents}`, async (err) => {
                if (err) {
                    res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'No file' });
                } else {
                    let user = await User.findById({ _id: userId });
                    if (user) {
                        let mailOptions;
                        await EmailTemplate.findOne({ mailType: 'address-proof-rejected' }).then((userVerified) => {
                            if (userVerified) {
                                let emailHTML;
                                let emailSubject;
                                if (user.language === 'fa') {
                                    emailHTML = userVerified.emailBodyFarsi;
                                    emailSubject = userVerified.subjectFarsi;
                                    emailHTML = emailHTML.replace("{user_firstname}", user.firstname);
                                    emailHTML = emailHTML.replace("{blocked_reason}", rejectionResosn)
                                    mailOptions = {
                                        from: sender, // sender address
                                        to: user.email, // list of receivers
                                        subject: emailSubject, // Subject line
                                        html: emailHTML // html body
                                    };
                                } else {
                                    emailHTML = userVerified.emailBody;
                                    emailSubject = userVerified.subject;
                                    emailHTML = emailHTML.replace("{user_firstname}", user.firstname);
                                    emailHTML = emailHTML.replace("{blocked_reason}", rejectionResosn)
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
                        res.status(200).json({ success: true, msg: `Customer address is ${rejectedDocument.address_verification}!`, type: 'address rejected' });
                    } else {
                        res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'Error in verify address proof!' });
                    }
                }
            });
        } else {
            res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'Error in verify address proof!' });
        }

    } catch (error) {
        res.status(200).json({ success: false, msg: 'Something went wrong', type: 'in main catch', error: error });
    }
};


/**
 * get all transaction of the user
 */
let userAllSendReceiveTnx = async (req, res, next) => {
    try {
        let filter = {};
        let { pageIndex, pageSize, userId } = req.query;
        let pgNo = Number(pageIndex);
        let recordPerPage = Number(pageSize);
        let pageSkip = Math.abs(recordPerPage * pgNo);
        if (req.query.search == '' || req.query.search == 'undefined') {
            filter = { userId: userId };
        } else {
            let search = req.query.search;
            filter = { userId: userId, $or: [{ receiverAddress: { $regex: search } }, { txId: { $regex: search } }, { currencyType: { $regex: search } }, { type: { $regex: search } }] };
        }
        let trx = await SendReceiveTrx.find(filter).skip(pageSkip).limit(recordPerPage).sort({ timestamp: -1 });
        let count = await SendReceiveTrx.find({ userId: userId }).countDocuments();
        res.status(200).json({ transactions: trx, count: count, status: true, current: pgNo, pages: Math.ceil(count / recordPerPage) })
    } catch (error) {
        // console.log(error)
        res.status(200).json({ success: false, msg: 'Something went wrong', type: 'in main catch', error: error });
    }
}


/**
 * get all bank account of the user
 */
let userBankAccount = async (req, res, next) => {
    try {
        let { userId } = req.params;
        let bankAccount = await BankAccount.find({ userId: userId });
        if (bankAccount) {
            res.status(200).json(bankAccount);
        } else {
            res.status(200).json({ success: false, msg: 'Something went wrong' })
        }
    } catch (error) {
        console.log(error);
    }
};



/**
 * approve/reject customer bank account
 */
let changeBankAccountStatus = async (req, res, next) => {
    try {
        let { status, _id, rejectionResosn } = req.body;
        let { userId } = req.params;
        await BankAccount.findOneAndUpdate({ _id: _id, userId: userId }, { status: status }, { new: true }).then(async (updatedBank) => {
            if (updatedBank) {
                await User.findById(userId).then(async (user) => {
                    if (user) {
                        if (updatedBank.status === 'verified') {
                            let mailOptions;
                            await EmailTemplate.findOne({ mailType: 'user-bank-account-verified' }).then((bankVerified) => {
                                if (bankVerified) {
                                    let emailHTML;
                                    let emailSubject;
                                    if (user.language === 'fa') {
                                        emailHTML = bankVerified.emailBodyFarsi;
                                        emailSubject = bankVerified.subjectFarsi;
                                        emailHTML = emailHTML.replace("{user_firstname}", user.firstname);
                                        mailOptions = {
                                            from: sender, // sender address
                                            to: user.email, // list of receivers
                                            subject: emailSubject, // Subject line
                                            html: emailHTML // html body
                                        };
                                    } else {
                                        emailHTML = bankVerified.emailBody;
                                        emailSubject = bankVerified.subject;
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
                            res.status(200).json({ success: true, msg: `Customer ${updatedBank.ac_holdername} is now ${updatedBank.status}` })
                        } else if (updatedBank.status === 'rejected') {
                            let mailOptions;
                            await EmailTemplate.findOne({ mailType: 'user-bank-rejected' }).then((bankRejected) => {
                                if (bankRejected) {
                                    let emailHTML;
                                    let emailSubject;
                                    if (user.language === 'fa') {
                                        emailHTML = bankRejected.emailBodyFarsi;
                                        emailSubject = bankRejected.subjectFarsi;
                                        emailHTML = emailHTML.replace("{user_firstname}", user.firstname);
                                        emailHTML = emailHTML.replace("{reject_reason}", rejectionResosn)
                                        mailOptions = {
                                            from: sender, // sender address
                                            to: user.email, // list of receivers
                                            subject: emailSubject, // Subject line
                                            html: emailHTML // html body
                                        };
                                    } else {
                                        emailHTML = bankRejected.emailBody;
                                        emailSubject = bankRejected.subject;
                                        emailHTML = emailHTML.replace("{user_firstname}", user.firstname);
                                        emailHTML = emailHTML.replace("{reject_reason}", rejectionResosn)
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
                            res.status(200).json({ success: true, msg: `Customer ${updatedBank.ac_holdername} is now ${updatedBank.status}` })
                        } else if (updatedBank.status === 'pending') {
                            res.status(200).json({ success: true, msg: `Customer ${updatedBank.ac_holdername} is now ${updatedBank.status}` })
                        } else {
                            res.status(200).json({ success: false, msg: 'Something went wrong' })
                        }
                    }
                }).catch((error) => {
                    res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'in find user catch', error: error });
                });
            }
        }).catch(error => {
            res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'in update catch', error: error });
        });
    } catch (error) {
        res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'in main catch', error: error });
    }
};










export {
    allUsersDetails,
    userCompleteProfile,
    userLoginLogsInfo,
    approveOrFreezUserProfile,
    disableCustomer,
    verifyCustomerFrontProof,
    verifyCustomerBackProof,
    verifyCustomerSelfie,
    verifyAddressProof,
    rejectAddressProof,
    rejectCustomerFrontProof,
    rejectCustomerBackProof,
    rejectCustomerSelfie,
    userAllSendReceiveTnx,
    userBankAccount,
    changeBankAccountStatus,
    userWallets,
    userTradeWallets
}