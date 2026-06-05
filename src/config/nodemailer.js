// import nodemailer from "nodemailer";

// export const sendEmail = async (to, otp) => {
//   const transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//       user: process.env.EMAIL_USER,
//       pass: process.env.EMAIL_PASS
//     }
//   });

//   await transporter.sendMail({
//     from: process.env.EMAIL_USER,
//     to,
//     subject: "Your OTP Code",
//     text: `Your OTP is ${otp}`
//   });
// };



import nodemailer from "nodemailer";

export const sendEmail = async (to, otp) => {
  try {
    console.log("=================================");
    console.log("Starting Email Process");
    console.log("EMAIL_USER:", process.env.EMAIL_USER);
    console.log(
      "EMAIL_PASS:",
      process.env.EMAIL_PASS ? "SET ✅" : "MISSING ❌"
    );
    console.log("=================================");

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });

    // Verify SMTP connection
    await transporter.verify();
    console.log("✅ SMTP Connection Successful");

    const info = await transporter.sendMail({
      from: `"Civic Perks" <${process.env.EMAIL_USER}>`,
      to,
      subject: "Your OTP Code",
      text: `Your OTP is ${otp}`,
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Civic Perks Login OTP</h2>
          <p>Your OTP is:</p>
          <h1>${otp}</h1>
          <p>This OTP is valid for 5 minutes.</p>
        </div>
      `,
    });

    console.log("✅ Email Sent Successfully");
    console.log("Message ID:", info.messageId);

    return true;
  } catch (error) {
    console.error("❌ Email Sending Failed");
    console.error(error);

    throw error;
  }
};