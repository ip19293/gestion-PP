const APIFeatures = require("../../utils/apiFeatures");
const User = require("../models/user");
const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/appError");
const Professeur = require("../../models/professeur");

const filterOb = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });

  return newObj;
};
// 1) get All User
exports.getUsers = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(User.find().select("+active"), req.query);
  const users = await features.query;

  res.status(200).json({
    status: "succés",

    users,
  });
});
/* ==================================================upload user data ======================================== */
exports.uploadUser = catchAsync(async (req, res, next) => {
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
  let professeur = {};
  const user = await User.create({
    nom: req.body.nom,
    prenom: req.body.prenom,
    mobile: req.body.mobile,
    photo: req.body.photo,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
    accountNumero: req.body.accountNumero,
    banque: req.body.banque,
  });
  if (req.body.role === "professeur") {
    professeur = await Professeur.create({
      user: user._id,
    });
  }
  let data =
    req.body.role === "professeur"
      ? {
          user: user,
          professeur: professeur,
        }
      : {
          user: user,
        };
  res.status(200).json({
    status: "succés",
    message: `L'utilisateur est ajouter avec succés`,
    data: data,
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
  const data = req.body;
  let professeur = {};
  const user_up = await User.findById(id);
  const user = await User.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    return next(new AppError("Aucun utilisateur trouvé avec cet ID", 404));
  }

  if (req.body.role != "professeur" && user_up.role === "professeur") {
    const user_prof = await Professeur.findOneAndDelete({ user: id });
  } else if (req.body.role === "professeur" && user_up.role != "professeur") {
    professeur = await Professeur.create({
      user: user._id,
    });
  }
  res.status(201).json({
    status: "succés",
    message: ` L'utilisateur est modifié ${
      professeur ? ",le professeur est ajouté" : ""
    } avec succés !`,
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
