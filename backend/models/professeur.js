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
          $first: debit !== undefined ? debit : { $min: "$date" },
        },
        toDate: {
          $first: fin !== undefined ? fin : { $max: "$date" },
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
                $first: debit !== undefined ? debit : { $min: "$date" },
              },
              toDate: {
                $first: fin !== undefined ? fin : { $max: "$date" },
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
      $group: {
        _id: "$_id",
        name: { $first: "$name" },
        semestre: { $first: "$semestre" },
        heuresCM: { $first: "$heuresCM" },
        heuresTD: { $first: "$heuresTD" },
        heuresTP: { $first: "$heuresTP" },
        type: { $first: type != undefined ? type : "ALL" },
        code: { $first: "$code" },
        filiere: { $first: "$filiereData.name" },
        filiere_id: { $first: "$filiereData._id" },
        categorie_id: { $first: "$categorieData._id" },
        prix: { $first: "$categorieData.prix" },
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
