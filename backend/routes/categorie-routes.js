const express = require("express");

const categorieController = require("../controller/categorie-controller");
const authController = require("../auth/controller/auth-controller");

const router = express.Router();
router
  .route("/")
  .get(authController.protect, categorieController.getCategories)
  .post(categorieController.addCategorie);
router.param("id", (req, res, next, val) => {
  console.log(`id de user est ${val}`);
  next();
});
router
  .route("/:id")
  .get(categorieController.getCategorieById)
  .delete(
    authController.protect,
    authController.restricTo("admin", "responsable"),
    categorieController.deleteCategorie
  )
  .patch(
    authController.protect,
    authController.restricTo("admin", "responsable"),
    categorieController.updateCategorie
  );
router.route("/:id/matieres").get(categorieController.getCategorieMatieres);

module.exports = router;
