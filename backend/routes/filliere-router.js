const express = require("express");

const filliereController = require("../controller/filliere-controller");
const authController = require("../auth/controller/auth-controller");

const router = express.Router();
router
  .route("/")
  .get(authController.protect, filliereController.getFillieres)
  .post(filliereController.addFilliere);

router.param("id", (req, res, next, val) => {
  console.log(`id de user est ${val}`);
  next();
});
router
  .route("/:id")
  .get(filliereController.getFilliereDetail)
  .delete(
    authController.protect,
    authController.restricTo("admin", "responsable"),
    filliereController.deleteFilliere
  )
  .patch(
    authController.protect,
    authController.restricTo("admin", "responsable"),
    filliereController.updateFilliere
  );

module.exports = router;
