const express = require("express");
const emploiController = require("../controller/emploi-controller");
const authController = require("../auth/controller/auth-controller");
/* -----------------------------------------upload emplois list-------------------------------------------- */
const multer = require("multer");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "backend/uploads/");
  },
  filename: function (req, file, cb) {
    const fileName = file.originalname.split(" ").join("-");
    const extention = file.originalname.split(".")[1];
    /*   const uniqueSuffix = Date.now(); */
    cb(null, fileName + "." + extention);
  },
});
const upload = multer({ storage });
/* -------------------------------------------------------------------------------------------------- */
const emploiRouter = express.Router();
emploiRouter
  .route("/")
  .get(
    authController.protect,
    authController.restricTo("admin", "responsable"),
    emploiController.getEmplois
  )
  .post(
    authController.protect,
    authController.restricTo("admin", "responsable"),
    emploiController.addEmploi
  );

emploiRouter
  .route("/:id")
  .delete(
    authController.protect,
    authController.restricTo("admin", "responsable"),
    emploiController.deleteEmploi
  )
  .get(
    authController.protect,
    authController.restricTo("admin", "responsable"),
    emploiController.getEmploiById
  )
  .patch(
    authController.protect,
    authController.restricTo("admin", "responsable"),
    emploiController.updateEmploi
  );
emploiRouter
  .route("/:id/professeur")
  .get(authController.protect, emploiController.getEmploisByProfesseurId);

emploiRouter
  .route("/upload")
  .post(
    authController.protect,
    upload.single("file"),
    emploiController.uploadEmplois
  );
module.exports = emploiRouter;
