const express = require("express");
const authController = require("../auth/controller/auth-controller");
const matiereController = require("../controller/matiere-controller");
/* -----------------------------------------upload matieres list-------------------------------------------- */
const multer = require("multer");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "backend/uploads/");
  },
  filename: function (req, file, cb) {
    const fileName = file.originalname.split(" ").join("-");
    const extention = file.originalname.split(".")[1];
    const uniqueSuffix = Date.now();
    cb(null, fileName + "_" + uniqueSuffix + "." + extention);
  },
});

const upload = multer({ storage });
/* ---------------------------------------------------------------------------------- */
const matiereRouter = express.Router();
matiereRouter
  .route("/")
  .get(
    authController.protect,
    authController.restricTo("admin", "responsable"),
    matiereController.getMatieres
  )
  .post(
    authController.protect,
    authController.restricTo("admin", "responsable"),
    matiereController.addMatiere
  )
  .delete(
    authController.protect,
    authController.restricTo("admin", "responsable"),
    matiereController.deleteAllMatieres
  );

matiereRouter
  .route("/:id")
  .delete(matiereController.deleteMatiere)
  .patch(matiereController.updateMatiere)
  .get(matiereController.getMatiere);

matiereRouter
  .route("/:id/professeurs")
  .get(matiereController.getProfesseursByMatiereId);
matiereRouter
  .route("/:id/elements")
  .get(matiereController.getElementsByMatiereId);

matiereRouter.post(
  "/upload",
  upload.single("file"),
  matiereController.uploadMatieres
);
module.exports = matiereRouter;
