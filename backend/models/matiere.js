const mongoose = require("mongoose");
const Categorie = require("../models/categorie");
const AppError = require("../utils/appError");
const matiereSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "matiere nom is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    categorie: {
      type: mongoose.Schema.ObjectId,
      ref: "Categorie",
      required: true,
    },

    numero: {
      type: Number,
      select: true,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
matiereSchema.pre("save", async function (next) {
  let numeroArray = await this.constructor
    .find({
      categorie: this.categorie,
    })
    .distinct("numero");

  let nb = getNonExistingNumber(numeroArray);
  this.numero = nb;

  next();
});
const getNonExistingNumber = function (arr) {
  for (let i = 0; i <= arr.length; i++) {
    if (!arr.includes(i)) {
      return i;
    }
  }
  return arr.length + 1;
};
matiereSchema.post("findOneAndDelete", async function (matiere) {
  console.log(" matiere remove midleweere work ....................");
  const Cours = require("./cours");
  const Professeur = require("./professeur");
  const Semestre = require("./facture");
  const Emploi = require("./emploi");
  let message = `La matière supprimée avec succès de tous les semestres elements,cours,emplois et enseignants liste des matières .`;

  const professeur = await Professeur.updateMany(
    {
      matieres: { $elemMatch: { $eq: matiere._id } },
    },
    {
      $pull: {
        matieres: matiere._id,
      },
    }
  );
  await Semestre.updateMany(
    {
      elements: { $elemMatch: { $eq: matiere._id } },
    },
    {
      $pull: {
        elements: matiere._id,
      },
    }
  );
  await Cours.deleteMany({ matiere: matiere._id });
  await Emploi.deleteMany({ matiere: matiere._id });
  matiere.name = message;
});
//Get matiere numero
matiereSchema.pre("validate", async function (next) {
  try {
    const existingDoc = await mongoose.model("Matiere").findOne({
      categorie: this.categorie,
      name: this.name,
    });
    if (existingDoc && !existingDoc._id.equals(this._id)) {
      return next(
        new AppError(
          "Le numéro de matière doit etre unique par catégorie ! ",
          404
        )
      );
    }
  } catch (error) {
    next(error);
  }
});
matiereSchema.methods.getCodePrixCNameCCode = async function () {
  const Categorie = require("../models/categorie");
  const categorie = await Categorie.findById(this.categorie);
  let categorie_info = await categorie.getCodeNbmatieres();
  let code = categorie_info[0] + this.numero;

  return [code, categorie.prix, categorie.name, categorie_info[0]];
};

module.exports = mongoose.model("Matiere", matiereSchema);
