const db = require("./database");
const { generateQRCode } = require("./qrGenerator");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const { sendEmail } = require("./emailService");
const cloudinary = require("cloudinary").v2;
require("dotenv").config(); // Đọc biến môi trường từ .env
console.log("Cloudinary Config:", {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
let editingEventId = null; // Biến lưu ID của sự kiện đang chỉnh sửa
let editingCustomerId = null; // Biến lưu ID của khách hàng đang chỉnh sửa
// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

db.initDb();

// Gán sự kiện khi DOM được tải
document.addEventListener("DOMContentLoaded", () => {
  const tabEvents = document.getElementById("tabEvents");
  const tabCustomers = document.getElementById("tabCustomers");
  const tabTickets = document.getElementById("tabTickets");
  const addEventButton = document.getElementById("addEventButton");
  const addCustomerButton = document.getElementById("addCustomerButton");
  const addTicketButton = document.getElementById("addTicketButton");

  if (tabEvents) tabEvents.addEventListener("click", () => showTab("events"));
  if (tabCustomers)
    tabCustomers.addEventListener("click", () => showTab("customers"));
  if (tabTickets)
    tabTickets.addEventListener("click", () => showTab("tickets"));
  if (addEventButton) addEventButton.addEventListener("click", addEvent);
  if (addCustomerButton)
    addCustomerButton.addEventListener("click", addCustomer);
  if (addTicketButton) addTicketButton.addEventListener("click", addTicket);

  // Đặt tab "Sự kiện" làm mặc định khi tải trang
  showTab("events");
});
// Chuyển đổi tab
function showTab(tabId) {
  // Ẩn tất cả các tab content
  document
    .querySelectorAll(".tab-content")
    .forEach((tab) => (tab.style.display = "none"));
  const tabContent = document.getElementById(tabId);
  if (tabContent) tabContent.style.display = "block";

  // Xóa class active khỏi tất cả các nút trong .tabs
  document
    .querySelectorAll(".tabs button")
    .forEach((btn) => btn.classList.remove("active"));

  // Thêm class active vào nút tương ứng
  const activeTabButton = document.getElementById(
    `tab${tabId.charAt(0).toUpperCase() + tabId.slice(1)}`
  );
  if (activeTabButton) {
    activeTabButton.classList.add("active");
  }

  // Tải dữ liệu cho tab tương ứng
  if (tabId === "events") loadEvents();
  if (tabId === "customers") loadCustomers();
  if (tabId === "tickets") loadTickets();
}

// --- Sự kiện ---
async function addEvent() {
  let eventName = document.getElementById("eventName")?.value;
  const messageDiv = document.getElementById("eventMessage");

  if (!messageDiv) {
    console.error('Không tìm thấy phần tử với id "eventMessage"');
    return;
  }

  // Hàm viết hoa chữ cái đầu tiên của mỗi từ
  const capitalizeEachWord = (string) => {
    if (!string) return string;
    return string
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Viết hoa chữ cái đầu tiên của mỗi từ trước khi xử lý
  eventName = eventName ? eventName.trim() : "";
  eventName = capitalizeEachWord(eventName);

  if (!eventName) {
    messageDiv.style.color = "red";
    messageDiv.textContent = "Vui lòng nhập tên sự kiện!";
    return;
  }

  // Nếu đang ở trạng thái chỉnh sửa, gọi updateEvent thay vì thêm mới
  if (editingEventId !== null) {
    await updateEvent(editingEventId);
    return;
  }

  try {
    const result = await db.executeQuery(
      "INSERT INTO events (event_name) VALUES (?)",
      [eventName]
    );
    if (result && result.affectedRows === 1) {
      messageDiv.style.color = "green";
      messageDiv.textContent = "Thêm sự kiện thành công!";
      document.getElementById("eventName").value = "";
      loadEvents();
    } else {
      messageDiv.style.color = "red";
      messageDiv.textContent = "Thêm sự kiện thất bại!";
    }
  } catch (error) {
    console.error("Lỗi khi thêm sự kiện:", error.message);
    messageDiv.style.color = "red";
    messageDiv.textContent = "Đã xảy ra lỗi: " + error.message;
  }
}
async function deleteEvent(eventId) {
  const messageDiv = document.getElementById("eventMessage");

  // Hiển thị popup xác nhận
  const confirmed = confirm("Bạn có chắc chắn muốn xóa sự kiện này không?");
  if (!confirmed) {
    return; // Nếu người dùng nhấn "Hủy", thoát hàm
  }

  try {
    const result = await db.executeQuery("DELETE FROM events WHERE id = ?", [
      eventId,
    ]);
    if (result && result.affectedRows === 1) {
      messageDiv.style.color = "green";
      messageDiv.textContent = "Xóa sự kiện thành công!";
      loadEvents();
      document.getElementById("eventName").value = "";
    } else {
      messageDiv.style.color = "red";
      messageDiv.textContent = "Xóa sự kiện thất bại!";
    }
  } catch (error) {
    console.error("Lỗi khi xóa sự kiện:", error.message);
    messageDiv.style.color = "red";
    messageDiv.textContent = "Đã xảy ra lỗi: " + error.message;
  }
}

async function updateEvent(eventId) {
  let eventName = document.getElementById("eventName")?.value;
  const messageDiv = document.getElementById("eventMessage");

  // Hàm viết hoa chữ cái đầu tiên của mỗi từ
  const capitalizeEachWord = (string) => {
    if (!string) return string;
    return string
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Viết hoa chữ cái đầu tiên của mỗi từ
  eventName = eventName ? eventName.trim() : "";
  eventName = capitalizeEachWord(eventName);

  if (!eventName) {
    messageDiv.style.color = "red";
    messageDiv.textContent = "Vui lòng nhập tên sự kiện!";
    return;
  }

  try {
    const result = await db.executeQuery(
      "UPDATE events SET event_name = ? WHERE id = ?",
      [eventName, eventId]
    );
    if (result && result.affectedRows === 1) {
      messageDiv.style.color = "green";
      messageDiv.textContent = "Cập nhật sự kiện thành công!";
      document.getElementById("eventName").value = "";
      loadEvents();

      // Reset trạng thái chỉnh sửa
      editingEventId = null;
      const addEventButton = document.getElementById("addEventButton");
      addEventButton.textContent = "Thêm";
      addEventButton.onclick = addEvent; // Gán lại sự kiện ban đầu
    } else {
      messageDiv.style.color = "red";
      messageDiv.textContent = "Cập nhật sự kiện thất bại!";
    }
  } catch (error) {
    console.error("Lỗi khi cập nhật sự kiện:", error.message);
    messageDiv.style.color = "red";
    messageDiv.textContent = "Đã xảy ra lỗi: " + error.message;
  }
}
async function loadEvents() {
  try {
    const events = await db.executeQuery("SELECT * FROM events");
    const eventList = document.getElementById("eventList");
    if (!eventList) {
      console.error('Không tìm thấy phần tử với id "eventList"');
      return;
    }
    if (events && events.length > 0) {
      eventList.innerHTML = events
        .map(
          (e) => `
                  <li>
                      <span>${e.event_name}</span>
                      <button onclick="deleteEvent(${e.id})">Xóa</button>
                      <button onclick="editEvent(${e.id}, '${e.event_name}')">Sửa</button>
                  </li>
              `
        )
        .join("");
    } else {
      eventList.innerHTML = "<li>Chưa có sự kiện nào.</li>";
    }
    updateEventSelect();
  } catch (error) {
    console.error("Lỗi khi tải danh sách sự kiện:", error.message);
  }
}
function editEvent(eventId, eventName) {
  // Điền tên sự kiện vào ô nhập liệu
  const eventNameInput = document.getElementById("eventName");
  eventNameInput.value = eventName;

  // Chuyển nút "Thêm" thành nút "Cập nhật"
  const addEventButton = document.getElementById("addEventButton");
  addEventButton.textContent = "Cập nhật";
  addEventButton.onclick = () => updateEvent(eventId); // Gán sự kiện mới cho nút

  // Lưu ID của sự kiện đang chỉnh sửa
  editingEventId = eventId;
}

// --- Khách hàng ---
async function addCustomer() {
  const customerName = document.getElementById("customerName")?.value;
  const age = document.getElementById("customerAge")?.value;
  const phoneNumber = document.getElementById("customerPhone")?.value;
  const email = document.getElementById("customerEmail")?.value;
  const username = document.getElementById("customerUsername")?.value;
  const password = document.getElementById("customerPassword")?.value;
  const messageDiv = document.getElementById("customerMessage");

  if (!messageDiv) {
    console.error('[ERROR] Không tìm thấy phần tử với id "customerMessage"');
    return;
  }

  if (
    !customerName ||
    !age ||
    !phoneNumber ||
    !email ||
    !username ||
    (!password && editingCustomerId === null) // Yêu cầu mật khẩu khi thêm mới, không yêu cầu khi cập nhật
  ) {
    messageDiv.style.color = "red";
    messageDiv.textContent = "Vui lòng nhập đầy đủ thông tin!";
    return;
  }

  // Nếu đang ở trạng thái chỉnh sửa, gọi updateCustomer thay vì thêm mới
  if (editingCustomerId !== null) {
    await updateCustomer(editingCustomerId);
    return;
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.executeQuery(
      "INSERT INTO customers (customer_name, age, phone_number, email, username, password) VALUES (?, ?, ?, ?, ?, ?)",
      [
        customerName,
        parseInt(age),
        phoneNumber,
        email,
        username,
        hashedPassword,
      ]
    );

    if (result && result.insertId) {
      const emailSubject = "Thông tin tài khoản của bạn";
      const emailText = `Chào ${customerName},\n\nTài khoản của bạn đã được tạo thành công!\nUsername: ${username}\nPassword: ${password}\n\nVui lòng đổi mật khẩu sau khi đăng nhập lần đầu.\n\nTrân trọng,\nHệ thống quản lý vé sự kiện`;
      const emailSent = await sendEmail(email, emailSubject, emailText);

      if (emailSent) {
        messageDiv.style.color = "green";
        messageDiv.textContent =
          "Thêm khách hàng thành công! Email thông báo đã được gửi.";
      } else {
        messageDiv.style.color = "orange";
        messageDiv.textContent =
          "Thêm khách hàng thành công, nhưng không thể gửi email thông báo!";
      }

      document.getElementById("customerName").value = "";
      document.getElementById("customerAge").value = "";
      document.getElementById("customerPhone").value = "";
      document.getElementById("customerEmail").value = "";
      document.getElementById("customerUsername").value = "";
      document.getElementById("customerPassword").value = "";
      loadCustomers();
    } else {
      messageDiv.style.color = "red";
      messageDiv.textContent = "Thêm khách hàng thất bại!";
    }
  } catch (error) {
    console.error("[ERROR] Lỗi khi thêm khách hàng:", error.message);
    messageDiv.style.color = "red";
    messageDiv.textContent = "Đã xảy ra lỗi: " + error.message;
  }
}
async function deleteCustomer(customerId) {
  const messageDiv = document.getElementById("customerMessage");

  // Hiển thị popup xác nhận
  const confirmed = confirm("Bạn có chắc chắn muốn xóa khách hàng này không?");
  if (!confirmed) {
    return; // Nếu người dùng nhấn "Hủy", thoát hàm
  }

  try {
    const result = await db.executeQuery("DELETE FROM customers WHERE id = ?", [
      customerId,
    ]);
    if (result && result.affectedRows === 1) {
      messageDiv.style.color = "green";
      messageDiv.textContent = "Xóa khách hàng thành công!";
      loadCustomers();
    } else {
      messageDiv.style.color = "red";
      messageDiv.textContent = "Xóa khách hàng thất bại!";
    }
  } catch (error) {
    console.error("Lỗi khi xóa khách hàng:", error.message);
    messageDiv.style.color = "red";
    messageDiv.textContent = "Đã xảy ra lỗi: " + error.message;
  }
}
async function updateCustomer(customerId) {
  const customerName = document.getElementById("customerName")?.value;
  const age = document.getElementById("customerAge")?.value;
  const phoneNumber = document.getElementById("customerPhone")?.value;
  const email = document.getElementById("customerEmail")?.value;
  const username = document.getElementById("customerUsername")?.value;
  const messageDiv = document.getElementById("customerMessage");

  if (!messageDiv) {
    console.error('[ERROR] Không tìm thấy phần tử với id "customerMessage"');
    return;
  }

  if (!customerName || !age || !phoneNumber || !email || !username) {
    messageDiv.style.color = "red";
    messageDiv.textContent = "Vui lòng nhập đầy đủ thông tin!";
    return;
  }

  try {
    const result = await db.executeQuery(
      "UPDATE customers SET customer_name = ?, age = ?, phone_number = ?, email = ?, username = ? WHERE id = ?",
      [customerName, parseInt(age), phoneNumber, email, username, customerId]
    );
    if (result && result.affectedRows === 1) {
      messageDiv.style.color = "green";
      messageDiv.textContent = "Cập nhật khách hàng thành công!";
      loadCustomers();

      // Reset trạng thái chỉnh sửa
      editingCustomerId = null;
      const addCustomerButton = document.getElementById("addCustomerButton");
      addCustomerButton.textContent = "Thêm";
      addCustomerButton.onclick = addCustomer; // Gán lại sự kiện ban đầu

      // Xóa các ô nhập liệu
      document.getElementById("customerName").value = "";
      document.getElementById("customerAge").value = "";
      document.getElementById("customerPhone").value = "";
      document.getElementById("customerEmail").value = "";
      document.getElementById("customerUsername").value = "";
      document.getElementById("customerPassword").value = "";
    } else {
      messageDiv.style.color = "red";
      messageDiv.textContent = "Cập nhật khách hàng thất bại!";
    }
  } catch (error) {
    console.error("Lỗi khi cập nhật khách hàng:", error.message);
    messageDiv.style.color = "red";
    messageDiv.textContent = "Đã xảy ra lỗi: " + error.message;
  }
}
async function loadCustomers() {
  try {
    const customers = await db.executeQuery("SELECT * FROM customers");
    const customerList = document.getElementById("customerList");
    if (!customerList) {
      console.error('Không tìm thấy phần tử với id "customerList"');
      return;
    }
    if (customers && customers.length > 0) {
      customerList.innerHTML = customers
        .map(
          (c) => `
                  <li>
                      <span>${c.customer_name} (ID: ${c.id}) - ${c.username}</span>
                      <button onclick="deleteCustomer(${c.id})">Xóa</button>
                      <button onclick="editCustomer(${c.id}, '${c.customer_name}', ${c.age}, '${c.phone_number}', '${c.email}', '${c.username}')">Sửa</button>
                  </li>
              `
        )
        .join("");
    } else {
      customerList.innerHTML = "<li>Chưa có khách hàng nào.</li>";
    }
    updateCustomerSelect();
  } catch (error) {
    console.error("Lỗi khi tải danh sách khách hàng:", error.message);
  }
}

function editCustomer(
  customerId,
  customerName,
  age,
  phoneNumber,
  email,
  username
) {
  // Điền thông tin khách hàng vào các ô nhập liệu
  document.getElementById("customerName").value = customerName;
  document.getElementById("customerAge").value = age || "";
  document.getElementById("customerPhone").value = phoneNumber || "";
  document.getElementById("customerEmail").value = email || "";
  document.getElementById("customerUsername").value = username || "";
  // Không điền mật khẩu vì không nên hiển thị mật khẩu đã mã hóa

  // Chuyển nút "Thêm" thành nút "Cập nhật"
  const addCustomerButton = document.getElementById("addCustomerButton");
  addCustomerButton.textContent = "Cập nhật";
  addCustomerButton.onclick = () => updateCustomer(customerId); // Gán sự kiện mới cho nút

  // Lưu ID của khách hàng đang chỉnh sửa
  editingCustomerId = customerId;
}
// --- Vé ---
let currentTicketId = null;
let oldQrPath = null; // Giờ là URL từ Cloudinary

async function addTicket() {
  const eventSelect = document.getElementById("eventSelect");
  const ticketType = document.getElementById("ticketType");
  const customerSelect = document.getElementById("customerSelect");
  const messageDiv = document.getElementById("ticketMessage");

  if (!eventSelect || !ticketType || !customerSelect || !messageDiv) {
    console.error("[ERROR] Không tìm thấy các phần tử DOM cần thiết");
    return;
  }

  const eventId = eventSelect.value;
  const ticketTypeValue = ticketType.value;
  const customerId = customerSelect.value;

  if (!eventId || !ticketTypeValue || !customerId) {
    messageDiv.style.color = "red";
    messageDiv.textContent = "Vui lòng nhập đầy đủ thông tin!";
    return;
  }

  try {
    const [event] = await db.executeQuery("SELECT event_name FROM events WHERE id = ?", [eventId]);
    const [customer] = await db.executeQuery("SELECT customer_name FROM customers WHERE id = ?", [customerId]);

    if (!event || !customer) {
      messageDiv.style.color = "red";
      messageDiv.textContent = "Sự kiện hoặc khách hàng không tồn tại!";
      return;
    }

    const ticketCode = uuidv4();
    const securityCode = Math.floor(100000 + Math.random() * 900000).toString(); // Mã bảo mật 6 chữ số
    const ticketData = {
      ticket_code: ticketCode,
      event_id: eventId,
      event_name: event.event_name,
      customer_id: customerId,
      customer_name: customer.customer_name,
      ticket_type: ticketTypeValue,
      status: "unused",
      security_code: securityCode,
    };

    const { qrUrl } = await generateQRCode(ticketData);
    console.log(`[DEBUG] QR được tạo: ${qrUrl}`);

    const result = await db.executeQuery(
      "INSERT INTO tickets (ticket_code, event_id, event_name, ticket_type, customer_id, customer_name, qr_code, status, security_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        ticketCode,
        eventId,
        event.event_name,
        ticketTypeValue,
        customerId,
        customer.customer_name,
        qrUrl,
        "unused",
        securityCode,
      ]
    );

    if (result.affectedRows !== 1) {
      throw new Error("Không thể thêm vé vào cơ sở dữ liệu");
    }

    messageDiv.style.color = "green";
    messageDiv.textContent = "Thêm vé và QR thành công! Mã bảo mật đã được nhúng trong QR code.";
    ticketType.value = "";
    await loadTickets();
  } catch (error) {
    console.error("[ERROR] Lỗi khi thêm vé:", error.message);
    messageDiv.style.color = "red";
    messageDiv.textContent = "Đã xảy ra lỗi: " + error.message;
  }
}


async function deleteTicket(ticketId) {
  const messageDiv = document.getElementById("ticketMessage");

  // Hiển thị popup xác nhận
  const confirmed = confirm("Bạn có chắc chắn muốn xóa vé này không?");
  if (!confirmed) {
    return; // Nếu người dùng nhấn "Hủy", thoát hàm
  }

  try {
    // Lấy URL QR cũ từ database
    const [ticket] = await db.executeQuery(
      "SELECT qr_code FROM tickets WHERE id = ?",
      [ticketId]
    );
    if (ticket && ticket.qr_code) {
      // Lấy public_id từ URL (bỏ phần domain và version)
      const urlParts = ticket.qr_code.split("/");
      const publicIdWithExt = urlParts[urlParts.length - 1]; // Lấy "ticket_xxx.png"
      const publicId = `tickets/${publicIdWithExt.split(".png")[0]}`; // Thêm folder "tickets"
      await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
      console.log(`Đã xóa file QR cũ trên Cloudinary: ${ticket.qr_code}`);
    }

    // Xóa bản ghi trong database
    const result = await db.executeQuery("DELETE FROM tickets WHERE id = ?", [
      ticketId,
    ]);
    if (result && result.affectedRows === 1) {
      messageDiv.style.color = "green";
      messageDiv.textContent = "Xóa vé thành công!";
      currentTicketId = null;
      oldQrPath = null;
      loadTickets();
    } else {
      messageDiv.style.color = "red";
      messageDiv.textContent = "Xóa vé thất bại!";
    }
  } catch (error) {
    console.error("[ERROR] Lỗi khi xóa vé:", error.message);
    messageDiv.style.color = "red";
    messageDiv.textContent = "Đã xảy ra lỗi: " + error.message;
  }
}

async function updateTicket(ticketId, updatedTicket) {
  const messageDiv = document.getElementById("ticketMessage");
  try {
    const event = (
      await db.executeQuery("SELECT event_name FROM events WHERE id = ?", [
        updatedTicket.eventId,
      ])
    )[0];
    const customer = (
      await db.executeQuery(
        "SELECT customer_name FROM customers WHERE id = ?",
        [updatedTicket.customerId]
      )
    )[0];
    const ticketData = {
      ticket_code: updatedTicket.ticketCode,
      event_id: updatedTicket.eventId,
      event_name: event.event_name,
      customer_id: updatedTicket.customerId,
      customer_name: customer.customer_name,
      ticket_type: updatedTicket.ticketType,
      status: "unused",
    };
    const { qrUrl } = await generateQRCode(ticketData, oldQrPath); // Tạo QR mới và xóa QR cũ

    const result = await db.executeQuery(
      "UPDATE tickets SET ticket_code = ?, event_id = ?, ticket_type = ?, customer_id = ?, customer_name = ?, qr_code = ?, status = ? WHERE id = ?",
      [
        updatedTicket.ticketCode,
        updatedTicket.eventId,
        updatedTicket.ticketType,
        updatedTicket.customerId,
        customer.customer_name,
        qrUrl,
        "unused",
        ticketId,
      ]
    );
    if (result && result.affectedRows === 1) {
      messageDiv.style.color = "green";
      messageDiv.textContent = "Cập nhật vé thành công!";
      oldQrPath = qrUrl; // Cập nhật URL mới
      loadTickets();
    } else {
      messageDiv.style.color = "red";
      messageDiv.textContent = "Cập nhật vé thất bại!";
    }
  } catch (error) {
    console.error("Lỗi khi cập nhật vé:", error.message);
    messageDiv.style.color = "red";
    messageDiv.textContent = "Đã xảy ra lỗi: " + error.message;
  }
}

async function loadTickets() {
  try {
    const tickets = await db.executeQuery("SELECT * FROM tickets");
    const ticketList = document.getElementById("ticketList");
    if (!ticketList) {
      console.error('[ERROR] Không tìm thấy phần tử với id "ticketList"');
      return;
    }

    if (tickets && tickets.length > 0) {
      ticketList.innerHTML = `
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <thead>
                        <tr style="background-color: #f2f2f2;">
                            <th style="padding: 10px; border: 1px solid #ddd;">Mã vé</th>
                            <th style="padding: 10px; border: 1px solid #ddd;">Tên sự kiện</th>
                            <th style="padding: 10px; border: 1px solid #ddd;">Khách hàng</th>
                            <th style="padding: 10px; border: 1px solid #ddd;">QR Code</th>
                            <th style="padding: 10px; border: 1px solid #ddd;">Trạng thái</th>
                            <th style="padding: 10px; border: 1px solid #ddd;">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tickets
                          .map(
                            (t) => `
                            <tr>
                                <td style="padding: 10px; border: 1px solid #ddd;">${
                                  t.ticket_code
                                }</td>
                                <td style="padding: 10px; border: 1px solid #ddd;">${
                                  t.event_name || "Chưa có tên"
                                }</td>
                                <td style="padding: 10px; border: 1px solid #ddd;">${
                                  t.customer_name || "N/A"
                                }</td>
                                <td style="padding: 10px; border: 1px solid #ddd;">
                                    <a href="${
                                      t.qr_code
                                    }" target="_blank">Xem QR</a>
                                </td>
                                <td style="padding: 10px; border: 1px solid #ddd;">${
                                  t.status
                                }</td>
                                <td style="padding: 10px; border: 1px solid #ddd;">
                                    <button onclick="deleteTicket(${
                                      t.id
                                    })" style="padding: 5px 10px; background-color: #ff4444; color: white; border: none; cursor: pointer;">Xóa</button>
                                </td>
                            </tr>
                        `
                          )
                          .join("")}
                    </tbody>
                </table>
            `;
    } else {
      ticketList.innerHTML =
        '<p style="text-align: center; color: #888;">Chưa có vé nào.</p>';
    }
  } catch (error) {
    console.error("[ERROR] Lỗi khi tải danh sách vé:", error.message);
  }
}

