import { User } from "../../db/models/users/users.model";
import { UserProfile } from '../../db/models/users/userProfile.model';
import * as path from 'path';
import * as  ba64 from 'ba64';
import { ioSocketss } from "../..";
import * as fs from 'fs';



/**
user reset Password controller 
* @param {File} image;
* @param {token} userID
*/

let uploadProfilePicture = async (req, res, next, ) => {
    try {
        let date = Date.now();
        ba64.writeImage(path.join(__dirname, `../../public/images/profileImage/profileImage_${req.user.id}_${date}`), req.body.base64, (err) => {
            if (err) {
                throw err;
            } else {
                User.findByIdAndUpdate(req.user.id, { profileImage: `profileImage_${req.user.id}_${date}.png` }, { new: true }, (err, result) => {
                    if (err) {
                        res.send(err);
                    } else {
                        res.status(200).json({ success: true, msg: "Profile Updated Successfully", type: "Profile Picture" });
                        ioSocketss.emit(`userProfile_${req.user.id}`, { base: req.body.base64 })
                    }
                });
            }
        });
    } catch (error) {
        console.log(error);
    }
}

/**
updating user persoanl details controller 
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

let updatePersonalDetails = async (req, res, next) => {
    try {
        let filename;
        if (req.file === undefined) {
            res.status(200).json({ success: false, msg: 'Please choose a file!', type: 'no file choosed' });
            return false;
        } else {
            filename = req.file.filename;
            let updateDetails = {
                address: req.body.street,
                housename: req.body.houseNo,
                district: req.body.district,
                city: req.body.city,
                pincode: req.body.zipCode,
                country: req.body.country,
                documents: filename,
                address_verification: 'pending',
                pending_address_verification: "pending"
            };
            let query = { userId: req.user.id };
            UserProfile.findOneAndUpdate(query, updateDetails, (err, result) => {
                if (err) {
                    res.status(200).json({ success: false, msg: err, type: 'personal details updation' });
                } else {
                    res.status(200).json({ success: true, msg: 'Your address updated successfully!', type: 'personal details updation' });
                }
            });
        }
    } catch (error) {
        res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'in main catch' });
    }
};

export {
    uploadProfilePicture,
    updatePersonalDetails
}