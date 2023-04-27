const productModel = require("../models/products");
// const fs = require("fs");
// const path = require("path");
const streamifier = require('streamifier');


const cloudinary = require('cloudinary').v2;


// Configuration 
cloudinary.config({
  cloud_name: `${process.env.CLOUD_NAME}`,
  api_key: `${process.env.CLOUDINARY_KEY}`,
  api_secret: `${process.env.CLOUDINARY_SECRET}`
});


class Product {
  // Delete Image from uploads -> products folder
  // static deleteImages(images, mode) {
  //   var basePath =
  //     path.resolve(__dirname + "../../") + "/public/uploads/products/";
  //   console.log(basePath);
  //   for (var i = 0; i < images.length; i++) {
  //     let filePath = "";
  //     if (mode == "file") {
  //       filePath = basePath + `${images[i].filename}`;
  //     } else {
  //       filePath = basePath + `${images[i]}`;
  //     }
  //     console.log(filePath);
  //     if (fs.existsSync(filePath)) {
  //       console.log("Exists image");
  //     }
  //     fs.unlink(filePath, (err) => {
  //       if (err) {
  //         return err;
  //       }
  //     });
  //   }
  // }

  async getAllProduct(req, res) {
    try {
      let Products = await productModel
        .find({})
        .populate("pCategory", "_id cName")
        .sort({ _id: -1 });
      if (Products) {
        return res.json({ Products });
      }
    } catch (err) {
      console.log(err);
    }
  }

  async postAddProduct(req, res) {
    let { pName, pDescription, pPrice, pQuantity, pCategory, pOffer, pStatus } =
      req.body;
    let images = req.files;
    // console.log(images);
    // Validation
    if (
      !pName |
      !pDescription |
      !pPrice |
      !pQuantity |
      !pCategory |
      !pOffer |
      !pStatus
    ) {
      // Product.deleteImages(images, "file");
      return res.json({ error: "All filled must be required" });
    }
    // Validate Name and description
    else if (pName.length > 255 || pDescription.length > 3000) {
      // Product.deleteImages(images, "file");
      return res.json({
        error: "Name 255 & Description must not be 3000 charecter long",
      });
    }
    // Validate Images
    else if (images.length !== 2) {
      // Product.deleteImages(images, "file");
      return res.json({ error: "Must need to provide 2 images" });
    } else {
      try {
        const imgs = images.map((image)=>image.buffer);
        const promises = imgs.map((image)=>{
          return new Promise((resolve,reject)=>{
            
            cloudinary.uploader.upload_stream({
              resource_type: 'image',
              
            },(error,result)=>{
              if(error){
                reject(error);
              }else{
                resolve(result);
              }
            }).end(image);
          });
        });

        Promise.all(promises).then(async (results)=>{
          let allImages=[];
          let public_ids=[];
          // console.log(results);
          results.forEach((element)=>{
            allImages.push(element.secure_url);
            public_ids.push(element.public_id);

          });
          // for(element in results){
          // }
          // console.log(allImages);
          // console.log(public_ids);
          let newProduct = new productModel({
              pImages: allImages,
              pImages_public_ids: public_ids,
              pName: pName,
              pDescription: pDescription,
              pPrice: pPrice,
              pQuantity: pQuantity,
              pCategory: pCategory,
              pOffer: pOffer,
              pStatus: pStatus
            });
            let save = await newProduct.save();
            if (save) {
              return res.json({ success: "Product created successfully" });
            }

        }).catch((error)=>{
          console.log('Upload failed: ',error);
        });


        

      } catch (error) {
        console.log(error);
      }
    }
  }

  async postEditProduct(req, res) {
    let {
      pId,
      pName,
      pDescription,
      pPrice,
      pQuantity,
      pCategory,
      pOffer,
      pStatus,
      pImages,
      pImages_public_ids,
    } = req.body;
    let editImages = req.files;

    // Validate other fileds
    if (
      !pId |
      !pName |
      !pDescription |
      !pPrice |
      !pQuantity |
      !pCategory |
      !pOffer |
      !pStatus
    ) {
      return res.json({ error: "All filled must be required" });
    }
    // Validate Name and description
    else if (pName.length > 255 || pDescription.length > 3000) {
      return res.json({
        error: "Name 255 & Description must not be 3000 charecter long",
      });
    }
    // Validate Update Images
    else if (editImages && editImages.length == 1) {
      // Product.deleteImages(editImages, "file");
      return res.json({ error: "Must need to provide 2 images" });
    } else {
      let editData = {
        pName,
        pDescription,
        pPrice,
        pQuantity,
        pCategory,
        pOffer,
        pStatus,
        pImages,
        pImages_public_ids,
      };
      if (editImages.length == 2) {
        let allEditImages = [];
        for (const img of editImages) {
          allEditImages.push(img.filename);
        }
        editData = { ...editData, pImages: allEditImages };
        // console.log(pImages);
        // Product.deleteImages(pImages.split(","), "string");
      }
      try {
        let deletedProductImage = await productModel.findById(pId);   //getting the previosly uploaded photo from DB
        const filePath = deletedProductImage.pImages_public_ids;

        filePath.map((image)=>{
          cloudinary.uploader.destroy(image,(error,result)=>{
            if(error){
              console.log(error);
            }
            console.log(`Deleted Previous images ${result}`);
          })
        });

        const imgs = editImages.map((image)=>image.buffer);
        const promises = imgs.map((image)=>{
          return new Promise((resolve,reject)=>{
            
            cloudinary.uploader.upload_stream({
              resource_type: 'image',
              
            },(error,result)=>{
              if(error){
                reject(error);
              }else{
                console.log(result);
                resolve(result);
              }
            }).end(image);
          });
        });

        Promise.all(promises).then(async (results)=>{
          let allImages=[];
          let public_ids=[];
          // console.log(results);
          results.forEach((element)=>{
            allImages.push(element.secure_url);
            public_ids.push(element.public_id);

          });
          editData =  { ...editData, pImages: allImages, pImages_public_ids: public_ids };
          let editProduct = productModel.findByIdAndUpdate(pId, editData);
          editProduct.exec((err) => {
            if (err) console.log(err);
            return res.json({ success: "Product edit successfully" });
          });

        }).catch((error)=>{
          console.log('Upload failed: ',error);
        });

      } catch (err) {
        console.log(err);
      }

    }
  }

