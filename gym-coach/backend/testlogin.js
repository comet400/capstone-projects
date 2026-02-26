// testLogin.js
const axios = require("axios");

async function testLogin() {
  try {
    const response = await axios.post("http://10.0.0.138:5825/api/auth/login", {
      name: "Robin",   
      password: "123456",
    });

    console.log("Success! Response data:");
    console.log(response.data);
  } catch (err) {
    if (err.response) {
      console.log("Backend responded with an error:");
      console.log("Status:", err.response.status);
      console.log("Data:", err.response.data);
    } else {
      console.log("Request failed:", err.message);
    }
  }
}

testLogin();