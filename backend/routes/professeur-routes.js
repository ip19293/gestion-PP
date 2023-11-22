const express = require("express");
const professeurController = require("../controller/professeur-controller");
const authController = require("../auth/controller/auth-controller");
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
