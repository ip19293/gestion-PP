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

const createSendToken = (user, statusCode, res) => {
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
    status: "success",
    token,
    data: {
      user: user,
    },
  });
};
exports.singup = catchAsync(async (req, res, next) => {
  let newUser;
  if (!req.body.role || req.body.role != "admin") {
    newUser = await User.create({
      nom: req.body.nom,
      prenom: req.body.prenom,
      mobile: req.body.mobile,
      password: req.body.password,
      email: req.body.email,
      passwordConfirm: req.body.passwordConfirm,
      passwordChangedAt: req.body.passwordChangedAt,
      role: req.body.role,
    });
    if (req.body.role == "professeur") {
      let professeur;
      professeur = await Professeur.findOne({ email: req.body.email });
      if (!professeur) {
        professeur = new Professeur({
          nom: req.body.nom,
          prenom: req.body.prenom,
          mobile: req.body.mobile,
          email: req.body.email,
          user: newUser._id,
        });
        professeur = await professeur.save();
      } else {
        professeur = await Professeur.findByIdAndUpdate(
          professeur._id,
          {
            nom: req.body.nom,
            prenom: req.body.prenom,
            mobile: req.body.mobile,
            email: req.body.email,
            user: newUser._id,
          },
          {
            new: true,
            runValidators: true,
          }
        );
      }
    }
  } else {
    newUser = await User.create({
      nom: req.body.nom,
      prenom: req.body.prenom,
      mobile: req.body.mobile,
      password: req.body.password,
      email: req.body.email,
      passwordConfirm: req.body.passwordConfirm,
      passwordChangedAt: req.body.passwordChangedAt,
    });
  }
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  // 1) check if email and password exist
  if (!email || !password) {
    return next(new AppError("Please provide email and password!", 400));
  }

  // 2) check if user exists && password is correct
  const user = await User.findOne({ email })
    .select("+password")
    .select("+active");
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect Email or Password", 401));
  }

  if (user.active == false) {
    return next(
      new AppError("Your compte is desactive , Plaese contacted the admin", 401)
    );
  }
  // 3) send token to client if verification is ok
  createSendToken(user, 200, res);
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
    return next(new AppError("Please login first to get access !!", 401));
  }
  // 2) Verification token

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  console.log(decoded);

  // 3) check if user still exists
  const fresUser = await User.findById(decoded.id);
  if (!fresUser) {
    return next(new AppError("The user is not exist !!", 401));
  }
  // 4) check if user changed password after the token was iss
  if (fresUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError("User recently changed password .Please login again !", 401)
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
        new AppError("You dont have a permission to perform this action !", 403)
      );
    }

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) get user based on Posted email
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError("There is no user with email address", 404));
  }
  // 2) Generate the random reset
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  // 3) Send it to user's email
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/auth/resetPassword/${resetToken}`;
  const message = `Forgot your password? Submit a PATH request with your new password and passwordConfirm to: ${resetURL}.\n
  if you not forgot password please ignore this Email
  `;

  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset token (valid for 10 min)",
      message,
    });
    res.status(200).json({
      status: "success",
      message: "Token send to email",
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError("failed to send email .Try again later!", 500));
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
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
    return next(new AppError("Token is invalid or has expired", 400));
  }
  user.password = req.body.password;
  (user.passwordConfirm = req.body.passwordConfirm),
    (user.passwordResetToken = undefined);
  user.passwordResetExpires = undefined;

  await user.save();
  // 3 Update changedPasswordAt property for user
  // 4 log the user in send JWT

  createSendToken(user, 200, res);
});
exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1 Get user from collection

  const user = await User.findById(req.user._id).select("+password");

  // 2 check if Posted current password is correct

  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError("Your current password is wrong !", 401));
  }
  // 3 if so update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // log user in send JWT

  createSendToken(user, 200, res);
});
