import * as expressValidators from 'express-validator';
import * as check from 'express-validator/check';

let checkUserRegister = (req, res, next) => {
    req.checkBody('firstname').notEmpty().withMessage('First name is required!').isAlpha().withMessage('First name must have only alphabetical chars');
    req.checkBody('lastname').notEmpty().withMessage('Last name is required!').isAlpha().withMessage('Last name must have only alphabetical chars');;
    req.checkBody('email').notEmpty().withMessage('Email  is required!').isEmail().withMessage('Must be a valid email!');
    req.checkBody('password').notEmpty().withMessage('Password is required!').matches(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{6,}$/)
        .withMessage('Password is invalid!');
    // req.checkBody('confirmPassword').equals('password').withMessage(`Password doesn't match !`);
    req.checkBody('userLanguage').notEmpty().withMessage('Language is required');

    let errors = req.validationErrors();
    if (errors) {
        let messages = [];
        errors.forEach( (error) => {
            messages.push(error.msg);
        });
        return res.json(messages);
    }
    next();
}


let checkUserLogin = (req, res, next) => {
    req.checkBody('email').notEmpty().withMessage('Email  is required!');
    req.checkBody('password').notEmpty().withMessage('Password is required!');

    let errors = req.validationErrors();
    if (errors) {
        let messages = [];
        errors.forEach( (error) => {
            messages.push(error.msg);
        });
        return res.json(messages);
    }
    next();
}

let checkSMSCode2FALogin = (req, res, next) => {
    req.checkBody('smsCode').notEmpty().withMessage('Code is required!').isNumeric().withMessage('Only number is allow!');
    req.checkBody('email').notEmpty().withMessage('Email is required!').isEmail().withMessage('Email address is required');

    let errors = req.validationErrors();
    if (errors) {
        let messages = [];
        errors.forEach( (error) => {
            messages.push(error.msg);
        });
        return res.json(messages);
    }
    next();
};

let checkUserForgot = (req, res, next) => {
    req.checkBody('email').notEmpty().withMessage('Email  is required!');

    let errors = req.validationErrors();
    if (errors) {
        let messages = [];
        errors.forEach( (error) => {
            messages.push(error.msg);
        });
        return res.json(messages);
    }
    next();
}


let checkResetPassword = (req, res, next) => {
    req.checkBody('password').notEmpty().withMessage('Password is required!')
        .matches(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{6,}$/)
        .withMessage('Password is invalid!');
    let errors = req.validationErrors();
    if (errors) {
        let messages = [];
        errors.forEach( (error) => {
            messages.push(error.msg);
        });
        return res.json(messages);
    }
    next();
};


let checkSendCode = (req, res, next) => {
    req.checkBody('mobile').notEmpty().withMessage('Mobile is required!').isNumeric().withMessage('Mobile is invalid!');

    let errors = req.validationErrors();
    if (errors) {
        let messages = [];
        errors.forEach( (error) => {
            messages.push(error.msg);
        });
        return res.json(messages);
    }
    next();
};

let checkSMSCode = (req, res, next) => {
    req.checkBody('verifyOTP').notEmpty().withMessage('Code is required!').isNumeric().withMessage('Only number is allow!');

    let errors = req.validationErrors();
    if (errors) {
        let messages = [];
        errors.forEach( (error) => {
            messages.push(error.msg);
        });
        return res.json(messages);
    }
    next();
};

let checkPersonalDetails = (req, res, next) => {
    req.checkBody('gender').notEmpty().withMessage('Gender is required!').isAlpha().withMessage('gender is invalid!');
    req.checkBody('address').notEmpty().withMessage('Address is required!').matches(/^[^-\s][a-zA-Z0-9_\s-]+$/).withMessage('Address is invalid!');
    req.checkBody('houseNo').notEmpty().withMessage('House name/no is required!').matches(/^[^-\s][a-zA-Z0-9_\s-]+$/).withMessage('House name/no is invalid!');
    req.checkBody('district').notEmpty().withMessage('District is required!').isAlpha().withMessage('District is invalid!');
    req.checkBody('city').notEmpty().withMessage('City is required').isAlpha().withMessage('City is invalid!');
    req.checkBody('zipCode').notEmpty().withMessage('Zip code is required!').isNumeric().withMessage('Zip code is invalid!');
    req.checkBody('country').notEmpty().withMessage('Country is required!').isAlpha().withMessage('Country name is invaid!');

    let errors = req.validationErrors();
    if (errors) {
        let messages = [];
        errors.forEach( (error) => {
            messages.push(error.msg);
        });
        return res.json(messages);
    }
    next();
};


