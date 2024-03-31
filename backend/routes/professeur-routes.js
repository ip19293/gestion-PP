const express = require("express");
const professeurController = require("../controller/professeur-controller");
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
/* ---------------------------------------------------------------------------------- */
/* -------------------------------------------------uplods images---------------- */

const storageIMG = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "backend/uploads/images");
  },
  filename: function (req, file, cb) {
    const fileName = file.originalname.split(" ").join("-");
    const extention = file.originalname.split(".")[1];
    /* const uniqueSuffix = Date.now(); */
    cb(null, fileName + "." + extention);
  },
});

const uploadIMG = multer({ storageIMG });
/* ----------------------------------------------------------------------- */
const router = express.Router();
router
  .route("/")
  .get(
    authController.protect,
    authController.restricTo("admin"),
    professeurController.getProfesseurs
  )
  .post(professeurController.addProfesseur);
router.route("/upload").post(
  authController.protect,
  upload.single("file"),
  /*  uploadIMG.single("image"), */
  professeurController.uploadProfesseurs
);
router
  .route("/with-email/:email")
  .get(
    authController.protect,
    professeurController.getProfesseurEmail,
    professeurController.getProfesseurs
  );

router
  .route("/:id")
  .get(
    authController.protect,
    authController.restricTo("admin", "professeur"),
    professeurController.getProfesseurById
  )
  .delete(
    authController.protect,
    authController.restricTo("admin"),
    professeurController.deleteProfesseur
  )
  .patch(
    authController.protect,
    authController.restricTo("admin", "professeur"),
    professeurController.updateProfesseur
  );
router
  .route("/:id/:idM")
  .post(
    authController.protect,
    authController.restricTo("admin", "professeur"),
    professeurController.addElementToProfesseur
  )
  .delete(
    authController.protect,
    authController.restricTo("admin", "professeur"),
    professeurController.removeElementFromProfesseur
  );

module.exports = router;
