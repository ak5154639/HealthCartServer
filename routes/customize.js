const express = require("express");
const router = express.Router();
const customizeController = require("../controller/customize");
const multer = require("multer");



const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// var storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "public/uploads/customize");
//   },
//   filename: function (req, file, cb) {
//     cb(null, Date.now() + "_" + file.originalname);
//   },
// });

// const upload = multer({ dest: `uploads/` });

// function uploadPhoto(req, res, next) {
//   console.log(req.body.get("image"));
//   // cloudinary.uploader.upload(req.file.buffer, { public_id: "PHOTO_PUBLIC_ID" }, function(err, result) {
//   //   if (err) {
//   //     return res.status(400).json({ message: 'Error uploading file to Cloudinary' });
//   //   }

//   //   // Save the photo URL to your database or do something else with it
//   //   const photoUrl = result.secure_url;

//   //   // Pass the photo URL to the next middleware or controller
//   //   req.photoUrl = photoUrl;
//   //   next();
//   // });
// }

router.get("/get-slide-image", customizeController.getImages);
router.post("/delete-slide-image", customizeController.deleteSlideImage);
router.post(
  "/upload-slide-image",
  upload.single("image"),
  customizeController.uploadSlideImage
);
router.post("/dashboard-data", customizeController.getAllData);

module.exports = router;
