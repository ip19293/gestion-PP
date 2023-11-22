const express = require("express");

const router = express.Router();
const typeController = require("../controller/type-controller");

router
  .route("/")
  .get(typeController.getTypes)
  .post(typeController.addType)
  .delete(typeController.deleteAllTypes);

module.exports = router;
