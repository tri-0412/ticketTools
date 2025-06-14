const mysql = require("mysql2/promise");

class Database {
  constructor() {
    this.pool = mysql.createPool({
      host: "tramway.proxy.rlwy.net",
      user: "root",
      password: "VZrZUppIojPgLvhJWEvckSfjvgVQrHjK",
      database: "railway",
      port: 14485,
    });
    console.log("Kết nối MySQL thành công!");
  }

  async executeQuery(query, params = []) {
    if (!this.pool) {
      console.error("Chưa kết nối được với MySQL!");
      return null;
    }
    try {
      const [rows, fields] = await this.pool.execute(query, params);
      // Nếu là INSERT, trả về cả affectedRows và insertId
      if (query.trim().toUpperCase().startsWith("INSERT")) {
        return { affectedRows: rows.affectedRows, insertId: rows.insertId };
      }
      // Nếu là UPDATE hoặc DELETE, trả về affectedRows
      if (
        query.trim().toUpperCase().startsWith("UPDATE") ||
        query.trim().toUpperCase().startsWith("DELETE")
      ) {
        return { affectedRows: rows.affectedRows };
      }
      // Nếu là SELECT, trả về dữ liệu
      return rows;
    } catch (error) {
      console.error(`Lỗi truy vấn: ${error.message}`);
      return null;
    }
  }

  async initDb() {
    const queries = [
      `CREATE TABLE IF NOT EXISTS events (
                id INT AUTO_INCREMENT PRIMARY KEY,
                event_name VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
      `CREATE TABLE IF NOT EXISTS customers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                customer_name VARCHAR(255) NOT NULL,
                age INT,
                phone_number VARCHAR(20),
                email VARCHAR(255),
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
      `CREATE TABLE IF NOT EXISTS tickets (
                id INT AUTO_INCREMENT PRIMARY KEY,
                ticket_code VARCHAR(50) UNIQUE NOT NULL,
                event_id INT,
                event_name VARCHAR(255),
                ticket_type VARCHAR(50),
                customer_id INT,
                customer_name VARCHAR(255),
                qr_code VARCHAR(255) UNIQUE,
                status ENUM('unused', 'used') DEFAULT 'unused',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (event_id) REFERENCES events(id),
                FOREIGN KEY (customer_id) REFERENCES customers(id)
            )`,
    ];
    for (const query of queries) {
      await this.executeQuery(query);
    }
    console.log("[DEBUG] Database initialized");
  }
}

module.exports = new Database();
