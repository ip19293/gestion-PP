const crypto = require("crypto");
const { default: mongoose } = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const AppError = require("../../utils/appError");
const userSchema = mongoose.Schema({
  nom: {
    type: String,
    required: [true, "Le nom est requis !"],
    lowercase: true,
  },
  prenom: {
    type: String,
    required: [true, "Le prenom est requis !"],
    lowercase: true,
  },

  mobile: {
    type: Number,
    required: [true, "Le numéro de téléphone est reauis !"],
    unique: true,
    minLength: [
      8,
      "Le numéro de telephonne doit avoir une longueur  plus ou egale a 10 chiffres ",
    ],
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
    enum: ["admin", "responsable", "professeur"],
    default: "professeur",
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
    default: false,
    select: false,
  },
});

userSchema.post("save", async function (user, next) {
  const Professeur = require("../../models/professeur");
  const Cours = require("../../models/professeur");
  const professeur = await Professeur.findOne({ user: user._id });
  if (professeur) {
    professeur.nom = user.nom;
    professeur.prenom = user.prenom;
    await professeur.save();
    await Cours.updateMany(
      {
        professeur: professeur._id,
      },
      { enseignant: user.nom + " " + user.prenom }
    );
  }
  next();
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
userSchema.methods.getProfesseur = async function () {
  const Professeur = require("../../models/professeur");
  try {
    const professeur = await Professeur.findOne({ user: this._id });
    return professeur;
  } catch (error) {
    console.log(error);
  }
};
//post findOneAndDelete midlweere ------------------------------------------------------------------------------------
userSchema.post("findOneAndDelete", async function (user) {
  console.log(" user remove midleweere work ....................");
  const Cours = require("../../models/cours");
  const Emploi = require("../../models/emploi");
  const Professeur = require("../../models/professeur");
  let message = `L'utilisateur : ${user.nom}  ${user.prenom} est suupprimé  avec succés .`;
  const professeur = await user.getProfesseur();
  if (professeur) {
    message = `L'utilisateur de role eneignant(e) : ${user.nom}  ${user.prenom} est suupprimé  et ces [ cours, emploi] avec succés .`;
    await Cours.deleteMany({ professeur: professeur._id });
    await Emploi.deleteMany({ professeur: professeur._id });
    await Professeur.findOneAndDelete({
      user: user._id,
    });
  }
  user.nom = message;
});
module.exports = mongoose.model("User", userSchema);
