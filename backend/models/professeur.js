const mongoose = require("mongoose");
const Matiere = require("../models/matiere");
const User = require("../auth/models/user");
const professeurSchema = mongoose.Schema(
  {
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
      unique: true,
      required: [true, "Utilisateur ID est requis !"],
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
    const error = new Error(
      "ID d'objets en double dans les matière référence !"
    );
    return next(error);
  }
  try {
    const existe_matiere = await Promise.all(
      this.matieres.map(async (el) => {
        const refDoc = await Matiere.findById(el);
        if (!refDoc) {
          throw new Error(
            `Aucun document reference trouvé pour cet identifiant: ${el} !`
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

professeurSchema.methods.getInfo_Nbh_TH_Nbc_Somme = async function (
  debit,
  fin
) {
  const user = await User.findById(this.user);
  let debitDate = new Date(debit);
  let finDate = new Date(fin);
  const Cours = require("./cours");
  const query =
    debit !== undefined && fin !== undefined
      ? {
          date: { $gte: debitDate, $lte: finDate },
          professeur: this._id,
          isSigned: "oui",
          isPaid: "pas encore",
        }
      : { professeur: this._id, isSigned: "oui", isPaid: "pas encore" };
  const prof_cours = await Cours.find(query);
  let nbh = 0;
  let th = 0;
  let nbc = 0;
  let somme = 0;
  if (prof_cours.length != 0) {
    debitDate = prof_cours[0].date;
    finDate = prof_cours[prof_cours.length - 1].date;
  }
  for (x of prof_cours) {
    let cours = await Cours.findById(x._id);
    let cours_info = await x.getTHSomme();
    nbh = x.nbh + nbh;
    th = cours_info[0] + th;
    nbc = nbc + 1;
    somme = cours_info[1] + somme;
  }
  return [
    this._id,
    user.nom,
    user.prenom,
    user.email,
    user.mobile,
    this.banque,
    this.accountNumero,
    nbh,
    th,
    nbc,
    somme,
    debitDate,
    finDate,
  ];
};
professeurSchema.methods.getMatieres = async function () {
  const Matiere = require("./matiere");
  const professeur = await this.constructor.findById(this._id);
  let matieres = [];
  for (elem of professeur.matieres) {
    let matiere = await Matiere.findById(elem);
    let matiere_info = await matiere.getCodePrixCNameCCode();
    let data = {
      _id: matiere._id,
      name: matiere.name,
      categorie: matiere_info[2],
      numero: matiere.numero,
      prix: matiere_info[1],
      code: matiere_info[0],
    };
    matieres.push(data);
  }
  return matieres;
};
module.exports = mongoose.model("Professeur", professeurSchema);
