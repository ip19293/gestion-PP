const mongoose = require("mongoose");
const Matiere = require("../models/matiere");
const User = require("../auth/models/user");
const professeurSchema = mongoose.Schema(
  {
    nomComplet: {
      type: String,
      required: [true, "Le nom complet est requis !"],
      select: true,
    },

    mobile: {
      type: Number,
      required: [true, "Numero telephonne est requis !"],
      unique: true,
    },
    email: {
      type: String,
      required: [true, "email est requis !"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    matieres: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "Matiere",
      },
    ],
    banque: {
      type: String,
      default: "BMCI",
    },

    accountNumero: {
      type: Number,
      unique: true,
    },

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
          throw new Error(
            `Aucun document reference trouvé pour cet identifiant: ${el}`
          );
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
  let message = `L'eneignant : ${professeur.nomComplet} est suupprimé  et ces [ cours, emploi] avec succés .`;
  await Cours.deleteMany({ professeur: professeur._id });
  await Emploi.deleteMany({ professeur: professeur._id });
  professeur.nomComplet = message;
});
professeurSchema.methods.getInformation = function () {
  return [
    this._id,
    this.nomComplet,
    this.email,
    this.mobile,
    this.banque,
    this.accountNumero,
  ];
};
professeurSchema.methods.getPaiementInfo = async function () {
  const Cours = require("./cours");
  const professeur = await this.constructor.findById(this._id);
  const prof_info = await professeur.getInformation();
  const prof_cours = await Cours.find({
    professeur: this._id,
    isSigned: "oui",
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
    prof_info[0],
    prof_info[1],
    prof_info[2],
    prof_info[3],
    prof_info[4],
    prof_info[5],
    nbh,
    th,
    nbc,
    somme,
  ];
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
      categorie: matiere_info[1],
      numero: matiere.numero,
      prix: matiere_info[3],
      code: matiere_info[2],
    };
    matieres.push(data);
  }
  return matieres;
};
module.exports = mongoose.model("Professeur", professeurSchema);
