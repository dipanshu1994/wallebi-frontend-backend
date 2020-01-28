import { sender } from '../../config/config';
import { mailer } from '../../services/UserService/mail.service';
import { sendSMS } from "../../services/UserService/sms.omniChannel.service";
import { UserProfile } from "../../db/models/users/userProfile.model";
import { User } from "../../db/models/users/users.model";
import { EmailTemplate } from '../../db/models/emailTemplate/emailTemplate.model';



/**
 * geeting the kyc status 
 */
let KYCStatus = async (req, res, next) => {
    try {
        UserProfile.findOne({ userId: req.user.id }, (err, userProfile) => {
            if (err || userProfile === null) {
                res.status(200).json({ success: false, msg: 'Please complete your KYC!', type: 'kyc status' });
            } else {
                res.json(userProfile);
            }
        });
    } catch (error) {
        console.log(error);
    }
};




/**
user send OTP for verify mobile number controller 
* @param {Number} mobilenumber;
* @param {token} userID
*/
let sendVerificationCode = async (req, res, next) => {
    try {
        let updateMobile = `+${req.body.mobile}`;
        var min = Math.ceil(100000);
        var max = Math.floor(999999);
        var randomNumber = Math.floor(Math.random() * (max - min)) + min;
        await UserProfile.findOne({ mobile: req.body.mobile }, { mobile: 1 }).then(async (mobile) => {
            if (mobile) {
                res.status(200).json({ success: false, msg: `${req.body.mobile} is already register with an account!` });
            } else {
                await UserProfile.findOneAndUpdate({ userId: req.user.id }, { smscode: randomNumber }, { new: true, upsert: true }).then(async (result) => {
                    if (result) {
                        let profileData = { userProfileId: result._id }
                        let query = { _id: req.user.id };
                        await User.findOneAndUpdate(query, profileData).then(async (user) => {
                            await sendSMS(req, res, result.smscode).then(async (smsResponse) => {
                                if (smsResponse) {
                                    res.status(200).json({ success: true, msg: `${req.user.firstname} check your messages for Verification code`, type: "check Message" });
                                }
                            }).catch((error) => {
                                res.status(200).json({ success: false, msg: "Unable to send code", type: "mobile otp send", error: error });
                            });
                        }).catch((error) => {
                            res.status(200).json({ success: false, msg: "Unable to send code", type: "update userProfile id", error: error });
                        });
                    }
                }).catch((error) => {
                    res.status(200).json({ success: false, msg: "Unable to send code", type: "update OTP in user profile", error: error });
                });
            }
        }).catch((error) => {
            res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'in finding already mobile', error: error });
        });
    } catch (error) {
        res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'in main catch', error: error });
    }
}

/**
user verify OTP for verification of the mobile number controller 
* @param {Number} OTP;
* @param {token} userID
*/
let verifyMobile = async (req, res, next) => {
    try {
        let { numberToVerify, verifyOTP } = req.body;
        await UserProfile.findOne({ userId: req.user.id }).then(async (usersProfile) => {
            if (usersProfile) {
                if (usersProfile.smscode === verifyOTP) {
                    await UserProfile.findOneAndUpdate({ userId: req.user.id }, { mobile: numberToVerify, step: 1, numberVerify: true }, {new: true}).then(async (userProfile) => {
                        if (userProfile) {
                            await User.findById(req.user.id).then(async (user) => {
                                if (user) {
                                    let mailOptions;
                                    await EmailTemplate.findOne({ mailType: 'mobile-verified' }).then((passwordReseted) => {
                                        if (passwordReseted) {
                                            let emailHTML;
                                            let emailSubject;
                                            if (user.language === 'fa') {
                                                emailHTML = passwordReseted.emailBodyFarsi;
                                                emailSubject = passwordReseted.subjectFarsi;
                                                emailHTML = emailHTML.replace("{user_firstname}", user.firstname);
                                                emailHTML = emailHTML.replace("{mobile_number}", userProfile.mobile);
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
                                }
                            }).catch((error) => {
                                res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'unable to find user', error: error });
                            });
                            res.status(200).json({ success: true, msg: "Your phone number is now verified!", type: "phone verified" });
                        }
                    }).catch((error) => {});
                } else {
                    res.status(200).json({ success: false, msg: "Your OTP is invalid", type: "phone not verified" });
                }
            } else {
                res.status(200).json({ success: false, msg: "Your OTP is invalid", type: "phone not verified" });
            }
        }).catch((error) => {});
        
    } catch (error) {
        res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'main catch' });
    }
}

