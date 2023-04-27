const orderModel = require("../models/orders");
const razorpay = require("../controller/razorpay");
const productModel = require("../models/products");
class Order {
  async getAllOrders(req, res) {
    try {
      let Orders = await orderModel
        .find({})
        .populate("allProduct.id", "pName pImages pPrice")
        .populate("user", "name email")
        .sort({ _id: -1 });
      if (Orders) {
        return res.json({ Orders });
      }
    } catch (err) {
      console.log(err);
    }
  }

  async getOrderByUser(req, res) {
    let { uId } = req.body;
    if (!uId) {
      return res.json({ message: "All filled must be required" });
    } else {
      try {
        let Order = await orderModel
          .find({ user: uId })
          .populate("allProduct.id", "pName pImages pPrice")
          .populate("user", "name email")
          .sort({ _id: -1 });
        if (Order) {
          return res.json({ Order });
        }
      } catch (err) {
        console.log(err);
      }
    }
  }



  async postCreateOrder(req, res) {
    let { allProduct, user, amount, transactionId, address, phone } = req.body;
    if (
      !allProduct ||
      !user ||
      !amount ||
      !transactionId ||
      !address ||
      !phone
    ) {
      return res.json({ message: "All filled must be required" });
    } else {
      try {
        let newOrder = new orderModel({
          allProduct,
          user,
          amount,
          transactionId,
          address,
          phone,
        });
        console.log(allProduct)
        let save = await newOrder.save();
        if (save) {
          for (const product of allProduct){
            console.log(`product: ${product} & id: ${product.id} and quantity ${product.quantitiy}`);
            let updateProductCount = await productModel.findByIdAndUpdate(product.id,{
              $inc: {pQuantity: -1*product.quantitiy}
            }, {new:true}).exec();
            console.log(`Updated value is ${updateProductCount}`);

          }
          // allProduct.map(async (product)=>{
          // })
          return res.json({ success: "Order created successfully" });
        }
      } catch (err) {
        return res.json({ message: "Something went Wrong" });
      }
    }
  }

  async postUpdateOrder(req, res) {
    let { oId, status } = req.body;
    if (!oId || !status) {
      return res.json({ message: "All filled must be required" });
    } else {
      if (status === "Cancelled") {
        let data = await orderModel.findById(oId);
        const refundRes = await razorpay.refundProcess(data.transactionId);
        console.log(refundRes);
        if (refundRes) {
          let currentOrder = orderModel.findByIdAndUpdate(oId, {
            status: "Cancelled",
            updatedAt: Date.now(),
            refundId: refundRes.refundId,
          });
          currentOrder.exec((err, result) => {
            if (err) console.log(err);
            return res.json({ success: "Order Cancelled" });
          });

        } else {
          return res.json({ message: "Error Refund transaction" });
        }
      } else {

        let currentOrder = orderModel.findByIdAndUpdate(oId, {
          status: status,
          updatedAt: Date.now(),
        });
        currentOrder.exec((err, result) => {
          if (err) console.log(err);
          return res.json({ success: "Order updated successfully" });
        });
      }
    }
  }

  async cancelOrder(req, res) {
    let { oId } = req.body;
    if (!oId) {
      return res.json({ message: "All dields must be required" });
    } else {
      let data = await orderModel.findById(oId);
      if (data.status != "Cancelled") {
        const refundRes = await razorpay.refundProcess(data.transactionId);
        console.log(refundRes);
        if (refundRes) {
          let currentOrder = orderModel.findByIdAndUpdate(oId, {
            status: "Cancelled",
            updatedAt: Date.now(),
            refundId: refundRes.refundId,
          }).exec();
          for (const product of data.allProduct){
            console.log(`product: ${product} & id: ${product.id} and quantity ${product.quantitiy}`);
            let updateProductCount = await productModel.findByIdAndUpdate(product.id,{
              $inc: {pQuantity: product.quantitiy}
            }, {new:true}).exec();
            console.log(`Updated value is ${updateProductCount}`);

          }
          // return res.json({success: "Order Cancelled"});
          try {
            let Order = await orderModel
              .find({ user: data.user })
              .populate("allProduct.id", "pName pImages pPrice")
              .populate("user", "name email")
              .sort({ _id: -1 });
            if (Order) {
              return res.json({ success: "Order Cancelled" ,Order });
            }
          } catch (err) {
            console.log(err);
          }
        } else {
          return res.json({ message: "Error Refund transaction" });
        }
      } else {
        return res.json({ message: "Error cancelling order" });
      }

    }
  }


  async postDeleteOrder(req, res) {
    let { oId } = req.body;
    if (!oId) {
      return res.json({ error: "All filled must be required" });
    } else {
      try {
        let deleteOrder = await orderModel.findByIdAndDelete(oId);
        if (deleteOrder) {
          return res.json({ success: "Order deleted successfully" });
        }
      } catch (error) {
        console.log(error);
      }
    }
  }
}

const ordersController = new Order();
module.exports = ordersController;
