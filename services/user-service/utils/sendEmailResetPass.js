const nodemailer = require('nodemailer');
require('dotenv').config();
exports.sendNewPasswordEmail = async (to, newPassword) => {
    const userEmail = process.env.EMAIL_USER;
    const userPassword = process.env.EMAIL_PASS;
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: userEmail,
            pass: userPassword,
        },
    });
    const mailOptions = {
        from: userEmail,
        to: to,
        subject: 'Cấp lại mật khẩu thành công',
        text: `Chào bạn,

Chúng tôi đã nhận được yêu cầu cấp lại mật khẩu. Đây là mật khẩu mới của bạn: ${newPassword}

Vui lòng sử dụng mật khẩu này để đăng nhập.

Trân trọng,
Đội ngũ hỗ trợ.`,
    };
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ' + info.response);
    } catch (error) {
        console.error('Error sending email: ', error);
    }
}


