
import app from "./app.js";
import axios from "axios";

const BASE_URL = process.env.BASE_URL || `https://school-erp-backend-mjwc.onrender.com`;

// 🧩 Keep Alive Function
const keepServerAlive = () => {
  const HEALTH_URL = `${BASE_URL}/api/v1/health`;

  const ping = async () => {
    try {
      const res = await axios.get(HEALTH_URL);
      console.log(`[KeepAlive] ✅ Ping successful: ${res.data.message} at ${new Date().toISOString()}`);
    } catch (err) {
      console.error(`[KeepAlive] ❌ Ping failed: ${err.response?.status || err.message}`);
    }
  };

  // 🔹 Wait 10s before first ping (let server boot fully)
  setTimeout(() => {
    ping();
    setInterval(ping, 5 * 60 * 1000); // every 5 minutes
  }, 10 * 1000);
};

app.listen(process.env.PORT, () => {
    console.log( `Server listening on port ${process.env.PORT} `);
    keepServerAlive();
});
