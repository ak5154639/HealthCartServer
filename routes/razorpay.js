const express = require("express");
const router = express.Router();
const razorpayController = require("../controller/razorpay");


router.post("/razorpay/get-token", razorpayController.ganerateToken);
router.post("/razorpay/payment", razorpayController.paymentProcess);

module.exports = router;
