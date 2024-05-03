const APIFeatures = require("../utils/apiFeatures");
const Paiement = require("../models/paiement");
const Cours = require("../models/cours");
const Professeur = require("../models/professeur");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const filterOb = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  c;
  return newObj;
};
/*  1)============================= get All paiement ======================================================*/
exports.getPaiements = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Paiement.find(), req.query);
  const paiementsData = await features.query;
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
  res.status(200).json({
    status: "success",
    paiements,
  });
});

// 3) Create new paiement
exports.addPaiement = catchAsync(async (req, res, next) => {
  const professeur = await Professeur.findById(req.body.professeur);
  if (!professeur) {
    return next(
      new AppError("Aucune enseignant trouvée avec cet identifiant !", 404)
    );
  }
  const old_paiement = await Paiement.findOne({ professeur: professeur._id });
  const resultat = await professeur.paiementTotalResultats(
    req.body.fromDate,
    req.body.toDate
  );

  if (resultat.length == 0) {
    return next(
      new AppError(
        "Le paiement n'est pas  ajouter ,il peut etre vide ou existe déja !",
        404
      )
    );
  }
  if (old_paiement && old_paiement.status != "terminé") {
    return next(
      new AppError(
        "Le paiement n'est pas  ajouter ,car le professeur a des paiements non terminer !",
        404
      )
    );
  }
  let paiement_data = {
    fromDate: resultat[0].fromDate,
    toDate: resultat[0].toDate,
    professeur: resultat[0].professeur,
    somme: resultat[0].somme,
    nbh: resultat[0].nbh,
    nbc: resultat[0].nbc,
    th: resultat[0].th,
  };

  const new_paiement = await Paiement.create(paiement_data);
  res.status(200).json({
    status: "success",
    message: `Le paiement est crer avec succéss .`,
    new_paiement,
  });
});
// 4) Get payement informatiom ---------------------------------------------------------------------------------------
exports.getInformation = catchAsync(async (req, res, next) => {
  const matchQuery =
    req.body.debit !== undefined && req.body.fin !== undefined
      ? {
          date: {
            $gte: new Date(req.body.debit),
            $lte: new Date(req.body.fin),
          },
          isSigned: "effectué",
          isPaid: "en attente",
        }
      : {
          isSigned: "effectué",
          isPaid: "en attente",
        };

  const result = await Cours.aggregate([
    {
      $match: matchQuery,
    },
    {
      $lookup: {
        from: "professeurs",
        localField: "professeur",
        foreignField: "_id",
        as: "professeurData",
      },
    },
    { $unwind: "$professeurData" },
    {
      $lookup: {
        from: "users",
        localField: "professeurData.user",
        foreignField: "_id",
        as: "userData",
      },
    },
    { $unwind: "$userData" },
    {
      $group: {
        _id: null,
        fromDate: {
          $first:
            req.body.debit !== undefined ? req.body.debit : { $min: "$date" },
        },
        toDate: {
          $first: req.body.fin !== undefined ? req.body.fin : { $max: "$date" },
        },
        first_cours_date: { $min: "$date" },
        last_cours_date: { $max: "$date" },
        nbc: { $sum: 1 },
        nbh: { $sum: "$nbh" },
        somme: { $sum: "$somme" },
        nombresProfesseurs: {
          $push: {
            prof_id: "$professeur",
          },
        },
      },
    },
  ]);
  /*   let info = {
    fromDate: firstCoursDate,
    toDate: lastCoursDate,
    months: monthDifference,
    weeks: remainingWeeksAfterMonths,
    days: remainingDaysAfterWeeks,
    nombresProfesseurs,
    somme,
    nbc,
  }; */
  res.status(200).json({
    status: "success",
    result,
  });
});
// 4) Create many paiements ---------------------------------------------------------------------------------------
exports.addManyPaiements = catchAsync(async (req, res, next) => {
  const data = req.body.ids;
  let new_add = false;
  if (!Array.isArray(data)) {
    //return next(new AppError("Aucun professeur n'est selectionner  !", 404));
  }
  for (let prof_id of data) {
    let professeur = await Professeur.findById(prof_id);
    if (professeur) {
      let resultat = await professeur.paiementTotalResultats(
        req.body.fromDate,
        req.body.fin
      );
      if (resultat.length != 0) {
        let old_paiement = await Paiement.findOne({ professeur: prof_id });
        if (!old_paiement || old_paiement.status == "terminé") {
          let paiement = await Paiement.create({
            fromDate: resultat[0].fromDate,
            toDate: resultat[0].toDate,
            somme: resultat[0].somme,
            professeur: resultat[0].professeur,
          });
          if (paiement) {
            new_add = true;
          }
        }
      }
    }
  }

  let message = new_add
    ? "Des nouvelles factures de paiement sont crée et envoié vers les professeurs corespondant ."
    : "Pas des nouvelles factures de paiement sont crer !";

  res.status(200).json({
    status: "success",
    message,
  });
});
// 4) Edit a paiement
exports.updatePaiement = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const data = req.body;
  /*   const paiement_prof = await Paiement.findOne({
    _id: { $ne: id },
    professeur: req.body.professeur,
    fromDate: req.body.fromDate,
    toDate: req.body.toDate,
  });
  if (paiement_prof) {
    return next(
      new AppError(
        "Intersection de la période de début ou de fin avec une autre",
        404
      )
    );
  } */
  const paiement = await Paiement.findOneAndUpdate({ _id: id }, data, {
    new: true,
    runValidators: true,
  });
  if (!paiement) {
    return next(
      new AppError("Aucun object trouvé avec cet identifiant !", 404)
    );
  }
  res.status(201).json({
    status: "success",
    paiement,
  });
});
// 5) Remove a paiement

exports.deletePaiement = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const paiement = await Paiement.findById(id);
  if (!paiement) {
    return next(
      new AppError("Aucun paiement n'est trouver avec cet identifiant !", 404)
    );
  }
  const deleted_paiement = await Paiement.findOneAndDelete({ _id: id });
  res.status(200).json({
    status: "success",
    message: `Le paiement est suprimé avec succéss`,
  });
});
// 6) get paiement By ID
exports.getPaiementById = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const paiement = await Paiement.findById(id);
  if (!paiement) {
    return next(new AppError("Aucun object trouvé avec cet ID !", 404));
  }
  res.status(200).json({
    status: "success",
    paiement,
  });
});
// 6) get professeur paiements
exports.getPaiementsByProfesseurId = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const professeur = await Professeur.findById(id);
  if (!professeur) {
    return next(new AppError("Aucun object trouvé avec cet ID !", 404));
  }
  let query =
    req.body.notification !== undefined
      ? { professeur: id, confirmation: "vide" }
      : { professeur: id, confirmation: "accepté" };
  const paiements = await Paiement.find(query);
  res.status(200).json({
    status: "success",
    paiements,
  });
});

// 6) comfirmation par professeur dun paiement
exports.Validation = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  let paiement = await Paiement.findById(id);
  if (!paiement) {
    return next(new AppError("Aucun object trouvé avec cet ID !", 404));
  }
  let auery =
    req.body.refuse !== undefined
      ? { confirmation: "refusé" }
      : {
          confirmation: "accepté",
          status: "validé",
        };
  let message =
    req.body.refuse !== undefined
      ? "Le paiement est refusé avec succés ."
      : "Le paiement est validé avec succés .";
  paiement = await Paiement.findByIdAndUpdate(id, auery, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "succès",
    message: message,
    paiement,
  });
});

/* -----------------------------------------------------FONCTIONS------------------------ */
