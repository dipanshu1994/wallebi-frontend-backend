import * as path from 'path';
import * as multer from 'multer';


let fileFilter = (req, file, callback) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/gif') {
        callback(null, true);
    } else {
        callback(null, false);
    }
}

// address verifiacation file uploader
let userAddressVerification = multer.diskStorage({
      destination:  (req, file, callback) => {
        callback(null, path.join(__dirname, '../../public/images/userAddressProof'));
      },
    // dest: '../services/public/images/userAddressProof',
    filename: (req, file, callback) => {
        callback(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
    }
});

let userAddressUpload = multer({
    limits: {
        fileSize: 1024 * 1024 * 5
    },
    storage: userAddressVerification,
    fileFilter: fileFilter
});




// email template file uploader
let emailTemplateImage = multer.diskStorage({
    destination:  (req, file, callback) => {
      callback(null, path.join(__dirname, '../../public/images/TemplateImage'));
    },
  // dest: '../services/public/images/userAddressProof',
  filename: (req, file, callback) => {
    //   console.log(file);
      callback(null, file.originalname);
  }
});

let emailTemplateImageUpload = multer({
  limits: {
      fileSize: 1024 * 1024 * 5
  },
  storage: emailTemplateImage,
  fileFilter: fileFilter
});




// id verifiacation file uploader
let docStorage = multer.diskStorage({
    destination:  (req, file, callback) => {
        callback(null, path.join(__dirname, '../../public/images/userIDProof'));
      },
    filename: (req, file, callback) => {
        callback(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
    }
});

let documentUpload = multer({
    limits: {
        fileSize: 1024 * 1024 * 5
    },
    storage: docStorage,
    fileFilter: fileFilter
});




// profile picture file uploader
let userProfileStorage = multer.diskStorage({
    destination:  (req, file, callback) => {
        callback(null, path.join(__dirname, '../public/images/profileImage'));
      },
    filename: function (req, file, callback) {
        callback(null, file.fieldname + "_" + req.user.id + ".jpg");
    }
});

let userProfilePictureUploader = multer({
    limits: {
        fileSize: 1024 * 1024 * 5
    },
    storage: userProfileStorage,
    fileFilter: fileFilter
});

// selfie upload file uploader
let selfieStorage = multer.diskStorage({
    destination:  (req, file, callback) => {
        callback(null, path.join(__dirname, '../../public/images/selfies'));
      },
    filename: function (req, file, callback) {
        callback(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
    }
});

let selfieUploader = multer({
    limits: {
        fileSize: 1024 * 1024 * 5
    },
    storage: selfieStorage,
    fileFilter: fileFilter
});


// bank account statement file uploader
let accountStmtStorage = multer.diskStorage({
    //console.log(file);
    destination:  (req, file, callback) => {
        callback(null, path.join(__dirname, '../../public/images/userBankCardImage'));
      },
    filename: function (req, file, callback) {
        callback(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
    }
});

let accountStmtUpload = multer({
    limits: {
        fileSize: 1024 * 1024 * 5
    },
    storage: accountStmtStorage,
    fileFilter: fileFilter
});




// currency create logo file uploader
let newCurrencyLogo = multer.diskStorage({
    destination:  (req, file, callback) => {
      callback(null, path.join(__dirname, '../../public/images/currencyLogo'));
    },
  // dest: '../services/public/images/userAddressProof',
  filename: (req, file, callback) => {
      callback(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
  }
});

let currencyLogo = multer({
  limits: {
      fileSize: 1024 * 1024 * 5
  },
  storage: newCurrencyLogo,
  fileFilter: fileFilter
});

export {
    userAddressUpload,
    userProfilePictureUploader,
    documentUpload,
    selfieUploader,
    accountStmtUpload,
    currencyLogo,
    emailTemplateImageUpload
}






