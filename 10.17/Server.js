const express = require("express");
const mariadb = require("mariadb");
const bodyParser = require("body-parser");
const app = express();

// ----------設定伺服器的埠號和 IP 位址----------
const port = 3000;
const ip = "127.0.0.1";

// ----------建立 MariaDB 資料庫連接池----------
const pool = mariadb.createPool({
  host: "localhost",
  user: "root",
  password: "1qaz2wsx",
  connectionLimit: 5,
  database: "testdb",
});

// ----------使用 bodyParser 套件來解析請求中的主體內容----------
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// ----------設定靜態檔案目錄----------
app.use(express.static("01"));

// ----------處理 GET 請求----------
app.get("/", (req, res) => {
  const lang = req.query.lang;
  let selector = "";

  if (lang === "zh") {
    selector = "-zh";
  }

  res.sendFile(`${__dirname}/01/login${selector}.html`);
});

// ----------GET 請求 魚缸區頁面----------
app.get("/fish_tank.html", (req, res) => {
  const lang = req.query.lang;
  let selector = "";

  if (lang === "zh") {
    selector = "-zh";
  }

  res.sendFile(`${__dirname}/01/fish_tank${selector}.html`);
});

// ----------GET 請求 水耕區頁面----------
app.get("/hydroponic_area.html", (req, res) => {
  const lang = req.query.lang;
  let selector = "";

  if (lang === "zh") {
    selector = "-zh";
  }

  res.sendFile(`${__dirname}/01/hydroponic_area${selector}.html`);
});

// ----------GET 請求 登入頁面----------
app.get("/Home.html", (req, res) => {
  const lang = req.query.lang;
  let selector = "";

  if (lang === "zh") {
    selector = "-zh";
  }

  res.sendFile(`${__dirname}/01/Home${selector}.html`);
});

// ----------GET 請求 登出頁面----------
app.get("/logout.html", (req, res) => {
  const lang = req.query.lang;
  let selector = "";

  if (lang === "zh") {
    selector = "-zh";
  }

  res.sendFile(`${__dirname}/01/logout${selector}.html`);
});

// ----------GET 請求 後台登入頁面----------
app.get("/Ulogin.html", (req, res) => {
  const lang = req.query.lang;
  let selector = "";

  if (lang === "zh") {
    selector = "-zh";
  }

  res.sendFile(`${__dirname}/01/Ulogin${selector}.html`);
});

// ----------GET 請求 後台登出頁面----------
app.get("/Ulogout.html", (req, res) => {
  const lang = req.query.lang;
  let selector = "";

  if (lang === "zh") {
    selector = "-zh";
  }

  res.sendFile(`${__dirname}/01/Ulogout${selector}.html`);
});

// ----------GET 請求 後台會員頁面----------
app.get("/user-list.html", (req, res) => {
  const lang = req.query.lang;
  let selector = "";

  if (lang === "zh") {
    selector = "-zh";
  }

  res.sendFile(`${__dirname}/01/user-list${selector}.html`);
});
// ----------GET 請求 後台搜尋功能----------
app.get("/search", async (req, res) => {
  const searchKeyword = req.query.q; // 從查詢參數 "q" 中獲取搜尋關鍵字

  let conn;
  try {
    conn = await pool.getConnection();

    const query =
      "SELECT * FROM signup WHERE name LIKE ? OR email LIKE ? OR gender LIKE ? OR account LIKE ?";
    const results = await conn.query(query, [
      `%${searchKeyword}%`,
      `%${searchKeyword}%`,
      `%${searchKeyword}%`,
      `%${searchKeyword}%`,
    ]);

    console.log("搜尋成功，結果：", results);
    res.json(results);
  } catch (err) {
    console.error("搜尋失敗：", err);
    res.status(500).json({ success: false, error: "搜尋失敗" });
  } finally {
    if (conn) {
      conn.release(); // 釋放連接回到連接池
    }
  }
});

// ----------GET 請求 前端後台會員串接----------
app.get("/api/members", async (req, res) => {
  const sql = "SELECT * FROM signup";

  let conn;
  try {
    // 從連接池中取得一個連接
    conn = await pool.getConnection();

    // 使用連接執行查詢
    const rows = await conn.query(sql);

    res.json(rows);
  } catch (err) {
    console.error("獲取會員列表失敗：", err);
    res.status(500).json({ error: "無法獲取會員列表" });
  } finally {
    if (conn) {
      // 釋放連接回連接池
      conn.release();
    }
  }
});

// ----------PUT 請求 前端會員修改串接----------
app.put("/api/members/:account", async (req, res) => {
  try {
    const { name, email,  gender, account, password } = req.body;

    const conn = await pool.getConnection();
    const result = await conn.query(
      "UPDATE signup SET name = ?, email = ?, gender = ?, account = ?, password = ? WHERE account = ?",
      [name, email, gender, account, password, account]
    );

    await conn.end();

    if (result.affectedRows === 0) {
      res.status(404).json({ message: "找不到會員" });
    } else {
      res.json({ message: "會員資料修改成功" });
    }
  } catch (error) {
    console.error("修改會員資料失敗：", error);
    res.status(500).json({ message: "修改會員資料失敗" });
  }
});

