import { EmailTemplate } from "../../../db/models/emailTemplate/emailTemplate.model";


/*
* create email template
*/
let createNewEmailTemplate = async (req, res, next) => {
    try {
        let { mailType, subject, emailBody, subjectFarsi, emailBodyFarsi } = req.body;

        let newTemplate = new EmailTemplate({
            mailType: mailType,
            subject: subject,
            emailBody: emailBody,
            subjectFarsi: subjectFarsi, emailBodyFarsi
        });

        newTemplate.save((err, result) => {
            if (err) {
                res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'Error in new saving template' })
            } else if (result) {
                res.status(200).json({ success: true, msg: `Email template create for ${mailType} successffully!`, type: 'save template' })
            }
        });


    } catch (error) {
        console.log(error);
    }
};


/**
 * display all email template in table and searching in the table
 * @param req 
 * @param res 
 * @param next 
 */
let getAllEmailTemplate = async (req, res, next) => {
    try {
        let filter = {};
        let { pageIndex, pageSize, search } = req.query;
        let pgNo = Number(pageIndex);
        let recordPerPage = Number(pageSize);
        let pageSkip = Math.abs(recordPerPage * pgNo);
        if (req.query.search === '' || req.query.search === 'undefined') {
            filter = {};
        } else {
            filter = { $or: [{ mailType: { $regex: search } }, { subject: { $regex: search } }, { subjectFarsi: { $regex: search } }] };
        }
        let email = await EmailTemplate.find(filter).skip(pageSkip).limit(recordPerPage).sort({ createdDate: -1 });
        let count = await EmailTemplate.find(filter).countDocuments();
        res.status(200).json({ email: email, count: count, success: true, current: pgNo, pages: Math.ceil(count / recordPerPage) })
    } catch (error) {
        console.log(error);
    }
};


/**
 * get specfic email template details on the basis of id
 * @param req 
 * @param res 
 * @param next 
 */
let getUniqueEmailTemplate = async (req, res, next) => {
    try {
        let { templateId } = req.params;
        await EmailTemplate.findById(templateId).then((template) => {
            res.status(200).json(template);
        }).catch((error) => {
            console.log(error);
        });
    } catch (error) {
        console.log(error);
    }
};



/**
 * edit any specfic email template on the basis of email template id
 * @param req 
 * @param res 
 * @param next 
 */
let editEmailTemplate = async (req, res, next) => {
    try {
        let { templateId, mailType, emailBody, emailBodyFarsi, subject, subjectFarsi } = req.body;
        let updatedTemplate = {
            mailType: mailType,
            emailBody: emailBody,
            emailBodyFarsi: emailBodyFarsi,
            subject: subject,
            subjectFarsi: subjectFarsi
        }
        await EmailTemplate.findByIdAndUpdate(templateId, updatedTemplate, { new: true }).then((template) => {
            if (template) {
                res.status(200).json({success: true, msg: `${mailType} email template is updated!`, type: 'updated email tempalte'})
            } else {
                res.status(200).json({success: false, msg: 'Something went wrong!', type: 'error in updation'});
            }
        }).catch((error) => {
            console.log(error);
            res.status(200).json({success: false, msg: error, type: 'error in updation'});
        });
    } catch (error) {
        console.log(error);
    }
};


/**
 * delete email template
 * @param req
 * @param res 
 * @param next 
 */
let deleteEmailTemplate = async (req, res, next) => {
    try {
        let { templateId } = req.params;
        await EmailTemplate.findByIdAndRemove(templateId).then((result) => {
            if (result) {
                res.status(200).json({ success: true, msg: 'Template deleted succesfully!', type: 'template deleted' });
            }
        }).catch((error) => {
            console.log(error);
            res.status({ success: false, msg: error, type: 'Error in deleting!' });
        });
    } catch (error) {
        console.log(error);
    }
};




export {
    createNewEmailTemplate,
    getAllEmailTemplate,
    editEmailTemplate,
    getUniqueEmailTemplate,
    deleteEmailTemplate
}