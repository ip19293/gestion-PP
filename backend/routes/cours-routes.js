const express = require("express");
const courController = require("../controller/cours-controller");
const autoCreateCoursController = require("../controller/auto-create-cours");
const createCoursFromEmploiController = require("../controller/create-cours-from-emploi");
const authController = require("../auth/controller/auth-controller");
const CoursRouter = express.Router();
CoursRouter.route("/")
  .get(authController.protect, courController.getCours)
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
CoursRouter.route("/monthly-by-professeur").get(
  authController.protect,
  courController.getMonthlyCourseCountByProfessor
);
CoursRouter.route("/signe-professeur/:id").get(
  courController.getSignedCoursByProfesseurId,
  courController.getCours
);
CoursRouter.route("/non-signe-professeur/:id").post(
  courController.getNonSignedCoursByProfesseurId,
  courController.getCours
);
CoursRouter.route("/professeur/:id")
  .get(courController.getAllCoursProf, courController.getCours)
  .post(authController.protect, courController.getCoursByProfesseursId);

CoursRouter.route("/:id/signe").patch(
  authController.protect,
  courController.signeCours
);

CoursRouter.route("/:id")
  .delete(authController.protect, courController.deleteCours)
  .get(courController.getOneCours)
  .patch(authController.protect, courController.updateCours);

module.exports = CoursRouter;
