const mongoose = require("mongoose");
const Matiere = require("../models/matiere");
const User = require("../auth/models/user");
const matiere = require("../models/matiere");
const professeurSchema = mongoose.Schema(
  {
    matieres: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "Matiere",
      },
    ],
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      unique: true,
      required: [true, "Utilisateur ID est requis !"],
    },
    info: {
      mobile: Number,
      accountNumero: Number,
      banque: String,
    },
    nbh: {
      type: Number,
      default: 0,
    },
    /*   th: {
      type: Number,
      default: 0,
    }, */
    nbc: {
      type: Number,
      default: 0,
    },
    somme: {
      type: Number,
      default: 0,
    },
    nom: { type: String, lowercase: true },
    prenom: { type: String, lowercase: true },
    email: { type: String, lowercase: true },
  },

  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
professeurSchema.pre("save", async function (next) {
  const user = await User.findById(this.user);
  this.nom = user.nom;
  this.prenom = user.prenom;
  this.email = user.email;
  this.info.mobile = user.mobile;
  this.info.banque = user.banque;
  this.info.accountNumero = user.accountNumero;
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
professeurSchema.post("findOneAndDelete", async function (professeur, user) {
  console.log(" professeur remove midleweere work ....................");
  const Cours = require("./cours");
  const Emploi = require("./emploi");

  let message = `L'eneignant(e) : ${user.nom}  ${user.prenom} est suupprimé  et ces [ cours, emploi] avec succés .`;
  await Cours.deleteMany({ professeur: professeur._id });
  await Emploi.deleteMany({ professeur: professeur._id });
  professeur._id = message;
});
professeurSchema.methods.getUserInformation = async function () {
  const user = await User.findById(this.user);
  return user;
};
/* -------------------------------------------------------------------GET NBH TH NBC SOMME ----------------------------------------- */
professeurSchema.methods.getDebitDate_FinDate = async function (debit, fin) {
  const Cours = require("./cours");
  let debitDate = new Date(debit);
  let finDate = new Date(fin);
  const query =
    debit !== undefined && fin !== undefined
      ? {
          date: { $gte: debitDate, $lte: finDate },
          professeur: this._id,
          isSigned: "oui",
          isPaid: "pas encore",
        }
      : { professeur: this._id, isSigned: "oui", isPaid: "pas encore" };
  const prof_cours = await Cours.find(query).sort({ date: 1 });
  debitDate = prof_cours.length != 0 ? prof_cours[0].date : new Date();
  finDate =
    prof_cours.length != 0
      ? prof_cours[prof_cours.length - 1].date
      : new Date();
  let data = {
    debit: debitDate,
    fin: finDate,
  };

  return data;
};
/* ------------------------------------------------------------------------------GET DETAIL NBC NBH TH SOMME------------------------------- */
professeurSchema.methods.DetailNBH_TH_Nbc_Somme = async function (debit, fin) {
  const Cours = require("./cours");
  const professeur = await this.constructor.findById(this._id);
  let debitDate = new Date(debit);
  let finDate = new Date(fin);
  const queryMatch =
    debit !== undefined && fin !== undefined
      ? {
          $match: {
            date: { $gte: debitDate, $lte: finDate },
            professeur: new mongoose.Types.ObjectId(this._id),
            isSigned: "oui",
            isPaid: "pas encore",
          },
        }
      : {
          $match: {
            professeur: new mongoose.Types.ObjectId(this._id),
            isSigned: "oui",
            isPaid: "pas encore",
          },
        };
  // data: { $push: "$$ROOT" },
  const cours = await Cours.aggregate([
    queryMatch,
    {
      $facet: {
        matiere: [
          {
            $group: {
              _id: {
                element: "$element",
                matiere: "$matiere",
                prix: "$prix",
              },
              /*         date: { $addToSet: "$date" }, */
              nbh: { $sum: "$nbh" },
              th: { $sum: "$th" },
              somme: { $sum: "$somme" },
              nbc: { $sum: 1 },
            },
          },
        ],
        total: [
          {
            $group: {
              _id: null, // Group all documents
              NBH: { $sum: "$nbh" },
              TH: { $sum: "$th" },
              NBC: { $sum: 1 },
              SOMME: { $sum: "$somme" },
            },
          },
        ],
      },
    },
  ]).sort({ date: 1 });
  let date_info = await professeur.getDebitDate_FinDate(debit, fin);
  let data = {
    cours,
    date: date_info,
  };

  return data;
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
