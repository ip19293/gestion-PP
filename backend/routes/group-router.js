const express = require("express");
const groupController = require("../controller/group-controller");
const autoCreateCours = require("../controller/auto-create-cours");
const authController = require("../auth/controller/auth-controller");
const router = express.Router();

router
  .route("/")
  .get(
    authController.protect,
    authController.restricTo("admin"),
    groupController.getGroups
  )
  .post(
    authController.protect,
    authController.restricTo("admin"),
    groupController.addGroup
  );
router
  .route("/:id")
  .get(
    authController.protect,
    authController.restricTo("admin"),
    groupController.getGroupById
  )
  .delete(
    authController.protect,
    authController.restricTo("admin"),
    groupController.deleteGroup
  )
  .patch(
    authController.protect,
    authController.restricTo("admin", "responsable"),
    groupController.updateGroup
  );
router
  .route("/:id/emploi")
  .get(
    authController.protect,
    authController.restricTo("admin", "responsable"),
    groupController.getGroupEmplois
  );

router
  .route("/filliere-groups/:id")
  .get(
    authController.protect,
    authController.restricTo("admin"),
    groupController.getAllGroupsInFilliere
  );
router
  .route("/:id/emplois")
  .get(
    authController.protect,
    authController.restricTo("admin"),
    groupController.getGroupEmplois
  );

module.exports = router;
