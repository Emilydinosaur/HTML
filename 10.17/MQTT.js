const mqtt = require("mqtt");
const mariadb = require("mariadb"); // 使用MariaDB庫

const pool = mariadb.createPool({
  host: "localhost",
  user: "root",
  password: "1qaz2wsx",
  database: "testdb",
  connectionLimit: 5, // 根據需求調整連接池的大小
});

const client = mqtt.connect("mqtt:163.17.136.69");

async function connectAndStoreMessages() {
  client.on("connect", () => {
    console.log("已連接到MQTT代理");
    client.subscribe("Temperature&Humidity");
    client.subscribe("pH_Value");
    client.subscribe("Water Leval");
  });

  let temperature, humidity, pHValue, waterLevel; // 創建變數以存儲不同主題的數值

  client.on("message", async (topic, message) => {
    console.log(`在主題 ${topic} 收到訊息：${message}`);

    const values = message.toString().trim().split(" "); // 去除多餘的空格和換行符

    // 移除空字符串元素
    const filteredValues = values.filter((value) => value.trim() !== "");

    if (topic === "Temperature&Humidity" && filteredValues.length === 2) {
      temperature = parseFloat(filteredValues[0]); // 解析溫度
      humidity = parseFloat(filteredValues[1]); // 解析濕度
      console.log("溫度：", temperature, "濕度：", humidity);
    } else if (topic === "pH_Value" && filteredValues.length === 1) {
      pHValue = parseFloat(filteredValues[0]); // 解析pH值
      console.log("pH值：", pHValue);
    } else if (topic === "Water Leval" && filteredValues.length === 1) {
      waterLevel = parseFloat(filteredValues[0]); // 解析水位
      console.log("水位：", waterLevel);
    } else {
      console.log("未知的主題或無效的訊息格式");
    }

    if (
      temperature !== undefined &&
      humidity !== undefined &&
      pHValue !== undefined &&
      waterLevel !== undefined
    ) {
      // 如果所有數值都已解析，則將它們存入資料庫
      await storeData(temperature, humidity, pHValue, waterLevel);

      // 重置變數以等待下一組數值
      temperature = humidity = pHValue = waterLevel = undefined;
    }
  });

  async function storeData(temperature, humidity, pHValue, waterLevel) {
    const connection = await pool.getConnection();
    try {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS Sensor (
          id INT AUTO_INCREMENT PRIMARY KEY,
          Temperature FLOAT,
          Humidity FLOAT,
          pHValue FLOAT,
          WaterLevel FLOAT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await connection.query(
        "INSERT INTO Sensor (Temperature, Humidity, pHValue, WaterLevel) VALUES (?, ?, ?, ?)",
        [temperature, humidity, pHValue, waterLevel]
      );

      console.log("已將數據存入資料庫");
    } catch (error) {
      console.error("存儲資料至資料庫時出現錯誤：", error);
    } finally {
      connection.release();
    }
  }
}

connectAndStoreMessages();