/**
saving user persoanl details controller 
* @param {token} userID
* @param {String} DOB;
* @param {String} middlename;
* @param {String} gender;
* @param {String} address;
* @param {String} houseNo;
* @param {String} district;
* @param {String} city;
* @param {Number} zipCode;
* @param {String} country;
* @param {file} addresproof
*/
let personalDetails = async (req, res, next) => {
    try {
        let filename = '';
        if (req.file === undefined) {
            res.status(200).json({ success: false, msg: 'Please choose a image', type: 'user details' });
            return false;
        }
        else {
            filename = req.file.filename;
            let usersDOB = req.body.dob;
            let date = new Date(usersDOB);
            let dobYear = date.getFullYear();
            let dobMonth = date.getMonth() + 1;
            let dobDates = date.getDate();
            let profile = {
                middlename: req.body.middlename,
                gender: req.body.gender,
                address: req.body.street,
                housename: req.body.houseNo,
                district: req.body.district,
                city: req.body.city,
                pincode: req.body.zipCode,
                country: req.body.country,
                documents: filename,
                dob: {
                    year: dobYear,
                    month: dobMonth,
                    date: dobDates
                },
                userId: req.user.id,
                step: 2
            };
            let todayDate = new Date();
            let year = todayDate.getFullYear();
            let age = year - dobYear;
            if (age > 16) {
                let userUpdatedProfile = await UserProfile.findOneAndUpdate({ userId: req.user.id }, profile);
                if (userUpdatedProfile) {
                    res.status(200).json({ success: true, msg: "Your details are successfully updated!", type: "userProfile.success" });
                } else {
                    res.status(200).json({ success: false, msg: 'Please try again!', type: 'user details' });
                }
            } else {
                res.status(200).json({ success: false, msg: "Only 16+ allowed", type: "userProfile.notAllowed" });
            }
        }
    } catch (error) {
        console.log(error);
    }
}



/**
update after user persoanl details rejection controller 
* @param {token} userID
* @param {String} DOB;
* @param {String} middlename;
* @param {String} gender;
* @param {String} address;
* @param {String} houseNo;
* @param {String} district;
* @param {String} city;
* @param {Number} zipCode;
* @param {String} country;
* @param {file} addresproof
*/
let personalDetailsUpdationAfterRejection = async (req, res, next) => {
    try {
        let filename = '';
        if (req.file === undefined) {
            res.status(200).json({ success: false, msg: 'Please choose a image', type: 'user details' });
            return false;
        }
        else {
            filename = req.file.filename;
            let usersDOB = req.body.dob;
            let date = new Date(usersDOB);
            let dobYear = date.getFullYear();
            let dobMonth = date.getMonth() + 1;
            let dobDates = date.getDate();
            let profile = {
                gender: req.body.gender,
                dob: {
                    year: dobYear,
                    month: dobMonth,
                    date: dobDates
                },
                address: req.body.street,
                housename: req.body.houseNo,
                district: req.body.district,
                city: req.body.city,
                pincode: req.body.zipCode,
                country: req.body.country,
                documents: filename,
                address_verification: 'pending',
                address_rejection_reason: undefined
            };
            let todayDate = new Date();
            let year = todayDate.getFullYear();
            let age = year - dobYear;
            if (age > 16) {
                let userUpdatedProfile = await UserProfile.findOneAndUpdate({ userId: req.user.id }, profile);
                if (userUpdatedProfile) {
                    res.status(200).json({ success: true, msg: "Your details are successfully updated!", type: "userProfile.success" });
                } else {
                    res.status(200).json({ success: false, msg: 'Please try again!', type: 'user details' });
                }
            } else {
                res.status(200).json({ success: false, msg: "Only 16+ allowed", type: "userProfile.notAllowed" });
            }
        }
    } catch (error) {
        console.log(error);
    }
}




