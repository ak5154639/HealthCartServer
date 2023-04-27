var Razorpay = require("razorpay");
require("dotenv").config();
const crypto = require("crypto");
var { validatePaymentVerification } = require('./../node_modules/razorpay/dist/utils/razorpay-utils');

const secret_key = `${process.env.RAZORPAY_KEY_SECRET}`;



var gateway = new Razorpay({
    key_id: `${process.env.RAZORPAY_KEY_ID}`,
    key_secret: `${process.env.RAZORPAY_KEY_SECRET}`
});

class razorpay {
    ganerateToken(req, res) {
        console.log("RAZORPAY");
        console.log(req.body);
        const receiptId = `receipt_${Math.floor(Math.random() * 1000000)}`;

        gateway.orders.create({
            amount: req.body.totalAmount * 100,
            currency: "INR",
            receipt: `${receiptId}`,
            payment_capture: 1
        }, function (err, order) {
            if (err) {
                // console.log(err);
                return res.json(err);
            }
            // console.log(order);
            return res.json(order);
        })
    }



    async paymentProcess(req, res) {
        console.log(req.body);
        let { amountTotal, paymentId, orderId, signature } = req.body;
        
        const data = crypto.createHmac('sha256', secret_key).update(orderId + "|" + paymentId).digest('hex');
        console.log(data);
        
        if (data === signature) {
            console.log('request is legit')
            
            return res.send({
                amountTotal: amountTotal,
                orderId: orderId,
                paymentId: paymentId,
                status: true,
            });
        } else {
            console.log("Payment Not Verified");
            res.status(400).send({
                amountTotal,
                orderId,
                status:false
            });
        }
        
        
        
        // let { amountTotal, paymentId, orderId, signature } = req.body;
        // console.log(`amt: ${amountTotal}, paymentId: ${paymentId}, OrderID: ${orderId},signature:${signature}`);
        // const payment = await gateway.payments.fetch(paymentId);
        // const generated_signature = crypto.createHmac('sha256', secret_key);
        // // console.log(`AMT: ${payment.json()}`);
        // if (payment.captured && payment.amount - payment.fee === amountTotal) {
        //     return res.send({
        //         amountTotal: payment.amount,
        //         orderId: orderId,
        //         paymentId: paymentId,
        //         status: true,
        //     });
        // } else {
        //     return res.send({
        //         amountTotal,
        //         orderId,
        //         status: false
        //     });
        // }

        // gateway.payments.capture(
        //     {
        //         amount: amountTotal,
        //         paymentMethodNonce: paymentMethod,
        //         options: {
        //             submitForSettlement: true,
        //         },
        //     },
        //     (err, result) => {
        //         if (err) {
        //             console.error(err);
        //             return res.json(err);
        //         }

        //         if (result.success) {
        //             console.log("Transaction ID: " + result.transaction.id);
        //             return res.json(result);
        //         } else {
        //             console.error(result.message);
        //         }
        //     }
        // );
    }

    async refundProcess(paymentId) {

        try {
            console.log(paymentId);
            const refund = await gateway.payments.refund(paymentId);
            console.log("HERE2");
            return {refundId:refund.id};
        } catch (error) {
            console.log(error);
            return error;
        }

    }
}

const razorpayController = new razorpay();
module.exports = razorpayController;
