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
  const paiements = await features.query;

  /* for (elem of paiements_list) {
    let professeur = await Professeur.findById(elem.professeur);
    let prof_info = await professeur.getInfo_Nbh_TH_Nbc_Somme();
    let data = {
      _id: elem._id,
      date: elem.date,
      fromDate: elem.fromDate,
      toDate: elem.toDate,
      nbh: elem.nbh,
      nbc: elem.nbc,
      th: elem.th,
      totalMontant: elem.totalMontant,
      status: elem.status,
      confirmation: elem.confirmation,
      professeur: prof_info[0],
      nomComplet: prof_info[1] + " " + prof_info[2],
      email: prof_info[2],
      mobile: prof_info[3],
      banque: prof_info[4],
      accountNumero: prof_info[5],
    };
    paiements.push(data);
  } */
  res.status(200).json({
    status: "success",
    paiements,
  });
});

// 3) Create new paiement
exports.addPaiement = catchAsync(async (req, res, next) => {
  const data = req.body;
  const paiement_prof = await Paiement.findOne({
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
  }
  const paiement = await Paiement.create(data);
  const filter = {
    date: { $gte: req.body.fromDate, $lte: req.body.toDate },
    professeur: data.professeur,
    isSigned: "oui",
    isPaid: "pas encore",
  };
  let up_cours = await Cours.updateMany(filter, {
    $set: { isPaid: "préparée" },
  });

  res.status(200).json({
    status: "success",
    message: `La facture de paiement est crée et envoié a la professeur corespondant ...`,
    paiement,
  });
});
// 4) Edit a paiement
exports.updatePaiement = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const data = req.body;
  const paiement_prof = await Paiement.findOne({
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
  }
  const paiement = await Paiement.findByIdAndUpdate(id, data, {
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
      new AppError("Aucun object trouvé avec cet identifiant !", 404)
    );
  }
  const filter = {
    date: { $gte: paiement.fromDate, $lte: paiement.toDate },
    professeur: paiement.professeur,
    isSigned: "oui",
    isPaid: "préparée",
  };
  let up_cours = await Cours.updateMany(filter, {
    $set: { isPaid: "pas encore" },
  });
  const deleted_paiement = await Paiement.findOneAndDelete({ _id: id });
  res.status(200).json({
    status: "success",
    message: `Le paiement est suprimé avec succéss`,
    paiement,
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