/**
 * user id proof verification controller 
 * @param {token} userID
 * @param {String} countryid;
 * @param {Number} idnumber;
 * @param {File} id_proof_front;
 * @param {File} id_proof_back;
 * 
 * 
 */
let idProofVerification = async (req, res, next) => {
    try {
        let { countryid, idnumber } = req.body;
        UserProfile.findOne({ userId: req.user.id }, (err, userProfile) => {
            let idProofVerify;
            if (countryid === 'Iran (Islamic Republic of)') {
                idProofVerify = {
                    id_data: {
                        countryid: countryid,
                        idnumber: idnumber
                    },
                    step: 3
                };

            } else {
                let doc_verification_back = (userProfile.doc_verification_back == "rejected") ? "pending" : userProfile.doc_verification_back;
                let doc_verification = (userProfile.doc_verification == "rejected") ? "pending" : userProfile.doc_verification;
                let image1 = "";
                if (req.files.id_proof_front === undefined) {
                    res.status(200).json({ success: false, msg: 'Please choose front side of id proof', type: 'id proof verification' });
                    return false;
                } else {
                    image1 = req.files.id_proof_front[0].filename;
                }
                var image2 = "";
                if (req.files.id_proof_back === undefined) {
                    res.status(200).json({ success: false, msg: 'Please choose back side of id proof', type: 'id proof verification' });
                    return false;
                } else {
                    image2 = req.files.id_proof_back[0].filename;
                }
                idProofVerify = {
                    id_data: {
                        countryid: req.body.countryid,
                        idnumber: req.body.idnumber
                    },
                    id_proof_front: image1,
                    id_proof_back: image2,
                    doc_verification_back: doc_verification_back,
                    doc_verification: doc_verification,
                    step: 3
                };
            }
            let query = { userId: req.user.id };
            UserProfile.findOneAndUpdate(query, idProofVerify, { new: true }, function (err) {
                if (err) {
                    res.status(200).json({ success: false, msg: err, type: 'id proof verification' });
                }
                else {
                    res.status(200).json({ success: true, msg: "Your ID proof updated successfully!", type: "id proof verification" });
                }
            });
        });
    } catch (error) {
        console.log(error);
    }
}



/**
 * user id proof verification controller 
 * @param {token} userID
 * @param {String} countryid;
 * @param {Number} idnumber;
 * @param {File} id_proof_front;
 * @param {File} id_proof_back;
 * 
 * 
 */
let idProofVerificationAfterRejection = async (req, res, next) => {
    try {
        let { countryid, idnumber } = req.body;
        let userProfile = await UserProfile.findOne({ userId: req.user.id });
        if (userProfile) {
            let idProofVerify = {};
            if (countryid === 'Iran (Islamic Republic of)') {
                idProofVerify = {
                    id_data: {
                        countryid: countryid,
                        idnumber: idnumber
                    },
                    step: 3
                };
            } else {
                let doc_verification_back = (userProfile.doc_verification_back == "rejected") ? "pending" : userProfile.doc_verification_back;
                let doc_verification = (userProfile.doc_verification == "rejected") ? "pending" : userProfile.doc_verification;
                let image1 = "";
                if (req.files.id_proof_front === undefined) {
                    res.status(200).json({ success: false, msg: 'Please choose front side of id proof', type: 'id proof verification' });
                    return false;
                } else {
                    image1 = req.files.id_proof_front[0].filename;
                }
                var image2 = "";
                if (req.files.id_proof_back === undefined) {
                    res.status(200).json({ success: false, msg: 'Please choose back side of id proof', type: 'id proof verification' });
                    return false;
                } else {
                    image2 = req.files.id_proof_back[0].filename;
                }
                idProofVerify = {
                    id_data: {
                        countryid: req.body.countryid,
                        idnumber: req.body.idnumber
                    },
                    id_proof_front: image1,
                    id_proof_back: image2,
                    doc_verification_back: doc_verification_back,
                    doc_verification: doc_verification,
                    doc_verification_front_rejection_reason: '',
                    doc_verification_back_rejection_reason: ''
                };
            }
            let query = { userId: req.user.id };
            let profile = await UserProfile.findOneAndUpdate(query, idProofVerify, { new: true });
            if (profile) {
                res.status(200).json({ success: true, msg: "Your ID proof updated successfully!", type: "id proof verification" });
            } else {
                res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'No profile' });
            }
        } else {
            res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'No profile' });
        }

    } catch (error) {
        res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'main catch' });
    }
}



