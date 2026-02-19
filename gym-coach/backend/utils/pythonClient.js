const fetch = require("node-fetch");
const FormData = require("form-data");
const fs = require("fs");

exports.sendToML = async (exercise, filePath) => {
  const form = new FormData();
  form.append("exercise", exercise);
  form.append("video", fs.createReadStream(filePath));

  const response = await fetch("http://127.0.0.1:8000/analyze", {
    method: "POST",
    body: form,
    headers: form.getHeaders(),
  });

  return await response.json();
};
