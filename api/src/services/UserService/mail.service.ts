import * as  nodemailer from 'nodemailer';



let mailer = async (mailOptions) => {
    try {
        // console.log(mailOptions);
        let transporter = nodemailer.createTransport({
            service: 'Mandrill',
            port: 587,
            auth: {
                user: "Wallebi Asia",
                pass: "UsU3VsdQpLDrNFgNaF2XmA"
            },
            logger: false, // log to console
            debug: true // include SMTP traffic in the logs
        });

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
            } else {
                // console.log(info);
                console.log("message sent successfully");
            }
        });
    } catch (error) {
        console.log(error);
    }
}

export { mailer };