const express = require("express");
const router = express.Router();
const userInfo = require("../middleWare/authMiddleware");
const { contactUs } = require("../controllers/contactController");

router.post("/report", userInfo, contactUs);

module.exports = router;
