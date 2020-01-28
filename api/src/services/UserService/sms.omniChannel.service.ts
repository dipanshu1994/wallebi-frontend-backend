import * as OmnichannelApi from 'omnichannel_api';
let defaultClient = OmnichannelApi.ApiClient.instance;
let basicAuth = defaultClient.authentications['basicAuth'];
import { smsusername, smspassword } from '../../config/config';
basicAuth.username = smsusername;
basicAuth.password = smspassword;


const api = new OmnichannelApi.OmnimessageApi();

let sendSMS = async (req, res, randomcode) => {
    try {
        let sms = OmnichannelApi.SMS.constructFromObject({
            text: `Hi, ${req.user.firstname} ${req.user.lastname} Your verification code for mobile number verification is :${randomcode}`,
        });
        let omnimessage = OmnichannelApi.Omnimessage.constructFromObject({
            messages: [sms],
            to: `+${req.body.mobile}`
        });
        return new Promise(async (resolve, reject) => {
            api.sendOmnimessage(omnimessage, (error, result) => {
                if(error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            });
        });
    } catch (error) {
        console.log(error);
    }
}


let sendSMSisAuthy = async (randomeCode, mobile, user?, type?) => {
    try {
        let obj = {
            text: ''
        };
        if (type === 'ChangePassword') {
            obj.text =  `Hi, ${user.firstname} ${user.lastname} your OTP (One Time Password) for change password is ${randomeCode}`;
        }
        if (type === 'Login') {
            obj.text = `Hi, ${user.firstname} ${user.lastname} your OTP (One Time Password) for login is ${randomeCode}`;
        }
        let sms = OmnichannelApi.SMS.constructFromObject({
            text: obj.text,
        });
        let omnimessage = OmnichannelApi.Omnimessage.constructFromObject({
            messages: [sms],
            to: `+${mobile}`
        });
        return new Promise(async (resolve, reject) => {
            api.sendOmnimessage(omnimessage, (error, result) => {
                if(error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            });
        });
        console.log(omnimessage)
    } catch (error) {
        console.log(error);
    }
};

export {
    sendSMS,
    sendSMSisAuthy
}