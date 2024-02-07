const express = require("express");
const xlsxController = require("./xlsx");
//const authController = require("../controller/auth-controller");
const xlsxRouter = express.Router();
xlsxRouter.route("/").get(xlsxController.xlsx_to_json);
module.exports = xlsxRouter;
