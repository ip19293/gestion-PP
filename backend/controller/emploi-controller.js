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
    status: "succés",
    emplois,
  });
});
/* =======================================================================GET BY ID=================================== */
exports.getEmploiById = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const emploi = await Emploi.findById(id);
  if (!emploi) {
    return next(
      new AppError("Aucun emploi trouvé avec cet identifiant !", 404)
    );
  }
  res.status(200).json({
    status: "succés",
    emploi,
  });
});

/* ==============================================================ADD EMPLOI============================== */
exports.addEmploi = catchAsync(async (req, res, next) => {
  const professeur = await Professeur.findById(req.body.professeur);
  const matiere = await Matiere.findById(req.body.matiere);
  const group = await Group.findById(req.body.group);
  if (!professeur) {
    return next(
      new AppError("Aucun enseignant trouvé avec cet identifiant !", 404)
    );
  }
  if (!group) {
    return next(
      new AppError("Aucun groupe trouvé avec cet identifiant !", 404)
    );
  }
  if (!matiere) {
    return next(
      new AppError("Aucun matiére trouvé avec cet identifiant !", 404)
    );
  }
  if (!professeur.matieres.includes(matiere._id)) {
    return next(
      new AppError(
        "Aucun matiére dans la liste de ce enseignant trouvé avec cet identifiant !",
        404
      )
    );
  }
  const emplois_day = await Emploi.find({
    dayNumero: req.body.dayNumero,
    group: req.body.group,
  });
  const result = VERIFICATION(req.body, emplois_day, "groupe");

  if (result[0] == "failed") {
    console.log(result[0]);
    return next(new AppError(`${result[1]}`, 404));
  }

  /* ------------------------------------------------------ */
  let emploi = new Emploi({
    type: req.body.type,
    nbh: req.body.nbh,
    startTime: req.body.startTime,
    professeur: req.body.professeur,
    matiere: req.body.matiere,
    dayNumero: req.body.dayNumero,
    group: req.body.group,
  });
  emploi = await emploi.save();
  res.status(201).json({
    status: "succés",
    message: `L'emploi ajouté avec succés .`,
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
    return next(
      new AppError("Aucun emploi trouvé avec cet identifiant !", 404)
    );
  }
  if (!professeur) {
    return next(
      new AppError("Aucun enseignant trouvé avec cet identifiant !", 404)
    );
  }
  if (!group) {
    return next(
      new AppError("Aucun groupe trouvé avec cet identifiant !", 404)
    );
  }
  if (!matiere) {
    return next(
      new AppError("Aucun matiére trouvé avec cet identifiant !", 404)
    );
  }
  if (!professeur.matieres.includes(matiere._id)) {
    return next(
      new AppError(
        "Aucun matiére dans la liste de ce enseignant trouvé avec cet identifiant !",
        404
      )
    );
  }
  const emplois_day = await Emploi.find({
    _id: { $ne: id },
    dayNumero: req.body.dayNumero,
    group: req.body.group,
  });
  const result = VERIFICATION(req.body, emplois_day, "groupe");

  if (result[0] == "failed") {
    console.log(result[0]);
    return next(new AppError(`${result[1]}`, 404));
  }

  emploi.type = req.body.type;
  emploi.nbh = req.body.nbh;
  emploi.startTime = req.body.startTime;
  emploi.professeur = req.body.professeur;
  emploi.matiere = req.body.matiere;
  emploi.dayNumero = req.body.dayNumero;
  emploi.group = req.body.group;
  await emploi.save();

  res.status(200).json({
    status: "succés",
    message: `Emploi modifié avec succés .`,
    emploi,
  });
};
/* =============================================================REMOVE BY ID======================================= */
exports.deleteEmploi = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const emploi = await Emploi.findByIdAndDelete({ _id: id });
  if (!emploi) {
    return next(
      new AppError("Aucun emploi trouvé avec cet identifiant !", 404)
    );
  }
  res.status(200).json({
    status: "succés",
    message: "L'emploi supprimé avec succés .",
  });
});
/* ====================================================================VERIFICATION EMPLOI BEFORE ADDET OR EDIT=====================*/
