const express = require("express");
const authController = require("../auth/controller/auth-controller");
const {
  getMatieres,
  addMatiere,
  deleteMatiere,
  updateMatiere,
  getMatiereStats,
  deleteAllMatieres,
  getMatiere,
  getMatieresProf,
} = require("../controller/matiere-controller");

const matiereRouter = express.Router();
matiereRouter
  .route("/")
  .get(
    authController.protect,
    authController.restricTo("admin", "responsable"),
    getMatieres
  )
  .post(
    authController.protect,
    authController.restricTo("admin", "responsable"),
    addMatiere
  )
  .delete(
    authController.protect,
    authController.restricTo("admin", "responsable"),
    deleteAllMatieres
  );

matiereRouter
  .route("/:id")
  .delete(deleteMatiere)
  .patch(updateMatiere)
  .get(getMatiere);

matiereRouter.route("/:id/professeur").get(getMatieresProf);
module.exports = matiereRouter;
