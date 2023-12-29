const crypto = require("crypto");
const { promisify } = require("util");
const User = require("../models/user");
const catchAsync = require("../../utils/catchAsync");
const jwt = require("jsonwebtoken");
const AppError = require("../../utils/appError");
const sendEmail = require("../../utils/email");
const Professeur = require("../../models/professeur");
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res, message) => {
  const token = signToken(user._id);
  const cookieOptions = {
    exprires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

  res.cookie("jwt", token, cookieOptions);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: "succéss",
    message: message,
    token,
    data: {
      user: user,
    },
  });
};
exports.getProfesseur = catchAsync(async (req, res, next) => {
  let message = "";
  let id = req.params.id;
  const user = await User.findById(id);
  if (!user) {
    return next(new AppError("Pas d'utilisateur trouvé !", 400));
  }
  const prof = await user.getProfesseur();
  if (!prof) {
    return next(new AppError("Pas de Enseignat trouvé ! ", 400));
  }
  message = "L'enseignat responsable de cet utilisateur donnée .";
  createSendToken(prof, 201, res, message);
});
exports.singup = catchAsync(async (req, res, next) => {
  let message = "";
  let newUser;
  let professeur;
  let query =
    req.body.role !== undefined && req.body.role !== "admin"
      ? {
          nom: req.body.nom,
          prenom: req.body.prenom,
          mobile: req.body.mobile,
          password: req.body.password,
          email: req.body.email,
          passwordConfirm: req.body.passwordConfirm,
          passwordChangedAt: req.body.passwordChangedAt,
          role: req.body.role,
        }
      : {
          nom: req.body.nom,
          prenom: req.body.prenom,
          mobile: req.body.mobile,
          password: req.body.password,
          email: req.body.email,
          passwordConfirm: req.body.passwordConfirm,
          passwordChangedAt: req.body.passwordChangedAt,
        };
  if (req.body.role == "professeur") {
    const prof = await Professeur.findOne({
      accountNumero: req.body.accountNumero,
    });
    if (prof) {
      return next(
        new AppError("Veuillez vérifier votre numéro de compte banque !", 400)
      );
    }
    if (req.body.accountNumero.toString().length !== 10) {
      return next(
        new AppError(
          " Le numéro de compte doit avoir une longueur de 10 chiffres !",
          400
        )
      );
    }
  }
  newUser = await User.create(query);
  if (req.body.role == "professeur") {
    professeur = await Professeur.create({
      user: newUser._id,
      accountNumero: req.body.accountNumero,
      banque: req.body.banque,
    });
  }
  message = "Votre comple est crée avec succéss .";
  createSendToken(newUser, 201, res, message);
});

exports.login = catchAsync(async (req, res, next) => {
  let message = "";
  const email = req.body.email;
  const password = req.body.password;
  // 1) check if email and password exist
  if (!email || !password) {
    return next(
      new AppError(
        "Veuillez fournir votre adresse e-mail et votre mot de passe!",
        400
      )
    );
  }

  // 2) check if user exists && password is correct
  const user = await User.findOne({ email })
    .select("+password")
    .select("+active");
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("E-mail ou mot de passe incorrect !", 401));
  }

  if (user.active == false) {
    return next(
      new AppError(
        "Votre compte est désactivé, veuillez contacter l'administrateur !",
        401
      )
    );
  }
  message = `Bienvenue ${user.role}`;
  // 3) send token to client if verification is ok
  createSendToken(user, 200, res, message);
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and chek of it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  //console.log(token);
  if (!token) {
    return next(
      new AppError("Veuillez d'abord vous authentifiez pour y accéder !!", 401)
    );
  }
  // 2) Verification token

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  console.log(decoded);

  // 3) check if user still exists
  const fresUser = await User.findById(decoded.id);
  if (!fresUser) {
    return next(new AppError("L'utilisateur n'existe pas !!", 401));
  }
  // 4) check if user changed password after the token was iss
  if (fresUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError(
        "L'utilisateur a récemment changé de mot de passe veuillez vous reconnecter !",
        401
      )
    );
  }
  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = fresUser;
  next();
});

exports.restricTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          "Vous n'avez pas la permission d'effectuer cette action !",
          403
        )
      );
    }

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) get user based on Posted email
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(
      new AppError("Il n'ya pas d'utilisateur avec cet addresse e-email ", 404)
    );
  }
  // 2) Generate the random reset
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  // 3) Send it to user's email
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/auth/resetPassword/${resetToken}`;
  const message = `Mot de passe oublié ? Soumettez une demande de chemin avec votre nouveau mot de passe et mot de passe confirm a: ${resetURL}.\n
  si vous n'oubliez pas le mot de passe veuillez ignorer cet e=mail
  `;

  try {
    await sendEmail({
      email: user.email,
      subject:
        "Votre jeton de réinitialisation du mot de passe (valide pendant 10 minutes)",
      message,
    });
    res.status(200).json({
      status: "succéss",
      message: "Le jeton est envoyé par e-mail",
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError("échec de l'envoi de l'e-mail . réessayez plus tard !", 500)
    );
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  let message = "";
  // 1 Get user based on the token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");
  console.log(hashedToken);
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2 if token has not exipired and there is user set the new password
  if (!user) {
    return next(new AppError("Le jeton n'est pas valide ou expiré", 400));
  }
  user.password = req.body.password;
  (user.passwordConfirm = req.body.passwordConfirm),
    (user.passwordResetToken = undefined);
  user.passwordResetExpires = undefined;

  await user.save();
  // 3 Update changedPasswordAt property for user
  // 4 log the user in send JWT
  message = `Le mot passe est réinitialiser avec succéss .`;
  createSendToken(user, 200, res, message);
});
exports.updatePassword = catchAsync(async (req, res, next) => {
  let message = "";
  // 1 Get user from collection

  const user = await User.findById(req.user._id).select("+password");

  // 2 check if Posted current password is correct

  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError("Votre mot de passe actuel est incorrect !", 401));
  }
  // 3 if so update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // log user in send JWT
  message = `Le mot de passe est modifié avec succéss .`;
  createSendToken(user, 200, res, message);
});
