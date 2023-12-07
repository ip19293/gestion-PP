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

module.exports = paiementRouter;
