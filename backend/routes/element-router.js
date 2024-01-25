const express = require("express");
const elementController = require("../controller/element-controller");
const authController = require("../auth/controller/auth-controller");
const elementRouter = express.Router();
elementRouter
  .route("/")
  .get(
    authController.protect,
    authController.restricTo("admin", "responsable"),
    elementController.getElements
  )
  .post(authController.protect, elementController.addElement);
elementRouter
  .route("/:id")
  .delete(authController.protect, elementController.deleteElement)
  .get(authController.protect, elementController.getElement)
  .patch(authController.protect, elementController.updateElement);

module.exports = elementRouter;
