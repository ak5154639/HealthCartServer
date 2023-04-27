// const fs = require("fs");
const categoryModel = require("../models/categories");
const productModel = require("../models/products");
const orderModel = require("../models/orders");
const userModel = require("../models/users");
const customizeModel = require("../models/customize");
const streamifier = require('streamifier');


const cloudinary = require('cloudinary').v2;


// Configuration 
cloudinary.config({
  cloud_name: `${process.env.CLOUD_NAME}`,
  api_key: `${process.env.CLOUDINARY_KEY}`,
  api_secret: `${process.env.CLOUDINARY_SECRET}`
});


class Customize {
  async getImages(req, res) {
    try {
      let Images = await customizeModel.find({});
      if (Images) {
        return res.json({ Images });
      }
    } catch (err) {
      console.log(err);
    }
  }

  async saveUrl(url){
    let newCustomzie = new customizeModel({
      slideImage: url,
    });
    let save = await newCustomzie.save();
    if(save){
      return( res.json({success: "Image upload successfully"}));
    }
  }

  async uploadSlideImage(req, res) {
    // console.log(req.file.buffer);
    const fileStream = streamifier.createReadStream(req.file.buffer);


    const cloudinaryStream = cloudinary.uploader.upload_stream( (error, result) => {
      if (error) {
        console.error(error);
      } else {
        // console.log(result);
        let newCustomize = new customizeModel({
          slideImage: result.secure_url,
          public_id: result.public_id,
        });
        newCustomize.save((err,result)=>{
          if(err){
            console.log(err);
          }
          else{
            console.log(result);
            return res.json({success: "Image upload successfully"});
          }
        });
      }
    });
    
    fileStream.pipe(cloudinaryStream);
    
    
    // let image = req.file.filename;
    // if (!image) {
    //   return res.json({ error: "All field required" });
    // }
    // try {
    //   let newCustomzie = new customizeModel({
    //     slideImage: image,
    //   });
    //   let save = await newCustomzie.save();
    //   if (save) {
    //     return res.json({ success: "Image upload successfully" });
    //   }
    // } catch (err) {
    //   console.log(err);
    // }
  }

  async deleteSlideImage(req, res) {
    let { id } = req.body;
    if (!id) {
      return res.json({ error: "All field required" });
    } else {
      try {
        let deletedSlideImage = await customizeModel.findById(id);
        // console.log(`Object ID: ${deletedSlideImage}`);
        const filePath = `${deletedSlideImage.public_id}`;
        // console.log(`filePath: ${filePath}`);
        let deleteImage = await customizeModel.findByIdAndDelete(id);
        // console.log(`deleteImage : ${deleteImage}`);
        if (deleteImage) {
          // Delete Image from uploads -> customizes folder
          
          cloudinary.uploader.destroy(filePath,(error,result)=>{
            if (error) {
              console.log(error);
            }
            // console.log(result);
            return res.json({ success: "Image deleted successfully" });
          });
        }
      } catch (err) {
        console.log(err);
      }
    }
  }

  async getAllData(req, res) {
    try {
      let Categories = await categoryModel.find({}).count();
      let Products = await productModel.find({}).count();
      let Orders = await orderModel.find({}).count();
      let Users = await userModel.find({}).count();
      if (Categories && Products && Orders) {
        return res.json({ Categories, Products, Orders, Users });
      }
    } catch (err) {
      console.log(err);
    }
  }
}

const customizeController = new Customize();
module.exports = customizeController;
