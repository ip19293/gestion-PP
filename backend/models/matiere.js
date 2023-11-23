const mongoose = require("mongoose");
const Categorie = require("../models/categorie");
const AppError = require("../utils/appError");
const matiereSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "matiere nom is required"],
      unique: true,
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
  const Semestre = require("./semestre");
  const Emploi = require("./emploi");
  let message = `Successfully deleted matiere : ${matiere.name} from all [professeurs liste, semestres element,cours,emploi] ...`;

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
        new AppError("matiere numero mast be unique by categorie ....", 404)
      );
    }
  } catch (error) {
    next(error);
  }
});
matiereSchema.methods.getInformation = async function () {
  const Categorie = require("../models/categorie");
  const categorie = await Categorie.findById(this.categorie);
  let categorie_info = await categorie.getInformation();
  let code = categorie_info[0] + this.numero;
  let code_categorie = categorie_info[0];
  return [categorie._id, categorie.name, code, categorie.prix, code_categorie];
};

module.exports = mongoose.model("Matiere", matiereSchema);