// ----------PUT 請求 前端會員刪除串接----------
app.post("/api/delete-member", async (req, res) => {
  const userIdToDelete = req.body.userId;

  let conn;
  try {
    conn = await pool.getConnection();

    const deleteQuery = "UPDATE signup SET is_active = ? WHERE account = ?";

    // 執行 SQL 更新陳述句
    const result = await conn.query(deleteQuery, [false, userIdToDelete]);

    // 檢查是否成功更新
    if (result.affectedRows === 1) {
      res.status(200).json({ success: true, message: "帳號已禁用" });
    } else {
      res.status(404).json({ success: false, message: "找不到要刪除的用戶" });
    }
  } catch (error) {
    console.error("刪除操作失敗：", error);
    res.status(500).json({ success: false, message: "刪除操作失敗" });
  } finally {
    if (conn) {
      conn.release(); // 釋放連接回到連接池
    }
  }
});

// ----------POST 請求 前端會員新增串接----------
app.post("/api/add-member", async (req, res) => {
  const { name, email, gender, account, password } = req.body;

  let conn;
  try {
    conn = await pool.getConnection();
    const insertQuery =
      "INSERT INTO signup (name, email, gender, account, password) VALUES (?, ?, ?, ?, ?)";
    await conn.query(insertQuery, [name, email, gender, account, password]);
    console.log("成功插入資料");
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("資料插入失敗：", err);
    res.status(500).json({ success: false, error: "資料插入失敗" });
  } finally {
    if (conn) {
      conn.release();
    }
  }
});

// ----------POST 請求 註冊表單提交----------
app.post("/submit", async (req, res) => {
  try {
    const formData = req.body;
    console.log(formData);
    const query =
      "INSERT INTO signup (name, email, gender, account, password) VALUES (?, ?, ?, ?, ?)";
    const params = [
      formData.user_name,
      formData.user_email,
      formData.gender,
      formData.Singup_account,
      formData.signup_password,
    ];
    const conn = await pool.getConnection();
    const result = await conn.query(query, params);
    conn.end();
    console.log(result); // 輸出插入結果
    res.redirect("login.html");
  } catch (err) {
    console.error(err);
    res.status(500).send("發生錯誤，無法提交資料到資料庫。");
  }
});

// ----------POST 請求 登入表單提交----------
app.post("/login", async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();

    const formData = req.body; // 獲取表單資料
    const query = "SELECT * FROM signup WHERE account = ?";
    const params = [formData.Login_account];

    const rows = await conn.query(query, params); // 查詢資料庫中是否存在該使用者

    if (rows.length === 1) {
      // 使用者存在
      const user = rows[0];
      if (user.password === formData.Login_password) {
        // 密碼正確，登入成功
        res.redirect("/Home.html");
      } else {
        // 密碼錯誤
        res.status(401).send("密碼錯誤，請重試！");
      }
    } else {
      // 使用者不存在
      res.status(401).send("使用者不存在，請註冊或重新輸入使用者名稱！");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("發生錯誤，無法登入。");
  } finally {
    if (conn) conn.end();
  }
});

// ----------POST 請求 後台登入表單提交----------
app.post("/ulogin", async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();

    const formData = req.body; // 獲取表單資料
    const query = "SELECT * FROM signup WHERE account = ?";
    const params = [formData.帳號];

    const rows = await conn.query(query, params); // 查詢資料庫中是否存在該使用者

    if (rows.length === 1) {
      // 使用者存在
      const user = rows[0];
      if (user.password === formData.密碼) {
        // 密碼正確，登入成功
        res.redirect("/user-list.html");
      } else {
        // 密碼錯誤
        res.status(401).send("密碼錯誤，請重試！");
      }
    } else {
      // 使用者不存在
      res.status(401).send("使用者不存在，請註冊或重新輸入使用者名稱！");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("發生錯誤，無法登入。");
  } finally {
    if (conn) conn.end();
  }
});

// ----------POST 請求 前端會員修改串接----------
app.post("/api/editMember", async (req, res) => {
  try {
    const { account, name, gender, email } = req.body;

    // 使用MariaDB連接池獲取連接
    const conn = await pool.getConnection();

    // 在資料庫中查找要修改的用戶
    const result = await conn.query("SELECT * FROM signup WHERE account = ?", [
      account,
    ]);

    if (result.length === 0) {
      conn.release();
      return res.status(404).json({ message: "用戶未找到" });
    }

    // 更新用戶資料
    await conn.query(
      "UPDATE signup SET name = ?, email = ?, gender = ? WHERE account = ?",
      [name, email, gender, account]
    );

    conn.release();
    res.json({ message: "用戶信息已修改" });
  } catch (error) {
    console.error("修改用戶信息失敗：", error);
    res.status(500).json({ message: "修改用戶信息失敗" });
  }
});

app.listen(port, ip, () => {
  console.log(`Server is running at http://${ip}:${port}`);
});