let checkIDProof = (req, res, next) => {
    req.checkBody('countryid').notEmpty().withMessage('Country is required!');
    req.checkBody('idnumber').notEmpty().withMessage('Id number is required!').isNumeric().withMessage('Id number is invalid');

    let errors = req.validationErrors();
    if (errors) {
        let messages = [];
        errors.forEach( (error) => {
            messages.push(error.msg);
        });
        return res.json(messages);
    }
    next();
};


let checkChangePassword = (req, res, next) => {
    req.checkBody('oldPassword').notEmpty().withMessage('Old password is required!');
    req.checkBody('newPassword').notEmpty().withMessage('New password is required!').matches(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{6,}$/)
        .withMessage('Password is invalid!');

    let errors = req.validationErrors();
    if (errors) {
        let messages = [];
        errors.forEach( (error) => {
            messages.push(error.msg);
        });
        return res.json(messages);
    }
    next();
};

let checkChangePasswordAuthy = (req, res, next) => {
    req.checkBody('oldPassword').notEmpty().withMessage('Old password is required!');
    req.checkBody('newPassword').notEmpty().withMessage('New Password is required!');
    req.checkBody('smsCode').notEmpty().withMessage('OTP is required!').isNumeric().withMessage('Only number is required!');

    let errors = req.validationErrors();
    if (errors) {
        let messages = [];
        errors.forEach( (error) => {
            messages.push(error.msg);
        });
        return res.json(messages);
    }
};

let checkCreateBankAccount = (req, res, next) => {
    req.checkBody('account_no').notEmpty().withMessage('Account number is required!');
    req.checkBody('swift_code').notEmpty().withMessage('Swift code is required!');
    req.checkBody('card_no').notEmpty().withMessage('Card number is required!');
    req.checkBody('ac_holdername').notEmpty().withMessage('Bank name is required!').isAlpha().withMessage('Bank name is invalid!');
    req.checkBody('ac_holder_firstname').notEmpty().withMessage('Account holder first name is required!').isAlpha().withMessage('Account holder first name is invalid');
    req.checkBody('ac_holder_lastname').notEmpty().withMessage('Account holder last name is required!').isAlpha().withMessage('Account holder last name is invalid');
    req.checkBody('ac_holder_moblile').notEmpty().withMessage('Mobile number is required!').isNumeric().withMessage('Mobile number is invalid');
    req.checkBody('ac_holder_email').notEmpty().withMessage('Email is required!').isEmail().withMessage('Email id is not valid');
    req.checkBody('currency').notEmpty().withMessage('Currency is required!');
    req.checkBody('branch_name').notEmpty().withMessage('Bank branch name is required!')

    let errors = req.validationErrors();
    if (errors) {
        let messages = [];
        errors.forEach( (error) => {
            messages.push(error.msg);
        });
        return res.json(messages);
    }
    next();
};


let checkUpdateAddressDetails = (req, res, next) => {
    req.checkBody('houseNo').notEmpty().withMessage('House name/no is required!').matches(/^[^-\s][a-zA-Z0-9_\s-]+$/).withMessage('House name/no is invalid!');
    req.checkBody('district').notEmpty().withMessage('District is required!').isAlpha().withMessage('District is invalid!');
    req.checkBody('city').notEmpty().withMessage('City is required').isAlpha().withMessage('City is invalid!');
    req.checkBody('zipCode').notEmpty().withMessage('Zip code is required!').isNumeric().withMessage('Zip code is invalid!');
    req.checkBody('country').notEmpty().withMessage('Country is required!').isAlpha().withMessage('Country name is invaid!');

    let errors = req.validationErrors();
    if (errors) {
        let messages = [];
        errors.forEach( (error) => {
            messages.push(error.msg);
        });
        return res.json(messages);
    }
    next();
};


export {
    checkUserRegister,
    checkUserLogin,
    checkSMSCode2FALogin,
    checkUserForgot,
    checkResetPassword,
    checkSendCode,
    checkSMSCode,
    checkPersonalDetails,
    checkIDProof,
    checkChangePassword,
    checkChangePasswordAuthy,
    checkCreateBankAccount,
    checkUpdateAddressDetails
}