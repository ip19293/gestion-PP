const crypto = require("crypto");
const { default: mongoose } = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const AppError = require("../../utils/appError");
const userSchema = mongoose.Schema({
  nom: {
    type: String,
    required: [true, "Le nom est requis !"],
  },
  prenom: {
    type: String,
    required: [true, "Le prenom est requis !"],
  },

  mobile: {
    type: Number,
    required: [true, "Le numéro de téléphone est reauis !"],
    unique: true,
  },
  email: {
    type: String,
    required: [true, "E-mail est requis !"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Veuillez fournir un e-mail valide"],
  },
  photo: {
    type: String,
  },
  password: {
    type: String,
    required: [true, "Veuillez fournir un mot de passe !"],
    nimlength: 8,
    select: false,
  },
  role: {
    type: String,
    enum: ["user", "admin", "responsable", "professeur"],
    default: "user",
  },
  passwordConfirm: {
    type: String,
    required: [true, "Veuillez vous confirmé votre mot de passe "],
    validate: {
      // this only works on CREATE and SAVE!!!
      validator: function (el) {
        return el === this.password;
      },
      message: "Les mots de passe ne sont pas les mèmes !!!",
    },
  },

  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;

  next();
});
userSchema.pre("save", async function (next) {
  //Only run this function if password was modified
  if (!this.isModified("password")) return next();
  // hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);
  //delete passwordConfirm
  this.passwordConfirm = undefined;
  next();
});
userSchema.pre("/^find/", function (next) {
  this.find({ active: { $ne: false } });

  next();
});
userSchema.methods.correctPassword = async function (
  candidatPassword,
  userPassword
) {
  return await bcrypt.compare(candidatPassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < changedTimestamp;
  }
  // False means Not changed
  return false;
};
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  console.log({ resetToken }, this.passwordResetToken);
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

module.exports = mongoose.model("User", userSchema);