  async getDeleteProduct(req, res) {
    let { pId } = req.body;
    if (!pId) {
      return res.json({ error: "All filled must be required" });
    } else {
      try {
        let deleteProductObj = await productModel.findById(pId);
        let deleteProduct = await productModel.findByIdAndDelete(pId);
        if (deleteProduct) {
          // Delete Image from uploads -> products folder
          // Product.deleteImages(deleteProductObj.pImages, "string");
          deleteProduct.pImages_public_ids.map((element)=>{
            cloudinary.uploader.destroy(element,(error,result)=>{
              if(error){
                console.log(error);
              }
              
            });
          });
          return res.json({ success: "Product deleted successfully" });
        }
      } catch (err) {
        console.log(err);
      }
    }
  }

  async getSingleProduct(req, res) {
    let { pId } = req.body;
    if (!pId) {
      return res.json({ error: "All filled must be required" });
    } else {
      try {
        let singleProduct = await productModel
          .findById(pId)
          .populate("pCategory", "cName")
          .populate("pRatingsReviews.user", "name email userImage");
        if (singleProduct) {
          return res.json({ Product: singleProduct });
        }
      } catch (err) {
        console.log(err);
      }
    }
  }

  async getProductByCategory(req, res) {
    let { catId } = req.body;
    if (!catId) {
      return res.json({ error: "All filled must be required" });
    } else {
      try {
        let products = await productModel
          .find({ pCategory: catId })
          .populate("pCategory", "cName");
        if (products) {
          return res.json({ Products: products });
        }
      } catch (err) {
        return res.json({ error: "Search product wrong" });
      }
    }
  }

  async getProductByPrice(req, res) {
    let { price } = req.body;
    if (!price) {
      return res.json({ error: "All filled must be required" });
    } else {
      try {
        let products = await productModel
          .find({ pPrice: { $lt: price } })
          .populate("pCategory", "cName")
          .sort({ pPrice: -1 });
        if (products) {
          return res.json({ Products: products });
        }
      } catch (err) {
        return res.json({ error: "Filter product wrong" });
      }
    }
  }

  async getWishProduct(req, res) {
    let { productArray } = req.body;
    if (!productArray) {
      return res.json({ error: "All filled must be required" });
    } else {
      try {
        let wishProducts = await productModel.find({
          _id: { $in: productArray },
        });
        if (wishProducts) {
          return res.json({ Products: wishProducts });
        }
      } catch (err) {
        return res.json({ error: "Filter product wrong" });
      }
    }
  }

  async getCartProduct(req, res) {
    let { productArray } = req.body;
    if (!productArray) {
      return res.json({ error: "All filled must be required" });
    } else {
      try {
        let cartProducts = await productModel.find({
          _id: { $in: productArray },
        });
        if (cartProducts) {
          return res.json({ Products: cartProducts });
        }
      } catch (err) {
        return res.json({ error: "Cart product wrong" });
      }
    }
  }

  async postAddReview(req, res) {
    let { pId, uId, rating, review } = req.body;
    if (!pId || !rating || !review || !uId) {
      return res.json({ error: "All filled must be required" });
    } else {
      let checkReviewRatingExists = await productModel.findOne({ _id: pId });
      if (checkReviewRatingExists.pRatingsReviews.length > 0) {
        checkReviewRatingExists.pRatingsReviews.map((item) => {
          if (item.user === uId) {
            return res.json({ error: "Your already reviewd the product" });
          } else {
            try {
              let newRatingReview = productModel.findByIdAndUpdate(pId, {
                $push: {
                  pRatingsReviews: {
                    review: review,
                    user: uId,
                    rating: rating,
                  },
                },
              });
              newRatingReview.exec((err, result) => {
                if (err) {
                  console.log(err);
                }
                return res.json({ success: "Thanks for your review" });
              });
            } catch (err) {
              return res.json({ error: "Cart product wrong" });
            }
          }
        });
      } else {
        try {
          let newRatingReview = productModel.findByIdAndUpdate(pId, {
            $push: {
              pRatingsReviews: { review: review, user: uId, rating: rating },
            },
          });
          newRatingReview.exec((err, result) => {
            if (err) {
              console.log(err);
            }
            return res.json({ success: "Thanks for your review" });
          });
        } catch (err) {
          return res.json({ error: "Cart product wrong" });
        }
      }
    }
  }

  async deleteReview(req, res) {
    let { rId, pId } = req.body;
    if (!rId) {
      return res.json({ message: "All filled must be required" });
    } else {
      try {
        let reviewDelete = productModel.findByIdAndUpdate(pId, {
          $pull: { pRatingsReviews: { _id: rId } },
        });
        reviewDelete.exec((err, result) => {
          if (err) {
            console.log(err);
          }
          return res.json({ success: "Your review is deleted" });
        });
      } catch (err) {
        console.log(err);
      }
    }
  }
}

const productController = new Product();
module.exports = productController;
