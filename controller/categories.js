const { toTitleCase } = require("../config/function");
const categoryModel = require("../models/categories");
// const fs = require("fs");
const streamifier = require('streamifier');


const cloudinary = require('cloudinary').v2;

// Configuration 
cloudinary.config({
  cloud_name: `${process.env.CLOUD_NAME}`,
  api_key: `${process.env.CLOUDINARY_KEY}`,
  api_secret: `${process.env.CLOUDINARY_SECRET}`
});

class Category {
  async getAllCategory(req, res) {
    try {
      let Categories = await categoryModel.find({}).sort({ _id: -1 });
      if (Categories) {
        return res.json({ Categories });
      }
    } catch (err) {
      console.log(err);
    }
  }

  async postAddCategory(req, res) {
    console.log(req.body);
    let { cName, cDescription, cStatus } = req.body;
    console.log(req.file.buffer);
    // let cImage = req.file.filename;
    const fileStream = streamifier.createReadStream(req.file.buffer);
    console.log(fileStream);
    // const filePath = `../server/public/uploads/categories/${cImage}`;

    if(!cName || !cDescription || !cStatus || !fileStream){
      return res.json({error: "All filled must be required"});
    }else{
      cName = toTitleCase(cName);
      try{
        let checkCategoryExists = await categoryModel.findOne({cName: cName});
        if(checkCategoryExists){
          return res.json({error: "Category already exists"});
        }else{
          const cloudinaryStream = cloudinary.uploader.upload_stream((error,result)=>{
            if(error){
              // console.error(error);
            }else{
              // console.log(result);
              let newCategory = new categoryModel({
                cName:cName,
                cDescription:cDescription,
                cStatus:cStatus,
                cImage: result.secure_url,
                cImage_public_id:result.public_id,
              });
              newCategory.save((err,result)=>{
                if(err){
                  console.log(err);
                }else{
                  console.log(result);
                  return res.json({success: "Category created successfully"});
                }
              });
            }
          });
          fileStream.pipe(cloudinaryStream);
        }
      }catch(err){
        console.log(err);
      }
    }


    // if (!cName || !cDescription || !cStatus || !fileStream) {
    //   fs.unlink(filePath, (err) => {
    //     if (err) {
    //       console.log(err);
    //     }
    //     return res.json({ error: "All filled must be required" });
    //   });
    // } else {
    //   cName = toTitleCase(cName);
    //   try {
    //     let checkCategoryExists = await categoryModel.findOne({ cName: cName });
    //     if (checkCategoryExists) {
    //       fs.unlink(filePath, (err) => {
    //         if (err) {
    //           console.log(err);
    //         }
    //         return res.json({ error: "Category already exists" });
    //       });
    //     } else {
    //       let newCategory = new categoryModel({
    //         cName,
    //         cDescription,
    //         cStatus,
    //         cImage,
    //       });
    //       await newCategory.save((err) => {
    //         if (!err) {
    //           return res.json({ success: "Category created successfully" });
    //         }
    //       });
    //     }
    //   } catch (err) {
    //     console.log(err);
    //   }
    // }
  }

  async postEditCategory(req, res) {
    let { cId, cDescription, cStatus } = req.body;
    if (!cId || !cDescription || !cStatus) {
      return res.json({ error: "All filled must be required" });
    }
    try {
      let editCategory = categoryModel.findByIdAndUpdate(cId, {
        cDescription,
        cStatus,
        updatedAt: Date.now(),
      });
      let edit = await editCategory.exec();
      if (edit) {
        return res.json({ success: "Category edit successfully" });
      }
    } catch (err) {
      console.log(err);
    }
  }

  async getDeleteCategory(req, res) {
    let { cId } = req.body;
    if (!cId) {
      return res.json({ error: "All filled must be required" });
    } else {
      try {
        let deletedCategoryFile = await categoryModel.findById(cId);
        const filePath = `${deletedCategoryFile.cImage_public_id}`;

        let deleteCategory = await categoryModel.findByIdAndDelete(cId);
        if (deleteCategory) {
          // Delete Image from uploads -> categories folder 
          cloudinary.uploader.destroy(filePath,(error,result)=>{
            if(error){
              console.log(error);
            }else{
              return res.json({success: "Category deleted successfully"});
            }
          });
        }
      } catch (err) {
        console.log(err);
      }
    }
  }
}

const categoryController = new Category();
module.exports = categoryController;
