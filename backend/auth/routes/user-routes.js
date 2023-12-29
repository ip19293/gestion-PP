const express = require("express");

const userController = require("../../auth/controller/user-controller");
const authController = require("../../auth/controller/auth-controller");

const router = express.Router();
router
  .route("/")
  .get(
    authController.protect,
    authController.restricTo("admin"),
    userController.getUsers
  )
  .post(userController.addUser);
router.param("id", (req, res, next, val) => {
  console.log(`id de user est ${val}`);
  next();
});
router
  .route("/:id")
  .get(userController.getUserById)
  .delete(
    authController.protect,
    authController.restricTo("admin", "responsable"),
    userController.deleteUser
  )

  .patch(
    authController.protect,
    authController.restricTo("admin", "responsable"),
    userController.updateUser
  );
router
  .route("/:id/professeur")
  .get(authController.protect, userController.getProfesseur);
router
  .route("/:id/active")
  .patch(
    authController.protect,
    authController.restricTo("admin"),
    userController.activeOrDisactiveUser
  );
router.patch("/updateMe", authController.protect, userController.updateMe);

module.exports = router;
