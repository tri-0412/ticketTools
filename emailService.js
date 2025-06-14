const nodemailer = require('nodemailer');

// Cấu hình transporter để gửi email qua Gmail
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'nhanboyll@gmail.com', // Thay bằng email của bạn
        pass: 'qxmswyatydibzznx',     // Thay bằng App Password của Gmail
    },
});

// Hàm gửi email
async function sendEmail(to, subject, text) {
    try {
        const mailOptions = {
            from: 'nhanboyll@gmail.com', // Email người gửi
            to: to,                       // Email người nhận
            subject: subject,             // Tiêu đề email
            text: text,                   // Nội dung email dạng văn bản
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[DEBUG] Email sent: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error(`[ERROR] Lỗi khi gửi email: ${error.message}`);
        return false;
    }
}

module.exports = { sendEmail };