/**
 * @param {token} userID
 * @param {File} selfie;  
 */
let selfieUpload = async (req, res, next) => {
    try {
        let selfie = "";
        if (req.file === undefined) {
            res.status(200).json({ success: false, msg: 'Please choose a selfie image', type: 'selfie updation' });
            return false;
        } else {
            selfie = req.file.filename;
            let selfieArr = {
                selfie: selfie,
                step: 4,
                selfie_verification: "pending",
                denied_selfie: 0,
                kyc_status: 'pending'
            };
            var query = { userId: req.user.id };
            UserProfile.findOneAndUpdate(query, selfieArr, { new: true }, async (err, result) => {
                if (err) {
                    res.status(200).json({ success: false, msg: err, type: 'selfie updation' });
                } else {
                    await User.findById(req.user.id ).then((users) => {
                        if (users) {
                            EmailTemplate.findOne({ mailType: 'document-submitted' }, (err, template) => {
                                let mailOptions = {};
                                let emailHtml;
                                if (template) {
                                    if (users.language === 'fa') {
                                        emailHtml = template.emailBodyFarsi;
                                        emailHtml = emailHtml.replace("{user_firstname}", users.firstname);
                                        mailOptions = {
                                            from: sender, // sender address
                                            to: users.email, // list of receivers
                                            subject: template.subjectFarsi, // Subject line
                                            html: emailHtml // html body
                                        }
                                    } else {
                                        emailHtml = template.emailBody;
                                        emailHtml = emailHtml.replace("{user_firstname}", users.firstname);
                                        mailOptions = {
                                            from: sender, // sender address
                                            to: users.email, // list of receivers
                                            subject: template.subject, // Subject line
                                            html: emailHtml // html body
                                        }
                                    }
                                    mailer(mailOptions);
                                    res.status(200).json({ success: true, msg: "Your selfie uploaded successfully!", type: "selfie updation" });
                                }
                            });
                        }
                    }).catch((error) => {
                        res.status(200).json({succcess: false, msg: 'Something went wrong!', type: 'email template catch', error: error});
                    });
                }
            });
        }
    } catch (error) {
        console.log(error);
    }
};




/**
 * @param {token} userID
 * @param {File} selfie;  
 */
let selfieUploadAfterRejection = async (req, res, next) => {
    try {
        let selfie = "";
        if (req.file === undefined) {
            res.status(200).json({ success: false, msg: 'Please choose a selfie image', type: 'selfie updation' });
            return false;
        } else {
            selfie = req.file.filename;
            let selfieArr = {
                selfie: selfie,
                selfie_verification: "pending",
                denied_selfie: 0,
                kyc_status: 'pending',
                selfie_verification_rejection_reason: ''
            };
            var query = { userId: req.user.id };
            UserProfile.findOneAndUpdate(query, selfieArr, { new: true }, async (err, result) => {
                if (err) {
                    res.status(200).json({ success: false, msg: err, type: 'selfie updation' });
                } else {
                    await User.findById(req.user.id ).then((users) => {
                        if (users) {
                            EmailTemplate.findOne({ mailType: 'document-submitted' }, (err, template) => {
                                let mailOptions = {};
                                let emailHtml;
                                if (template) {
                                    if (users.language === 'fa') {
                                        emailHtml = template.emailBodyFarsi;
                                        emailHtml = emailHtml.replace("{user_firstname}", users.firstname);
                                        mailOptions = {
                                            from: sender, // sender address
                                            to: users.email, // list of receivers
                                            subject: template.subjectFarsi, // Subject line
                                            html: emailHtml // html body
                                        }
                                    } else {
                                        emailHtml = template.emailBody;
                                        emailHtml = emailHtml.replace("{user_firstname}", users.firstname);
                                        mailOptions = {
                                            from: sender, // sender address
                                            to: users.email, // list of receivers
                                            subject: template.subject, // Subject line
                                            html: emailHtml // html body
                                        }
                                    }
                                    mailer(mailOptions);
                                    res.status(200).json({ success: true, msg: "Your selfie uploaded successfully!", type: "selfie updation" });
                                }
                            });
                        }
                    }).catch((error) => {
                        res.status(200).json({succcess: false, msg: 'Something went wrong!', type: 'email template catch', error: error});
                    });
                }
            });
        }
    } catch (error) {
        res.status(200).json({succcess: false, msg: 'Something went wrong!', type: 'main catch', error: error});
    }
};



