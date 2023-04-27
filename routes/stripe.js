const express = require("express");
const router = express.Router();
const stripeController = require("../controller/stripe");

router.post("/stripe/create-checkout-session",stripeController.createCheckoutSession);
