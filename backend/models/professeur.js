const mongoose = require("mongoose");

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
  },

  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//POPULATE FIND QUERY ---------------------------------------------------
professeurSchema.pre(/^find/, function (next) {
  this.populate([
    {
      path: "user",
      select: "-__v",
    },
  ]);

  next();
});

//FIND ONE AND DELETE MIDLEWEERE --------------------------------------------------------
professeurSchema.post("findOneAndDelete", async function (professeur) {
  console.log(" professeur remove midleweere work ....................");
  const Cours = require("./cours");
  const Emploi = require("./emploi");
  const Element = require("./element");
  const Paiement = require("./paiement");
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
});

//GET resultat total of professeur between debit and fin date -----------------------
professeurSchema.methods.paiementTotalResultats = async function (debit, fin) {
  const Cours = require("./cours");
  const queryMatch = queryFilter(this._id, debit, fin);
  const cours = await Cours.aggregate([
    { $match: queryMatch },
    {
      $lookup: {
        from: "elements",
        localField: "element",
        foreignField: "_id",
        as: "elementData",
      },
    },
    { $unwind: "$elementData" },
    {
      $group: {
        _id: null,
        fromDate: {
          $min: {
            $cond: [{ $eq: [debit, undefined] }, "$date", new Date(debit)],
          },
        },
        toDate: {
          $max: {
            $cond: [{ $eq: [fin, undefined] }, "$date", new Date(fin)],
          },
        },
        first_cours_date: { $min: "$date" },
        last_cours_date: { $max: "$date" },
        nbc: { $sum: 1 },
        nbh: { $sum: "$nbh" },
        th: { $sum: "$th" },
        somme: { $sum: "$somme" },
        professeur: { $first: "$professeur" },
      },
    },
  ]);

  return cours;
};
//GET resultat total group by element of professeur between debit and fin date -----
professeurSchema.methods.paiementDetailResultats = async function (debit, fin) {
  const Cours = require("./cours");
  const queryMatch = queryFilter(this._id, debit, fin);
  const cours = await Cours.aggregate([
    { $match: queryMatch },
    {
      $lookup: {
        from: "elements",
        localField: "element",
        foreignField: "_id",
        as: "elementData",
      },
    },
    { $unwind: "$elementData" },
    {
      $lookup: {
        from: "categories",
        localField: "elementData.categorie",
        foreignField: "_id",
        as: "categorieData",
      },
    },
    { $unwind: "$categorieData" },
    {
      $facet: {
        matieres: [
          {
            $group: {
              _id: "$element",
              fromDate: { $min: "$date" },
              toDate: { $max: "$date" },
              nbc: { $sum: 1 },
              nbh: { $sum: "$nbh" },
              th: { $sum: "$th" },
              somme: { $sum: "$somme" },
              element: { $first: "$elementData._id" },
              name: { $first: "$elementData.name" },
              prix: { $first: "$categorieData.prix" },
            },
          },
        ],
        total: [
          {
            $group: {
              _id: null,
              fromDate: {
                $min: {
                  $cond: [
                    { $eq: [debit, undefined] },
                    "$date",
                    new Date(debit),
                  ],
                },
              },
              toDate: {
                $max: {
                  $cond: [{ $eq: [fin, undefined] }, "$date", new Date(fin)],
                },
              },
              first_cours_date: { $min: "$date" },
              last_cours_date: { $max: "$date" },
              nbc: { $sum: 1 },
              nbh: { $sum: "$nbh" },
              th: { $sum: "$th" },
              somme: { $sum: "$somme" },
            },
          },
        ],
      },
    },
  ]);

  return cours;
};

