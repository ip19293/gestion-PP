const APIFeatures = require("../utils/apiFeatures");
const Emploi = require("../models/emploi");
const Cours = require("../models/cours");
const Professeur = require("../models/professeur");
const Matiere = require("../models/matiere");
const Group = require("../models/group");
const mongoose = require("mongoose");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const VERIFICATION = require("./functions/verificatin");
exports.getEmplois = catchAsync(async (req, res, next) => {
  let filter = {};
  if (req.params.id) filter = { emplois: req.params.id };
  const features = new APIFeatures(Emploi.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .pagination();
  const emplois = await features.query;
  // const data = functions.emploi_respone(emploi);
  res.status(200).json({
    status: "success",
    emplois,
  });
});
/* =======================================================================GET BY ID=================================== */
exports.getEmploiById = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const emploi = await Emploi.findById(id);
  if (!emploi) {
    return next(new AppError("No emploi found with that ID", 404));
  }
  res.status(200).json({
    status: "success",
    emploi,
  });
});
/* ============================================================FONCTION ============================== */
const cour_types_TO_th_nbh_nbm_thsm = (cour_types) => {
  let th = 0;
  let nbh = 0;
  let nbm = 0;
  let thsm = 0;
  cour_types.forEach((e) => {
    if (e.name == "CM") {
      th = th + e.nbh;
    }
    if (e.name == "TD" || e.name == "TP") {
      th = th + (e.nbh * 2) / 3;
    }
    thsm = th + thsm;
    nbh = nbh + e.nbh;
  });
  nbm = (nbh % 1) * 60;

  return [th, nbh, nbm, thsm];
};
/* ==============================================================ADD EMPLOI============================== */
exports.addEmploi = catchAsync(async (req, res, next) => {
  const professeur = await Professeur.findById(req.body.professeur);
  const matiere = await Matiere.findById(req.body.matiere);
  const group = await Group.findById(req.body.group);
  if (!professeur) {
    return next(new AppError("No professeur found with that ID", 404));
  }
  if (!group) {
    return next(new AppError("No group found with that ID", 404));
  }
  if (!matiere) {
    return next(new AppError("No matiere found with that ID", 404));
  }
  if (!professeur.matieres.includes(matiere._id)) {
    return next(
      new AppError("The matiere is not in the list of this professeur ...", 404)
    );
  }
  const emplois_day = await Emploi.find({
    dayNumero: req.body.dayNumero,
    group: req.body.group,
  });
  const result = VERIFICATION(req.body, emplois_day);

  if (result[0] == "failed") {
    console.log(result[0]);
    return next(new AppError(`${result[1]}`, 404));
  }

  /* ------------------------------------------------------ */
  let emploi = new Emploi({
    types: req.body.types,
    startTime: req.body.startTime,
    professeur: req.body.professeur,
    matiere: req.body.matiere,
    dayNumero: req.body.dayNumero,
    group: req.body.group,
  });
  emploi = await emploi.save();
  res.status(201).json({
    status: "success",
    message: `Successfully created emploi ...`,
    emploi,
  });
});
/* ===================================================================UPDATE bY ID======================================== */
exports.updateEmploi = async (req, res, next) => {
  const id = req.params.id;
  const professeur = await Professeur.findById(req.body.professeur);
  const matiere = await Matiere.findById(req.body.matiere);
  const group = await Group.findById(req.body.group);
  const emploi = await Emploi.findById(id);
  if (!emploi) {
    return next(new AppError("No emploi found with that ID", 404));
  }
  if (!professeur) {
    return next(new AppError("No professeur found with that ID", 404));
  }
  if (!group) {
    return next(new AppError("No group found with that ID", 404));
  }
  if (!matiere) {
    return next(new AppError("No matiere found with that ID", 404));
  }
  if (!professeur.matieres.includes(matiere._id)) {
    return next(
      new AppError("The matiere is not in the list of this professeur ...", 404)
    );
  }
  const emplois_day = await Emploi.find({
    _id: { $ne: id },
    dayNumero: req.body.dayNumero,
    professeur: req.body.professeur,
  });
  const result = VERIFICATION(req.body, emplois_day);

  if (result[0] == "failed") {
    console.log(result[0]);
    return next(new AppError(`${result[1]}`, 404));
  }

  emploi.types = req.body.types;
  emploi.startTime = req.body.startTime;
  emploi.professeur = req.body.professeur;
  emploi.matiere = req.body.matiere;
  emploi.dayNumero = req.body.dayNumero;
  emploi.group = req.body.group;
  await emploi.save();

  res.status(200).json({
    status: "success",
    emploi,
  });
};
/* =============================================================REMOVE BY ID======================================= */
exports.deleteEmploi = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const emploi = await Emploi.findByIdAndDelete(id);
  if (!emploi) {
    return next(new AppError("No emploi found with that ID", 404));
  }
  res.status(200).json({
    status: "success",
    message: "emploi ssucceffily delete",
  });
});
/* ====================================================================VERIFICATION EMPLOI BEFORE ADDET OR EDIT=====================*/
