const APIFeatures = require("../../utils/apiFeatures");
const User = require("../models/user");
const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/appError");
const Professeur = require("../../models/professeur");
const professeur = require("../../models/professeur");

const filterOb = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });

  return newObj;
};
// 1) get All User
exports.getUsers = catchAsync(async (req, res, next) => {
  let filter = {};
  if (req.params.id) filter = { cours: req.params.id };

  const features = new APIFeatures(User.find().select("+active"), req.query)
    .filter()
    .sort()
    .limitFields()
    .pagination();
  const usersData = await features.query;
  const professeurDetails = await Professeur.find({
    user: {
      $in: usersData
        .filter((user) => user.role === "professeur")
        .map((user) => user._id),
    },
  });
  const users = usersData.map((user) => {
    if (user.role === "professeur") {
      const prof = professeurDetails.find((prof) =>
        prof.user._id.equals(user._id)
      );
      let professeur = {
        _id: prof._id,
        accountNumero: prof.accountNumero,
        banque: prof.banque,
        user: prof.user._id,
      };
      return { ...user._doc, professeur };
    }
    return user;
  });
  res.status(200).json({
    status: "succés",

    users,
  });
});
/* ==================================================upload user data ======================================== */
exports.uploadUser = catchAsync(async (req, res, next) => {
  const fileName = req.file.filename;
  console.log(fileName);
  res.status(200).json({
    status: "succés",
    message: "Le fichier est téléchargé avec succés",
  });
});

// 2) delete All User
exports.deleteAllUsers = catchAsync(async (req, res, next) => {
  await User.deleteMany();
  res.status(200).json({
    status: "succés",
    message: "Tous les utilisateurs sont supprimés avec succés",
  });
});
// 3) Create new User
exports.addUser = catchAsync(async (req, res, next) => {
  const fileName = req.file != undefined ? req.file.filename : "";
  const basePath = `${req.protocol}://${req.get("host")}/uploads/images/`;
  if (req.body.role === "professeur") {
    const prof = await Professeur.findOne({
      accountNumero: req.body.accountNumero,
    });
    if (prof) {
      return next(new AppError("Le numero de compte n'est pas valide !", 404));
    }
  }
  const user = await User.create({
    nom: req.body.nom,
    prenom: req.body.prenom,
    mobile: req.body.mobile,
    photo: `${basePath}${fileName}`,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
  });
  if (user && user.role === "professeur") {
    const professeur = await Professeur.create({
      user: user._id,
      banque: req.body.banque,
      accountNumero: req.body.accountNumero,
    });
    if (!professeur) {
      await User.findOneAndDelete({ _id: user._id });
      return next(
        new AppError("Le donne de professeur n'est pas valide !", 404)
      );
    }
  }
  res.status(200).json({
    status: "succés",
    message: `L'utilisateur est ajouter avec succés`,
    user,
  });
});
// active or deactive user
exports.activeOrDisactiveUser = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  let ms = "";
  const data = req.body;
  const user = await User.findById(id).select("+active");
  if (user && user.role != "admin") {
    if (user.active === true) {
      await User.findByIdAndUpdate(
        id,
        { active: false },
        {
          new: true,
          runValidators: true,
        }
      );
      ms = "L'utilisateur est déactivate";
    } else {
      await User.findByIdAndUpdate(
        id,
        { active: true },
        {
          new: true,
          runValidators: true,
        }
      );
      ms = "L'utilisateur est activate ";
    }
  }
  res.status(201).json({
    status: "succés",
    message: ms,
  });
});
// 4) Edit a User
exports.updateUser = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const fileName = req.file != undefined ? req.file.filename : "";
  const basePath = `${req.protocol}://${req.get("host")}/uploads/images/`;
  const user = await User.findById(id);
  user.prenom = req.body.prenom != undefined ? req.body.prenom : user.prenom;
  user.nom = req.body.nom != undefined ? req.body.nom : user.nom;
  user.mobile = req.body.mobile != undefined ? req.body.mobile : user.mobile;
  user.email = req.body.email != undefined ? req.body.email : user.email;
  user.photo = req.file != undefined ? `${basePath}${fileName}` : user.photo;

  const oldValidateBeforeSave = User.schema.options.validateBeforeSave;
  console.log(oldValidateBeforeSave);
  User.schema.options.validateBeforeSave = false;
  try {
    await user.save();
  } finally {
    User.schema.options.validateBeforeSave = oldValidateBeforeSave;
  }
  if (user && user.role === "professeur") {
    const professeur = await Professeur.findOne({ user: user._id });
    if (!professeur) {
      await User.findOneAndDelete({ _id: user._id });
      return next(new AppError("Le professeur n'est existe pas !", 404));
    }
    professeur.banque =
      req.body.banque != undefined ? req.body.banque : professeur.banque;
    professeur.accountNumero =
      req.body.accountNumero != undefined
        ? req.body.accountNumero
        : professeur.accountNumero;
    await professeur.save();
  }
  res.status(201).json({
    status: "succés",
    message: ` L'utilisateur est modifié  avec succés !`,
    user: user,
  });
});
// 5) Remove a User
exports.deleteUser = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const user = await User.findOneAndDelete({ _id: id });
  if (!user) {
    return next(new AppError("Aucun utilisateur trouvé avec cet ID", 404));
  }

  res.status(200).json({
    status: "succés",
    message: user.nom,
  });
});
// 6) get User By ID
exports.getUserById = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const user = await User.findById(id)
    .select("+password")
    .select("+passwordConfirm");
  if (!user) {
    return next(new AppError("Aucun utilisateur trouvé avec cet ID", 404));
  }
  res.status(200).json({
    status: "succés",
    user: user,
  });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        "this route not for password updates.please use /updateMypassword",
        400
      )
    );
  }
  // 2 filtered out unwanted fields names that are not allowed to be updated
  const filterBody = filterOb(req.body, "nom", "email", "photo");

  // 2 update user
  const user = await User.findByIdAndUpdate(req.user._id, filterBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "succés",
    data: {
      user: user,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: "succés",
    data: null,
  });
});
exports.getProfesseur = catchAsync(async (req, res, next) => {
  let message = "";
  let id = req.params.id;
  const user = await User.findById(id);
  if (!user) {
    return next(new AppError("Pas d'utilisateur trouvé !", 400));
  }
  const prof = await user.getProfesseur();
  if (!prof) {
    return next(new AppError("Pas de Enseignat trouvé !", 400));
  }
  message = "L'enseignat responsable de cet utilisateur donnée .";
  res.status(200).json({
    status: "succés",
    message: message,
    prof,
  });
});
