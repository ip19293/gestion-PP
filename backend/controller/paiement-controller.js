const mongoose = require("mongoose");
const APIFeatures = require("../utils/apiFeatures");
const Paiement = require("../models/paiement");
const Cours = require("../models/cours");
const Professeur = require("../models/professeur");
const User = require("../auth/models/user");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const professeur = require("../models/professeur");
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
  let paiements_vide = await Paiement.find({ confirmation: "en attente" });
  res.status(200).json({
    status: "success",
    nb_vide: paiements_vide.length,
    paiements,
  });
});
/*  1)============================= terminner ======================================================*/
exports.terminnation = catchAsync(async (req, res, next) => {
  //change cours status

  const features = new APIFeatures(Paiement.find(), req.query);
  const paiementsData = await features.query;
  const liste = paiementsData.map((paiement) => ({
    ...paiement.toObject(),

    professeur: paiement.professeur ? paiement.professeur._id : null,
    nomComplet: paiement.professeur.user
      ? paiement.professeur.user.nom + " " + paiement.professeur.user.prenom
      : null,
    banque: paiement.professeur ? paiement.professeur.banque : null,
    accountNumero: paiement.professeur
      ? paiement.professeur.accountNumero
      : null,

    _id: undefined,
    professeur: undefined,
    nbh: undefined,
    nbc: undefined,
    th: undefined,
    __v: undefined,
    fromDate: undefined,
    toDate: undefined,
    date: undefined,
    createdAt: undefined,
    updatedAt: undefined,
    status: undefined,
    confirmation: undefined,
  }));

  res.status(200).json({
    status: "success",
    liste,
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
  const data = req.body.ids;
  let matchQuery =
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
  if (Array.isArray(data)) {
    const objectIds = data.map((id) => new mongoose.Types.ObjectId(id));
    matchQuery.professeur = { $in: objectIds };
  }

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
        first_cours_date: { $min: "$date" },
        last_cours_date: { $max: "$date" },
        fromDate: {
          $min: {
            $cond: [
              { $eq: [req.body.debit, undefined] },
              "$date",
              new Date(req.body.debit),
            ],
          },
        },
        toDate: {
          $max: {
            $cond: [
              { $eq: [req.body.fin, undefined] },
              "$date",
              new Date(req.body.fin),
            ],
          },
        },
        nbc: { $sum: 1 },
        nbh: { $sum: "$nbh" },
        somme: { $sum: "$somme" },
        nombresProfesseurs: { $addToSet: "$professeur" },
      },
    },
    {
      $project: {
        _id: 0,
        fromDate: 1,
        toDate: 1,
        nombresProfesseurs: { $size: "$nombresProfesseurs" },
        nbc: 1,
        nbh: 1,
        somme: 1,
        first_cours_date: 1,
        last_cours_date: 1,
        days: {
          $divide: [
            {
              $subtract: ["$toDate", "$fromDate"],
            },
            1000 * 60 * 60 * 24,
          ],
        },
        weeks: {
          $divide: [
            {
              $subtract: ["$toDate", "$fromDate"],
            },
            1000 * 60 * 60 * 24 * 7,
          ],
        },
        months: {
          $divide: [
            {
              $subtract: ["$toDate", "$fromDate"],
            },
            1000 * 60 * 60 * 24 * 30,
          ],
        },
      },
    },
  ]);

  res.status(200).json({
    status: "success",
    info: result[0],
  });
});
// 4) Create many paiements ---------------------------------------------------------------------------------------
exports.addManyPaiements = catchAsync(async (req, res, next) => {
  const data = req.body.ids;
  let new_add = false;
  if (!Array.isArray(data)) {
    return next(new AppError("Aucun professeur n'est selectionner  !", 404));
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
            nbc: resultat[0].nbc,
            nbh: resultat[0].nbh,
            th: resultat[0].th,
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
      ? { professeur: id, confirmation: "en attente" }
      : { professeur: id, confirmation: "accepté" };
  const paiements = await Paiement.find(query);
  res.status(200).json({
    status: "success",
    paiements,
  });
});

// 6) comfirmation par professeur dun paiement
exports.Confirmation = catchAsync(async (req, res, next) => {
  let message = "";
  const id = req.params.id;
  if (
    req.body.refuse !== undefined &&
    (req.body.message == undefined || req.body.message === "")
  ) {
    return next(new AppError("Il fout un texte justifiant le refus !", 404));
  }

  let query =
    req.body.refuse !== undefined
      ? { confirmation: "refusé", message: req.body.message }
      : {
          confirmation: "accepté",
          status: "validé",
          message: "ok",
        };
  if (id != undefined) {
    let paiement = await Paiement.findById(id);
    if (!paiement) {
      return next(new AppError("Aucun object trouvé avec cet ID !", 404));
    }
    paiement = await Paiement.findByIdAndUpdate(id, query, {
      new: true,
      runValidators: true,
    });
    message =
      req.body.refuse !== undefined
        ? "Le paiement est refusé avec succés ."
        : `Le paiement est validé avec succés .`;
  } else {
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() - 7);
    const paiements_expirer = await Paiement.find({
      date: { $lte: currentDate },
    });

    await Paiement.updateMany(
      { confirmation: "vide", date: { $lte: currentDate } },
      query,
      {
        new: true,
        runValidators: true,
      }
    );
    const paiements = await Paiement.find({ date: { $gt: currentDate } });
    if (paiements_expirer.length == 0) {
      return next(
        new AppError(
          `Les paiements ne peuvent pas etre valide pas l'admin avant l'expiration du délai !`,
          404
        )
      );
    }
    if (paiements.length > 0) {
      message = `La confirmation de ${paiements_expirer.length} paiements avec succés , le  ${paiements.length} outre n'est peux pas etre confirmer pas l'admin avant l'expiration du délai !`;
      /*    return next(
        new AppError(
          `Il ya  ${paiements.length} paiements n'est peux pas etre valide pas l'admin avant l'expiration du délai !`,
          404
        )
      ); */
    } else {
      message = `Les paiements sont validé avec succés .`;
    }
  }

  res.status(200).json({
    status: "succès",
    message: message,
  });
});
exports.Statistique = catchAsync(async (req, res, next) => {
  const users = await User.find();
  const active_users = await User.find({ active: true });
  let id = req.params.id;
  let cours_news = await Cours.find({
    isSigned: "en attente",
  });
  let paiement_news = await Paiement.find({ confirmation: "en attente" });
  let cours_effectue = await Cours.find({ isSigned: "effectué" });
  let paiement_effectue = await Paiement.find({ confirmation: "accepté" });
  if (id != undefined) {
    cours_news = await Cours.find({
      isSigned: "en attente",
      professeur: id,
    });
    paiement_news = await Paiement.find({
      confirmation: "en attente",
      professeur: id,
    });
    cours_effectue = await Cours.find({ isSigned: "effectué", professeur: id });
    paiement_effectue = await Paiement.find({
      confirmation: "accepté",
      professeur: id,
    });
  }
  res.status(201).json({
    status: "success",
    users: users.length,
    active_users: active_users.length,
    cours_en_attente: cours_news.length,
    cours_effectue: cours_effectue.length,
    paiement_effectue: paiement_effectue.length,
    paiement_en_attente: paiement_news.length,
  });
});
/* -----------------------------------------------------FONCTIONS------------------------ */
