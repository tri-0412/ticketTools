const qrcode = require("qrcode");
const { v4: uuidv4 } = require("uuid");
const cloudinary = require("cloudinary").v2;
const fs = require("fs").promises;
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function generateQRCode(ticketData, oldQrUrl = null) {
  // Nhúng tất cả thông tin vé và security_code vào QR code
  const qrData = JSON.stringify({
    ticket_code: ticketData.ticket_code,
    event_id: ticketData.event_id,
    event_name: ticketData.event_name,
    customer_id: ticketData.customer_id,
    customer_name: ticketData.customer_name,
    ticket_type: ticketData.ticket_type,
    status: ticketData.status,
    security_code: ticketData.security_code,
  });
  const qrFilename = `ticket_${uuidv4()}.png`;
  const tempPath = `./temp_${qrFilename}`;

  try {
    // Tạo QR code và lưu tạm
    await qrcode.toFile(tempPath, qrData, {
      errorCorrectionLevel: "H",
      width: 300,
    });

    // Upload lên Cloudinary
    const result = await cloudinary.uploader.upload(tempPath, {
      public_id: qrFilename.split(".png")[0],
      resource_type: "image",
      folder: "tickets",
    });
    const qrUrl = result.secure_url;
    console.log(`Đã upload QR lên Cloudinary: ${qrUrl}`);

    // Xóa file QR cũ nếu có
    if (oldQrUrl && oldQrUrl.includes("cloudinary")) {
      const oldPublicId = oldQrUrl.split("/").pop().split(".png")[0];
      await cloudinary.uploader.destroy(`tickets/${oldPublicId}`);
      console.log(`Đã xóa file QR cũ: ${oldQrUrl}`);
    }

    return { qrUrl, ticketData };
  } catch (error) {
    console.error("Lỗi khi upload lên Cloudinary:", error.message);
    throw error;
  } finally {
    await fs.unlink(tempPath).catch(err => console.error("Lỗi xóa file tạm:", err.message));
  }
}

module.exports = { generateQRCode };