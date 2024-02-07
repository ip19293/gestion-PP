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
const router = express.Router();
router
  .route("/")
  .get(
    authController.protect,
    authController.restricTo("admin"),
    professeurController.getProfesseurs
  )
  .post(professeurController.addProfesseur);
router
  .route("/upload")
  .post(
    authController.protect,
    upload.single("file"),
    professeurController.uploadProfesseurs
  );
router
  .route("/:email/email")
  .get(authController.protect, professeurController.getProfesseurEmail);

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
  .post(
    authController.protect,
    authController.restricTo("admin", "professeur"),
    professeurController.addMatiereToProfesseus
  )
  .patch(
    authController.protect,
    authController.restricTo("admin", "professeur"),
    professeurController.updateProfesseur
  );

router
  .route("/:id/cours-non")
  .get(
    authController.protect,
    authController.restricTo("admin", "professeur"),
    professeurController.getProfCoursNon
  );
router
  .route("/:id/cours-oui")
  .get(
    authController.protect,
    authController.restricTo("admin", "professeur"),
    professeurController.getProfCoursSigned
  );
router
  .route("/:id/cours")
  .get(
    authController.protect,
    authController.restricTo("admin", "professeur"),
    professeurController.getProfCours
  )
  .post(
    authController.protect,
    authController.restricTo("admin", "professeur"),
    professeurController.addCoursToProf
  );
router
  .route("/:id/matiere")
  .get(
    authController.protect,
    authController.restricTo("admin", "professeur"),
    professeurController.addMatiereToProfesseus
  );
router
  .route("/:id/:idM")
  .delete(
    authController.protect,
    authController.restricTo("admin", "professeur"),
    professeurController.deleteOneMatProf
  );

module.exports = router;
