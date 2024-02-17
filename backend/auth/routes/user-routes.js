const express = require("express");

const userController = require("../../auth/controller/user-controller");
const authController = require("../../auth/controller/auth-controller");
/* -----------------------------------------upload users list-------------------------------------------- */
const multer = require("multer");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "backend/uploads/images/");
  },
  filename: function (req, file, cb) {
    const fileName = file.originalname.split(" ").join("-");
    const extention = file.originalname.split(".")[1];
    const uniqueSuffix = Date.now();
    cb(null, fileName + "_" + uniqueSuffix + "." + extention);
  },
});

const upload = multer({ storage });
/* ---------------------------------------------------------------------------------- */
const router = express.Router();
router
  .route("/")
  .get(
    authController.protect,
    authController.restricTo("admin"),
    userController.getUsers
  )
  .post(upload.single("image"), userController.addUser);
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
    upload.single("image"),
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
router.post("/upload", upload.single("file"), userController.uploadUser);
/* router.post("/upload", upload.single("file"), (req, res) => {
  res.send("upload success");
}); */
module.exports = router;
