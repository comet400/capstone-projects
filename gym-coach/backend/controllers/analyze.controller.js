const { sendToML } = require("../utils/pythonClient");

exports.analyzeVideo = async (req, res) => {
  try {
    const { exercise } = req.body;
    const filePath = req.file.path;

    const result = await sendToML(exercise, filePath);

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
