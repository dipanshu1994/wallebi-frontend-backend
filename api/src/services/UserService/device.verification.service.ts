import { User } from '../../db/models/users/users.model';
import * as useragent from 'express-useragent';
import { LoginLog } from '../../db/models/users/login.loges.model';
import * as dateFormat from 'dateformat';
import * as  device from 'express-device';
import * as macaddress from 'macaddress';
import { sender } from '../../config/config';
import { mailer } from './mail.service';
import { JwtSign } from './jwt.token.service';
import * as queryString from 'querystring';
import { EmailTemplate } from '../../db/models/emailTemplate/emailTemplate.model';


// ||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||| NEW DEVICE API||||||||||||||||||||||||||||||||||||||||||||||||
// On registration create login logs



let createSignuplogs = async (req, res, cb) => {
    User.findOne({ email: req.body.email }, (errFind, resFind) => {
        if (errFind) {
            res.status(200).json({ success: false, msg: errFind.message });
        } else if (resFind) {
            var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            var devicetype = req.device.type;
            var browser = req.useragent.browser;
            var os = req.useragent.os;
            var description = req.useragent.source;
            var idDetails = {};
            var date = Date.now();
            var cdate = dateFormat(date, "yyyy-mm-dd HH:MM:ss");
        }
        var logData = {
            userid: resFind._id,
            ip: ip,
            agent: browser,
            os: os,
            description: description,
            type: devicetype,
            idDetails: idDetails,
            timestamp: cdate,
            macaddress: ''
        }
        if (ip !== null && typeof ip !== 'undefined' && ip !== "") {
            macaddress.one((err, mac) => {
                logData.macaddress = mac;
                LoginLog.create(logData, (err, doc) => {
                    if (err) {
                        res.status(200).json({
                            msg: 'Something wrrong',
                            success: false
                        })
                    } else {
                        res.status(200).json({
                            msg: 'We have sent a email with verification link please verify your email for further process!',
                            success: true,
                            type: 'Login logs'
                        })
                    }
                });
            });
        }
    });
}


let verifyNewDevice = async (req, res, currentMac, cb) => {
    User.findOne({ email: req.body.email }, (errFind, resFind) => {
        if (errFind) {
            res.status(200).json({ success: false, msg: 'User not found!' });
        } else if (resFind) {
            var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            var devicetype = req.device.type;
            var browser = req.useragent.browser;
            var os = req.useragent.os;
            var description = req.useragent.source;
            var idDetails = {};
            var date = Date.now();
            var cdate = dateFormat(date, "yyyy-mm-dd HH:MM:ss");
        }
        var logData = {
            userid: resFind._id,
            ip: ip,
            agent: browser,
            os: os,
            description: description,
            type: devicetype,
            idDetails: idDetails,
            timestamp: cdate,
            macaddress: currentMac
        }
        LoginLog.create(logData, (err, doc) => {
            if (err) {
                res.status(200).json({
                    msg: 'Something wrrong',
                    success: false
                });
            } else {
                res.status(200).json({
                    msg: 'Your device is now verifyed. You can login now with this device!',
                    success: true,
                    type: 'device verifyed'
                });
            }
        });
    });
}


