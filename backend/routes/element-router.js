const express = require("express");
const elementController = require("../controller/element-controller");
const authController = require("../auth/controller/auth-controller");
/* -----------------------------------------upload matieres list-------------------------------------------- */
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
const elementRouter = express.Router();
elementRouter
  .route("/")
  .get(
    authController.protect,
    authController.restricTo("admin", "responsable"),
    elementController.getElements
  )
  .post(authController.protect, elementController.addElement);
elementRouter
  .route("/:id")
  .delete(authController.protect, elementController.deleteElement)
  .get(authController.protect, elementController.getElement)
  .patch(authController.protect, elementController.updateElement);
elementRouter
  .route("/:id/professeurs")
  .patch(authController.protect, elementController.addProfesseurToElements);

elementRouter
  .route("/:id/groups")
  .get(authController.protect, elementController.getGroupsByElementId);
elementRouter
  .route("/upload/:id")
  .post(
    authController.protect,
    upload.single("file"),
    elementController.uploadElements
  );
module.exports = elementRouter;
