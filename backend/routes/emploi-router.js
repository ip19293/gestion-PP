const express = require("express");
const emploiController = require("../controller/emploi-controller");
const authController = require("../auth/controller/auth-controller");
const emploiRouter = express.Router();
emploiRouter
  .route("/")
  .get(
    authController.protect,
    authController.restricTo("admin", "responsable"),
    emploiController.getEmplois
  )
  .post(
    authController.protect,
    authController.restricTo("admin", "responsable"),
    emploiController.addEmploi
  );

emploiRouter
  .route("/:id")
  .delete(
    authController.protect,
    authController.restricTo("admin", "responsable"),
    emploiController.deleteEmploi
  )
  .get(
    authController.protect,
    authController.restricTo("admin", "responsable"),
    emploiController.getEmploiById
  )
  .patch(
    authController.protect,
    authController.restricTo("admin", "responsable"),
    emploiController.updateEmploi
  );
emploiRouter
  .route("/:id/professeur")
  .get(authController.protect, emploiController.getEmploisByProfesseurId);
module.exports = emploiRouter;