let checkDevice = async (req, res, user, mac, cb) => {
    let userID = user._id;
    let email = user.email;
    LoginLog.findOne({ userid: userID, macaddress: mac }, (err, data) => {
        if (err) {
            res.status(200).json({ success: false, msg: err, type: 'error in getting logs' });
        } else {
            macaddress.one(async (err, mac) => {
                if (err) {
                    res.status(200).json({ success: false, msg: err, type: 'error in getting mac' });
                } if (data === null || data === '' || data === undefined) {
                    let token = Buffer.from(mac).toString('base64');
                    let mailOptions;
                    await EmailTemplate.findOne({ mailType: 'verify-user-device' }).then((verifyDevice) => {
                        if (verifyDevice) {
                            let emailHTML;
                            let emailSubject;
                            let verifyButton = '<a style="background-color: #045ab6;border: none;color: white;padding: 15px 32px;text-align: center;text-decoration: none;display: inline-block;font-size: 16px;cursor: pointer;box-shadow: 0 0.2rem 0.2rem 0 rgba(0, 0, 0, 1.1) !important;" href="' + req.headers.origin + '/deviceVerification?token=' + token + '&email=' + email + '">Verify Device</a>'
                            let verifyLink = '<a  href="' + req.headers.origin + '/deviceVerification?token=' + token + '&email=' + email + '">' + req.headers.origin + '/deviceVerification?token=' + token + '&email=' + email + '</a>'
                            if (user.language === 'fa') {
                                emailHTML = verifyDevice.emailBodyFarsi;
                                emailSubject = verifyDevice.subjectFarsi;
                                emailHTML = emailHTML.replace("{verify_device}", verifyButton);
                                emailHTML = emailHTML.replace("{verify_link}", verifyLink);
                                mailOptions = {
                                    from: sender, // sender address
                                    to: user.email, // list of receivers
                                    subject: emailSubject, // Subject line
                                    html: emailHTML // html body
                                };
                            } else {
                                emailHTML = verifyDevice.emailBody;
                                emailSubject = verifyDevice.subject;
                                emailHTML = emailHTML.replace("{verify_device}", verifyButton);
                                emailHTML = emailHTML.replace("{verify_link}", verifyLink);
                                mailOptions = {
                                    from: sender, // sender address
                                    to: user.email, // list of receivers
                                    subject: emailSubject, // Subject line
                                    html: emailHTML // html body
                                };
                            }
                            mailer(mailOptions);
                            res.status(200).json({ success: true, msg: 'Your current device is not verifiyed. we have send a email to verify this device', type: 'logs creation' });
                        }
                    }).catch((error) => {
                        res.status(200).json({success: false, msg: 'Something went wrong!', type: 'template catch', error: error});
                    });   
                }
                 else if (mac == data.macaddress) {
                    cb(null, true);
                } else {
                    let token = Buffer.from(mac).toString('base64');
                    let mailOptions;
                    await EmailTemplate.findOne({ mailType: 'verify-user-device' }).then((verifyDevice) => {
                        if (verifyDevice) {
                            let emailHTML;
                            let emailSubject;
                            let verifyButton = '<a style="background-color: #045ab6;border: none;color: white;padding: 15px 32px;text-align: center;text-decoration: none;display: inline-block;font-size: 16px;cursor: pointer;box-shadow: 0 0.2rem 0.2rem 0 rgba(0, 0, 0, 1.1) !important;" href="' + req.headers.origin + '/deviceVerification?token=' + token + '&email=' + email + '">' + req.headers.origin + '/deviceVerification?token=' + token + '&email=' + email + '</a>'
                            let verifyLink = '<a  href="' + req.headers.origin + '/deviceVerification?token=' + token + '&email=' + email + '">' + req.headers.origin + '/deviceVerification?token=' + token + '&email=' + email + '</a>'
                            if (user.language === 'fa') {
                                emailHTML = verifyDevice.emailBodyFarsi;
                                emailSubject = verifyDevice.subjectFarsi;
                                emailHTML = emailHTML.replace("{verify_device}", verifyButton);
                                emailHTML = emailHTML.replace("{verify_link}", verifyLink);
                                mailOptions = {
                                    from: sender, // sender address
                                    to: user.email, // list of receivers
                                    subject: emailSubject, // Subject line
                                    html: emailHTML // html body
                                };
                            } else {
                                emailHTML = verifyDevice.emailBody;
                                emailSubject = verifyDevice.subject;
                                emailHTML = emailHTML.replace("{verify_device}", verifyButton);
                                emailHTML = emailHTML.replace("{verify_link}", verifyLink);
                                mailOptions = {
                                    from: sender, // sender address
                                    to: user.email, // list of receivers
                                    subject: emailSubject, // Subject line
                                    html: emailHTML // html body
                                };
                            }
                            mailer(mailOptions);
                            res.status(200).json({ success: true, msg: 'Your current device is not verifiyed. we have send a email to verify this device', type: 'logs creation' });
                        }
                    }).catch((error) => {
                        res.status(200).json({success: false, msg: 'Something went wrong!', type: 'template catch', error: error});
                    }); 
                }
            });
        }
    });
}




// let deviceVerificationLogs(req, res)


export { createSignuplogs, checkDevice, verifyNewDevice }