const mongoose = require("mongoose");
const Matiere = require("../models/matiere");
const User = require("../auth/models/user");
const professeurSchema = mongoose.Schema(
  {
    nom: {
      type: String,
      required: [true, "nom of professeur is required"],
      select: true,
    },
    prenom: {
      type: String,
      select: true,
      required: [true, "prenom of professeur is required"],
    },

    mobile: {
      type: Number,
      required: [true, "mobile number is required"],
      unique: true,
    },
    email: {
      type: String,
      required: [true, "email is required"],
      unique: true,
      trim: true,
    },
    matieres: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "Matiere",
      },
    ],
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
professeurSchema.pre("save", async function (next) {
  const unqRef = [...new Set(this.matieres.map(String))];
  if (this.matieres.length !== unqRef.length) {
    const error = new Error("Duplicate ObjectId reference in matieres");
    return next(error);
  }
  try {
    const existe_matiere = await Promise.all(
      this.matieres.map(async (el) => {
        const refDoc = await Matiere.findById(el);
        if (!refDoc) {
          throw new Error(`Referenced document not found for objectId: ${el}`);
        }
        return refDoc;
      })
    );
    next();
  } catch (error) {
    next(error);
  }
});
professeurSchema.post("findOneAndDelete", async function (professeur) {
  console.log(" professeur remove midleweere work ....................");
  const Cours = require("./cours");
  const Emploi = require("./emploi");
  let message = `Successfully deleted professeur : ${professeur.nom}  ${professeur.prenom}  with all his [ cours, emploi] ...`;
  await Cours.deleteMany({ professeur: professeur._id });
  await Emploi.deleteMany({ professeur: professeur._id });
  professeur.nom = message;
});
professeurSchema.methods.getInformation = async function () {
  const Cours = require("./cours");
  const prof_cours = await Cours.find({
    professeur: this._id,
    isSigned: "YES",
  });
  let nbh = 0;
  let th = 0;
  let nbc = 0;
  let somme = 0;
  for (x of prof_cours) {
    let cours_info = await x.getInformation();
    nbh = cours_info[5] + nbh;
    th = cours_info[6] + th;
    nbc = nbc + 1;
    somme = cours_info[7] + somme;
  }
  return [
    this._id,
    this.nom,
    this.prenom,
    this.email,
    this.mobile,
    nbh,
    th,
    nbc,
    somme.toFixed(2),
  ];
};
professeurSchema.methods.getNomComplet = async function () {
  return this.nom + " " + this.prenom;
};
professeurSchema.methods.getMatieres = async function () {
  const Matiere = require("./matiere");
  const professeur = await this.constructor.findById(this._id);
  let matieres = [];
  for (elem of professeur.matieres) {
    let matiere = await Matiere.findById(elem);
    let matiere_info = await matiere.getInformation();
    let data = {
      _id: matiere._id,
      name: matiere.name,
      description: matiere.description,
      numero: matiere.numero,
      prix: matiere_info[3],
      code: matiere_info[2],
    };
    matieres.push(data);
  }
  return matieres;
};
module.exports = mongoose.model("Professeur", professeurSchema);
