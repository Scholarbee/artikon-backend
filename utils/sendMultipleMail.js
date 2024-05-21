const nodemailer = require("nodemailer");

// Create Email Transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: 587,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// send multiple
const sendMultipleMail = async (optionsList) => {
  // Option for sending email
  //   const options = {
  //     from: sent_from,
  //     to: send_to,
  //     replyTo: reply_to,
  //     subject: subject,
  //     html: message,
  //   };

  //   console.log(optionsList);
  optionsList.forEach((Option) => {
    // send email
    transporter.sendMail(Option, function (err, info) {
      if (err) {
        console.log(err);
      } else {
        console.log(info);
      }
    });
  });
};

module.exports = sendMultipleMail;
