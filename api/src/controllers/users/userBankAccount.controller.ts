import { BankAccount } from "../../db/models/users/userBankAccount.model";
import { User } from "../../db/models/users/users.model";
import { mailer } from "../../services/UserService/mail.service";
import { EmailTemplate } from "../../db/models/emailTemplate/emailTemplate.model";
import { sender } from "../../config/config";


/**
 * create bank account controller
 * @param {token} userID
 * @param {Number} account_no; 
 * @param {Number} swift_code; 
 * @param {Number} card_no;
 * @param {String} ac_holdername;
 * @param {String} ac_holder_firstname;
 * @param {String} ac_holder_lastname;
 * @param {Number} ac_holder_moblile;
 * @param {String} ac_holder_email;
 * @param {String} currency;
 * @param {String} branch_name;
 * @param {String} ac_statement;
 */
let createBanckAccount = async (req, res, next) => {
    try {
        if (req.file === undefined) {
            res.status(200).json({ success: false, msg: 'Please choose a image', type: 'create bank account' });
            return false;
        } else {
            let newAccount = BankAccount({
                userId: req.user.id,
                account_no: req.body.account_no,
                swift_code: req.body.swift_code,
                card_no: req.body.swift_code,
                ac_holdername: req.body.ac_holdername,
                ac_holder_firstname: req.body.ac_holder_firstname,
                ac_holder_lastname: req.body.ac_holder_lastname,
                ac_holder_moblile: req.body.ac_holder_moblile,
                ac_holder_email: req.body.ac_holder_email,
                currency: req.body.currency,
                branch_name: req.body.branch_name,
                ac_statement: req.file.filename,
                status: 'pending'
            });

            newAccount.save(async (err, result) => {
                if (err) {
                    res.status(200).json({ success: false, msg: err, type: 'create bank account' });
                } else {
                    await User.findById(req.user.id).then(async (users) => {
                        if (users) {
                            let mailOptions;
                            await EmailTemplate.findOne({ mailType: 'bank-account-created' }).then((passwordReseted) => {
                                if (passwordReseted) {
                                    let emailHTML;
                                    let emailSubject;
                                    if (users.language === 'fa') {
                                        emailHTML = passwordReseted.emailBodyFarsi;
                                        emailSubject = passwordReseted.subjectFarsi;
                                        emailHTML = emailHTML.replace("{user_firstname}", users.firstname);
                                        mailOptions = {
                                            from: sender, // sender address
                                            to: users.email, // list of receivers
                                            subject: emailSubject, // Subject line
                                            html: emailHTML // html body
                                        };
                                    } else {
                                        emailHTML = passwordReseted.emailBody;
                                        emailSubject = passwordReseted.subject;
                                        emailHTML = emailHTML.replace("{user_firstname}", users.firstname);
                                        mailOptions = {
                                            from: sender, // sender address
                                            to: users.email, // list of receivers
                                            subject: emailSubject, // Subject line
                                            html: emailHTML // html body
                                        };
                                    }
                                    mailer(mailOptions);
                                    res.status(200).json({ success: true, msg: 'Bank account created successfully', type: 'create bank account' });
                                }
                            }).catch((error) => {
                                res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'email template catch', error: error });
                            });
                        }
                    }).catch((error) => { });
                }
            });
        }
    } catch (error) {
        res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'main catch', error: error });
    }
};





let getBanKAccount = async (req, res, next) => {
    try {
        BankAccount.find({ userId: req.user.id }, (err, account) => {
            if (err || account === null) {
                res.status(200).json({ success: false, msg: err, type: 'bank account data' });
            } else {
                res.json(account);
            }
        });
    } catch (error) {
        console.log(error);
    }
};



export {
    createBanckAccount,
    getBanKAccount,
}