let createBankAccountWithKYC = async (req, res, next) => {
    try {
        let bankProof = '';
        let { accountHolderFirstname, accountHolderLastname, bankAccountName, branchName, accountNo, swiftCode, currency } = req.body;
        if (req.file === undefined) {
            res.status(200).json({ success: false, msg: 'Please choose a bank proof image', type: 'no selfie' });
            return false;
        } else {
            bankProof = req.file.filename;
            let bankDetails = {
                accountHolderFirstname: accountHolderFirstname,
                accountHolderLastname: accountHolderLastname,
                bankAccountName: bankAccountName,
                branchName: branchName,
                accountNo: accountNo,
                swiftCode: swiftCode,
                currency: currency,
                bankProof: bankProof,
                step: 4,
                bank_verification: "pending",
            };
            // console.log(bankDetails);
            // UserProfile.findOneAndUpdate({userId: req.user.id}, bankDetails, { new: true }, async (err, result) => {
            //     if (err) {
            //         res.status(200).json({ success: false, msg: err, type: 'selfie updation' });
            //     } else {
            //         await User.findById(req.user.id ).then((users) => {
            //             if (users) {
            //                 EmailTemplate.findOne({ mailType: 'document-submitted' }, (err, template) => {
            //                     let mailOptions = {};
            //                     let emailHtml;
            //                     if (template) {
            //                         if (users.language === 'fa') {
            //                             emailHtml = template.emailBodyFarsi;
            //                             emailHtml = emailHtml.replace("{user_firstname}", users.firstname);
            //                             mailOptions = {
            //                                 from: sender, // sender address
            //                                 to: users.email, // list of receivers
            //                                 subject: template.subjectFarsi, // Subject line
            //                                 html: emailHtml // html body
            //                             }
            //                         } else {
            //                             emailHtml = template.emailBody;
            //                             emailHtml = emailHtml.replace("{user_firstname}", users.firstname);
            //                             mailOptions = {
            //                                 from: sender, // sender address
            //                                 to: users.email, // list of receivers
            //                                 subject: template.subject, // Subject line
            //                                 html: emailHtml // html body
            //                             }
            //                         }
            //                         mailer(mailOptions);
            //                         res.status(200).json({ success: true, msg: "Your selfie uploaded successfully!", type: "selfie updation" });
            //                     }
            //                 });
            //             }
            //         }).catch((error) => {
            //             res.status(200).json({succcess: false, msg: 'Something went wrong!', type: 'email template catch', error: error});
            //         });
            //     }
            // });
        }
    } catch (error) {
        res.status(200).json({success: false, msg: 'Something went wrong!', type: 'in main catch', error: error});
    }
};



export {
    KYCStatus,
    sendVerificationCode,
    verifyMobile,
    personalDetails,
    personalDetailsUpdationAfterRejection,
    idProofVerification,
    selfieUpload,
    selfieUploadAfterRejection,
    idProofVerificationAfterRejection,
    createBankAccountWithKYC
}
