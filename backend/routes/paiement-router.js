const express = require("express");
const paiementController = require("../controller/paiement-controller");
const authController = require("../auth/controller/auth-controller");
const paiementRouter = express.Router();
paiementRouter
  .route("/")
  .get(
    authController.protect,
    authController.restricTo("admin"),
    paiementController.getPaiements
  )
  .post(
    authController.protect,
    authController.restricTo("admin"),
    paiementController.addPaiement
  );

paiementRouter
  .route("/:id")
  .delete(
    authController.protect,
    authController.restricTo("admin"),
    paiementController.deletePaiement
  )
  .get(
    authController.protect,
    authController.restricTo("admin", "professeur"),
    paiementController.getPaiementById
  )
  .patch(
    authController.protect,
    authController.restricTo("admin", "professeur"),
    paiementController.updatePaiement
  );
paiementRouter
  .route("/:id/confirmation")
  .post(
    authController.protect,
    authController.restricTo("professeur"),
    paiementController.Validation
  );
paiementRouter
  .route("/:id/professeur")
  .post(authController.protect, paiementController.getPaiementsByProfesseurId);
module.exports = paiementRouter;
