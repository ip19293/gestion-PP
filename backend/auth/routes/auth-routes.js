const express = require("express");
const userController = require("../../auth/controller/user-controller");

const authController = require("../../auth/controller/auth-controller");

const router = express.Router();

router.post("/signup", authController.singup);
router.post("/login", authController.login);
router.post("/verification", authController.verification);

router.post("/forgotPassword", authController.forgotPassword);
router.patch(
  "/updateMyPassword",
  authController.protect,
  authController.updatePassword
);

router.patch("/resetPassword/:token", authController.resetPassword);
router.patch("/updateMe", authController.protect, userController.updateMe);
router.delete("/deleteMe", authController.protect, userController.deleteMe);
module.exports = router;
