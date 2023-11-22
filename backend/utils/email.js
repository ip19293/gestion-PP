const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  // 1) Create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST1,

    port: process.env.EMAIL_PORT1,
    auth: {
      user: process.env.EMAIL_USERNAME1,
      pass: process.env.EMAIL_PASSWORD1,
    },
    //Activate in gmail "less secure app" option
  });
  // 2) Define the email options
  const mailOptions = {
    from: "Salem Yahya <ip19293.etu@iscae.mr>",
    to: options.email,
    subject: options.subject,
    text: options.message,
    //html:options.email,
  };
  // 3) Actually send the email

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
