const express = require("express");
const courController = require("../controller/cours-controller");
const autoCreateCoursController = require("../controller/auto-create-cours");
const createCoursFromEmploiController = require("../controller/create-cours-from-emploi");
const authController = require("../auth/controller/auth-controller");
const CoursRouter = express.Router();
CoursRouter.route("/")
  .get(
    authController.protect,
    authController.restricTo("admin", "responsable"),
    courController.getCours
  )
  .post(authController.protect, courController.addCours);
CoursRouter.route("/notpaid").get(
  authController.protect,
  authController.restricTo("admin"),
  courController.getNotPaidCours
);
CoursRouter.route("/signe").patch(courController.signeAllCours);

CoursRouter.route("/paid").get(courController.getPaidCours);
CoursRouter.route("/auto-create").get(
  authController.protect,
  authController.restricTo("admin"),
  createCoursFromEmploiController.auto
);
CoursRouter.route("/:id/cours").post(courController.getCoursByProfesseursId);
CoursRouter.route("/:id/signe").patch(courController.signeCours);

CoursRouter.route("/:id")
  .delete(authController.protect, courController.deleteCours)
  .get(courController.getOneCours)
  .patch(authController.protect, courController.updateCours);

module.exports = CoursRouter;
