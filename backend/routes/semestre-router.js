const express = require("express");
const semestreController = require("../controller/semestre-controller");
const authController = require("../auth/controller/auth-controller");
const router = express.Router();
router
  .route("/")
  .get(
    authController.protect,
    authController.restricTo("admin"),
    semestreController.getSemestres
  )
  .post(
    authController.protect,
    authController.restricTo("admin"),
    semestreController.addSemestre
  );

router
  .route("/:id")
  .delete(
    authController.protect,
    authController.restricTo("admin"),
    semestreController.deleteSemestre
  )
  .patch(
    authController.protect,
    authController.restricTo("admin", "responsable"),
    semestreController.updateSemestre
  );

router
  .route("/:id/elements")
  .get(
    authController.protect,
    authController.restricTo("admin", "responsable"),
    semestreController.getSemestreElements
  );
router
  .route("/:id/:idM")
  .post(
    authController.protect,
    authController.restricTo("admin", "responsable"),
    semestreController.addOneElementToSemestre
  )
  .delete(
    authController.protect,
    authController.restricTo("admin", "responsable"),
    semestreController.deleteOneElementFromSemestre
  );
router
  .route("/:numero/:idF")
  .get(
    authController.protect,
    authController.restricTo("admin", "responsable"),
    semestreController.getSemestreByNumero
  );
module.exports = router;
