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
professeurSchema.methods.setNBC_NBH_SOMME = async function (cours, option) {
  const professeur = await this.constructor.findById(this._id);
  let cours_info = await cours.getTHSomme();
  if (option === undefined || option === "add") {
    professeur.nbh =
      professeur.nbh >= 0 ? professeur.nbh + cours.nbh : professeur.nbh;
    professeur.nbc = professeur.nbc >= 0 ? professeur.nbc + 1 : professeur.nbc;
    professeur.somme =
      professeur.somme >= 0
        ? professeur.somme + cours_info[1]
        : professeur.somme;
  } else {
    professeur.nbh =
      professeur.nbh > 0 ? professeur.nbh - cours.nbh : professeur.nbh;
    professeur.nbc = professeur.nbc > 0 ? professeur.nbc - 1 : professeur.nbc;
    professeur.somme =
      professeur.somme > 0
        ? professeur.somme - cours_info[1]
        : professeur.somme;
  }

  await professeur.save();
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
          isSigned: "effectué",
          isPaid: "en attente",
        }
      : { professeur: this._id, isSigned: "effectué", isPaid: "en attente" };
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
            isSigned: "effectué",
            isPaid: "en attente",
          },
        }
      : {
          $match: {
            professeur: new mongoose.Types.ObjectId(this._id),
            isSigned: "effectué",
            isPaid: "en attente",
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
/* -----------------------------------------------------------get professeur matieres method------------------------------- */
professeurSchema.methods.getMatieres = async function () {
  const Matiere = require("./matiere");
  const professeur = await this.constructor.findById(this._id);
  let matieres = [];
  for (elem of professeur.matieres) {
    try {
      let matiere = await Matiere.findById(elem);
      let matiere_info = await matiere.getCodePrixCNameCCode();
      let dt = {
        _id: matiere._id,
        name: matiere.name,
        prix: matiere_info[1],
        categorie: matiere_info[2],
        code: matiere_info[0],
      };
      matieres.push(dt);
    } catch (error) {}
  }
  return matieres;
};
/* ----------------------------------------------------------get professeur elements method------------------------------------ */
professeurSchema.methods.getElements = async function (type) {
  const Element = require("./element");
  const professeur = await this.constructor.findById(this._id);
  let elements = [];
  if (type != undefined) {
    let profCT = "professeur" + type;
    const query = {};
    query[profCT] = { $in: [professeur._id] };
    elements = await Element.find(query);
  } else {
    elements = await Element.find({
      $or: [
        { professeurCM: { $in: [professeur._id] } },
        { professeurTP: { $in: [professeur._id] } },
        { professeurTD: { $in: [professeur._id] } },
      ],
    });
  }

  return elements;
};
professeurSchema.methods.getEmplois = async function () {
  const Emploi = require("../models/emploi");
  const daysOfWeek = [
    "lundi",
    "mardi",
    "mercredi",
    "jeudi",
    "vendredi",
    "samedi",
    "dimanche",
  ];
  let emplois_temp = [];
  const emplois = await Emploi.aggregate([
    {
      $match: {
        professeur: new mongoose.Types.ObjectId(this._id),
      },
    },
    {
      $addFields: {
        hour: {
          $toInt: {
            $arrayElemAt: [{ $split: ["$startTime", ":"] }, 0],
          },
        },
        minute: {
          $toInt: {
            $arrayElemAt: [{ $split: ["$startTime", ":"] }, 1],
          },
        },
      },
    },
    {
      $sort: {
        dayNumero: -1,
        hour: 1,
        minute: 1,
      },
    },
    {
      $group: {
        _id: "$jour", // Field to group by
        documents: { $push: "$$ROOT" }, // Push each document into an array
      },
    },
    /*    {
      $project: {
        jour: "$_id", // Rename _id to groupName
        documents: 1, // Include the documents array
        _id: 0, // Exclude _id field
      },
    }, */
  ]).then((groups) => {
    const result = daysOfWeek.map((day) => {
      const documents =
        groups.find((group) => group._id === day)?.documents || [];
      return { [day]: documents };
    });
    emplois_temp = result;
    console.log(result); // Result containing an array of objects, each object representing documents for a specific day
  });

  return emplois_temp;
};
module.exports = mongoose.model("Professeur", professeurSchema);