/* ----------------------------------------------------------get professeur elements method------------------------------------ */
professeurSchema.methods.getElements = async function (type) {
  const Element = require("./element");
  let query = {};
  if (type != undefined) {
    let profCT = "professeur" + type;
    query[profCT] = { $in: [this._id] };
  } else {
    query = {
      $or: [
        { professeurCM: { $in: [this._id] } },
        { professeurTP: { $in: [this._id] } },
        { professeurTD: { $in: [this._id] } },
      ],
    };
  }
  let elements = await Element.aggregate([
    { $match: query },
    {
      $lookup: {
        from: "filieres",
        localField: "filiere",
        foreignField: "_id",
        as: "filiereData",
      },
    },
    { $unwind: "$filiereData" },
    {
      $lookup: {
        from: "categories",
        localField: "categorie",
        foreignField: "_id",
        as: "categorieData",
      },
    },
    { $unwind: "$categorieData" },
    {
      $project: {
        _id: 1,
        name: 1,
        code: 1,
        semestre: 1,
        heuresCM: 1,
        heuresTD: 1,
        heuresTP: 1,
        type: type != undefined ? type : "ALL",
        filiere: "$filiereData.name",
        filiere_id: "$filiereData._id",
        categorie_id: "$categorieData._id",
        prix: "$categorieData.prix",
        CM: 1,
        TP: 1,
        TD: 1,
        professeurCM: 1,
        professeurTP: 1,
        professeurTD: 1,
      },
    },
  ]);

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
      $lookup: {
        from: "filieres",
        localField: "filiere",
        foreignField: "_id",
        as: "filiereData",
      },
    },
    { $unwind: "$filiereData" },
    {
      $lookup: {
        from: "elements",
        localField: "element",
        foreignField: "_id",
        as: "elementData",
      },
    },
    { $unwind: "$elementData" },
    {
      $group: {
        _id: "$jour", // Field to group by
        documents: { $push: "$$ROOT" }, // Push each document into an array
      },
    },
    {
      $project: {
        documents: {
          $map: {
            input: "$documents",
            as: "doc",
            in: {
              _id: "$$doc._id",
              type: "$$doc.type",
              startTime: "$$doc.startTime",
              finishTime: "$$doc.finishTime",
              jour: "$$doc.jour",
              dayNumero: "$$doc.dayNumero",
              nbh: "$$doc.nbh",
              //  hour: "$$doc.hour",
              // minute: "$$doc.minute",
              filiere: "$$doc.filiereData.name",
              niveau: "$$doc.filiereData.niveau",
              description: "$$doc.filiereData.description",
              element: "$$doc.elementData.name",
              semestre: "$$doc.elementData.semestre",
              heuresCM: "$$doc.elementData.heuresCM",
              heuresTP: "$$doc.elementData.heuresTP",
              heuresTD: "$$doc.elementData.heuresTD",
            },
          },
        },
      },
    },
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
//GET ALL PAIEMENTS ---------------------------------------------------------------------
professeurSchema.methods.getPaiements = async function () {
  const Paiement = require("../models/paiement");
  const paiementsData = await Paiement.find({
    professeur: this._id,
    status: { $ne: "terminé" },
  });

  const paiements = paiementsData.map((paiement) => ({
    ...paiement.toObject(),
    professeur: paiement.professeur ? paiement.professeur._id : null,
    nomComplet: paiement.professeur.user
      ? paiement.professeur.user.nom + " " + paiement.professeur.user.prenom
      : null,
    banque: paiement.professeur ? paiement.professeur.banque : null,
    accountNumero: paiement.professeur
      ? paiement.professeur.accountNumero
      : null,
  }));
  return paiements;
};
//GET GROUPE DETAILS -------------------------------------------------
professeurSchema.methods.getGroupDetails = async function () {
  const Cours = require("./cours");
  const cours = await Cours.find({
    professeur: this._id,
    isSigned: "effectué",
  });

  const groupDetails = {};

  const elements = await this.getElements();
  elements.forEach((element) => {
    ["CM", "TP", "TD"].forEach((type) => {
      const hoursField = `heures${type}`;
      const profField = `professeur${type}`;
      element[type].forEach((groupe) => {
        const [profId, profGroupNum, groupNum] = groupe.split("-");
        if (profId === this._id.toString()) {
          if (!groupDetails[profId]) {
            groupDetails[profId] = {
              CM: {
                groups: [],
                totalHours: element.heuresCM,
                completedHours: {},
              },
              TP: {
                groups: [],
                totalHours: element.heuresTP,
                completedHours: {},
              },
              TD: {
                groups: [],
                totalHours: element.heuresTD,
                completedHours: {},
              },
            };
          }

          if (!groupDetails[profId][type].completedHours[groupNum]) {
            groupDetails[profId][type].completedHours[groupNum] = 0;
          }

          groupDetails[profId][type].groups.push(groupNum);
        }
      });
    });
  });

  cours.forEach((cours) => {
    const [profId, profGroupNum, groupNum] = cours.groupe.split("-");
    const type = cours.type;
    // console.log(groupDetails[profId][type].completedHours[groupNum]);

    if (
      groupDetails[profId] &&
      groupDetails[profId][type].completedHours[groupNum] !== undefined
    ) {
      groupDetails[profId][type].completedHours[groupNum] += cours.nbh;
    }
  });

  return groupDetails[this._id.toString()];
};
// functions ----------------------------------------------------------------
const queryFilter = function (professeur, debit, fin) {
  let debitDate = new Date(debit);
  let finDate = new Date(fin);
  const queryMatch =
    debit !== undefined && fin !== undefined
      ? {
          date: { $gte: debitDate, $lte: finDate },
          professeur: professeur,
          isSigned: "effectué",
          isPaid: "en attente",
        }
      : { professeur: professeur, isSigned: "effectué", isPaid: "en attente" };

  return queryMatch;
};
module.exports = mongoose.model("Professeur", professeurSchema);
