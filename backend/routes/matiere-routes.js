const express = require("express");
const authController = require("../auth/controller/auth-controller");
const matiereController = require("../controller/matiere-controller");

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
module.exports = matiereRouter;
