const APIFeatures = require("../utils/apiFeatures");
const Paiement = require("../models/paiement");
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
  const paiements_list = await features.query;
  let paiements = [];
  for (elem of paiements_list) {
    let professeur = await Professeur.findById(elem.professeur);
    let prof_info = await professeur.getInformation();
    let data = {
      _id: elem._id,
      date: elem.date,
      fromDate: elem.fromDate,
      toDate: elem.toDate,
      nbh: elem.nbh,
      nbc: elem.nbc,
      totalMontant: elem.totalMontant,
      status: elem.status,
      confirmation: elem.confirmation,
      professeur: prof_info[0],
      nomComplet: prof_info[1],
      email: prof_info[2],
      mobile: prof_info[3],
      banque: prof_info[4],
      accountNumero: prof_info[5],
    };
    paiements.push(data);
  }
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
  });
  if (
    (paiement_prof.fromDate <= req.body.fromDate &&
      paiement_prof.toDate >= req.body.fromDate) ||
    (paiement_prof.fromDate <= req.body.toDate &&
      paiement_prof.toDate >= req.body.toDate)
  ) {
    return next(
      new AppError(
        "Intersection de la période de début ou de fin avec une autre",
        404
      )
    );
  }
  const paiement = await Paiement.create(data);

  res.status(200).json({
    status: "success",
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
  });
  if (
    (paiement_prof.fromDate <= req.body.fromDate &&
      paiement_prof.toDate >= req.body.fromDate) ||
    (paiement_prof.fromDate <= req.body.toDate &&
      paiement_prof.toDate >= req.body.toDate)
  ) {
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
    return next(new AppError("No paiement found with that ID", 404));
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
    return next(new AppError("No paiement found with that ID", 404));
  }
  const deleted_paiement = await Paiement.findOneAndDelete(id);
  res.status(200).json({
    status: "success",
    message: deleted_paiement.status,
    paiement,
  });
});
// 6) get paiement By ID
exports.getPaiementById = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const paiement = await Paiement.findById(id);
  if (!paiement) {
    return next(new AppError("No paiement found with that ID", 404));
  }
  res.status(200).json({
    status: "success",
    paiement,
  });
});

/* -----------------------------------------------------FONCTIONS------------------------ */
