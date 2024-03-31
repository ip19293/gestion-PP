const mongoose = require("mongoose");
const Element = require("../models/element");
const User = require("../auth/models/user");

const professeurSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      unique: true,
      required: [true, "Utilisateur ID est requis !"],
    },
    banque: {
      type: String,
      required: true,
      default: "BMCI",
    },
    accountNumero: {
      type: String,
      unique: true,
      required: true,
      maxLength: [
        20,
        "Le numéro de compte doit avoir une longueur moin de 20 chiffres ",
      ],
      minLength: [
        10,
        "Le numéro de compte doit avoir une longueur  plus ou egale a 10 chiffres ",
      ],
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
  },

  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
//POPULATE FIND QUERY ---------------------------------------------------
professeurSchema.pre(/^find/, function (next) {
  /*   this.populate([
    {
      path: "user",
      select: "-__v",
    },
  ]); */

  next();
});
//SAVE MIDLEWEERE --------------------------------------------------------
professeurSchema.pre("save", async function (next) {
  const user = await User.findById(this.user);
  this.nom = user.nom;
  this.prenom = user.prenom;
  /*  const unqRef = [...new Set(this.elements.map(String))];
  if (this.elements.length !== unqRef.length) {
    const error = new Error(
      "ID d'objets en double dans les matière référence !"
    );
    return next(error);
  }
  try {
    const existe_matiere = await Promise.all(
      this.elements.map(async (el) => {
        const refDoc = await Element.findById(el);
        if (!refDoc) {
          throw new Error(
            `Aucun document reference trouvé pour cet identifiant: ${el} !`
          );
        }
        return refDoc;
      })
    );
  } catch (error) {
    console.log(error.message);
  } */

  next();
});
// POST SAVE MIDLEWEERE ==============================================================================
professeurSchema.post("save", async function (professeur, next) {
  const Cours = require("./cours");
  await Cours.updateMany(
    {
      professeur: professeur._id,
    },
    { enseignant: professeur.nom + " " + professeur.prenom }
  );
  next();
});
//FIND ONE AND DELETE MIDLEWEERE --------------------------------------------------------
professeurSchema.post("findOneAndDelete", async function (professeur) {
  console.log(" professeur remove midleweere work ....................");
  const Cours = require("./cours");
  const Emploi = require("./emploi");
  const Element = require("./element");
  const Paiement = require("./paiement");
  let message = `L'eneignant(e) : ${professeur.nom}  ${professeur.prenom} est suupprimé  et ces [ cours, emploi] avec succés .`;
  await Cours.deleteMany({ professeur: professeur._id });
  await Emploi.deleteMany({ professeur: professeur._id });
  await Paiement.deleteMany({ professeur: professeur._id });
  await Element.updateMany({
    $pull: {
      professeurCM: professeur._id,
      professeurTD: professeur._id,
      professeurTP: professeur._id,
    },
  });
  professeur.nom = message;
});
// SET NBC NBH SOMME METHOD -------------------------------------------------------------------------------------------
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
//GET NBH TH NBC SOMME BETWEEN TO TIMPS-------------------------------------------------------------------
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
// GET DETAIL NBC NBH TH SOMME BETWEEN DEBIT AND FIN ---------------------------------------------------------------
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
              },
              /*     date: { $addToSet: "$date" }, */
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
  let date_info = professeur
    ? await professeur.getDebitDate_FinDate(debit, fin)
    : {};
  let data = {
    cours,
    date: date_info,
  };

  return data;
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
        { professeurCM: { $in: [this._id] } },
        { professeurTP: { $in: [this._id] } },
        { professeurTD: { $in: [this._id] } },
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
/* ------------------------------------------------------------CREATE PAIEMENT ---------------------------- */
professeurSchema.methods.getPaiementData = async function (from, to) {
  const professeur = await this.constructor.findById(this._id);
  let prof_detail = await professeur.DetailNBH_TH_Nbc_Somme(from, to);
  let data = prof_detail.cours[0].total[0];
  if (data) {
    let dt = {
      professeur: professeur._id,
      fromDate: prof_detail.date.debit,
      toDate: prof_detail.date.fin,
      totalMontant: data.SOMME,
      nbc: data.NBC,
      nbh: data.NBH,
      th: data.TH,
    };
    //console.log(dt);
    return dt;
  }
};
module.exports = mongoose.model("Professeur", professeurSchema);
