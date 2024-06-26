const express = require("express");
const paiementController = require("../controller/paiement-controller");
const authController = require("../auth/controller/auth-controller");
const paiementRouter = express.Router();
paiementRouter
  .route("/")
  .get(
    authController.protect,
    // authController.restricTo("admin"),
    paiementController.getPaiements
  )
  .post(
    authController.protect,
    authController.restricTo("admin"),
    paiementController.addPaiement
  );
paiementRouter
  .route("/many")
  .post(
    authController.protect,
    authController.restricTo("admin"),
    paiementController.addManyPaiements
  );
paiementRouter
  .route("/information")
  .post(
    authController.protect,
    authController.restricTo("admin"),
    paiementController.getInformation
  );
paiementRouter
  .route("/termine")
  .get(
    authController.protect,
    authController.restricTo("admin"),
    paiementController.terminnation
  );
paiementRouter
  .route("/confirmation")
  .get(
    authController.protect,
    authController.restricTo("admin"),
    paiementController.Confirmation
  );
paiementRouter
  .route("/statistique")
  .get(
    authController.protect,
    authController.restricTo("admin"),
    paiementController.Statistique
  );
paiementRouter
  .route("/statistique/:id")
  .get(authController.protect, paiementController.Statistique);
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
    paiementController.Confirmation
  );

paiementRouter
  .route("/:id/professeur")
  .post(authController.protect, paiementController.getPaiementsByProfesseurId);
module.exports = paiementRouter;
