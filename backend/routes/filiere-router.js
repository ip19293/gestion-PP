const express = require("express");

const filiereController = require("../controller/filiere-controller");
const authController = require("../auth/controller/auth-controller");

const router = express.Router();
router
  .route("/")
  .get(authController.protect, filiereController.getFilieres)
  .post(authController.protect, filiereController.addFiliere);

router.param("id", (req, res, next, val) => {
  console.log(`id de user est ${val}`);
  next();
});
router
  .route("/:id")
  .get(filiereController.getFiliereDetail)
  .delete(
    authController.protect,
    authController.restricTo("admin", "responsable"),
    filiereController.deleteFiliere
  )
  .patch(
    authController.protect,
    authController.restricTo("admin", "responsable"),
    filiereController.updateFiliere
  );
router
  .route("/:id/emplois")
  .get(
    authController.protect,
    authController.restricTo("admin", "responsable"),
    filiereController.getFiliereEmplois
  );

module.exports = router;