async function updateEventSelect() {
  try {
    const events = await db.executeQuery("SELECT * FROM events");
    const eventSelect = document.getElementById("eventSelect");
    if (!eventSelect) {
      console.error('Không tìm thấy phần tử với id "eventSelect"');
      return;
    }
    if (events && events.length > 0) {
      eventSelect.innerHTML = events
        .map((e) => `<option value="${e.id}">${e.event_name}</option>`)
        .join("");
    } else {
      eventSelect.innerHTML = '<option value="">Không có sự kiện</option>';
    }
  } catch (error) {
    console.error("Lỗi khi cập nhật danh sách sự kiện:", error.message);
  }
}

async function updateCustomerSelect() {
  try {
    const customers = await db.executeQuery("SELECT * FROM customers");
    const customerSelect = document.getElementById("customerSelect");
    if (!customerSelect) {
      console.error('Không tìm thấy phần tử với id "customerSelect"');
      return;
    }
    if (customers && customers.length > 0) {
      customerSelect.innerHTML = customers
        .map((c) => `<option value="${c.id}">${c.customer_name}</option>`)
        .join("");
    } else {
      customerSelect.innerHTML =
        '<option value="">Không có khách hàng</option>';
    }
  } catch (error) {
    console.error("Lỗi khi cập nhật danh sách khách hàng:", error.message);
  }
}

loadEvents();
