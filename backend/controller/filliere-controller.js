const APIFeatures = require("../utils/apiFeatures");
const Filliere = require("../models/filliere");
const Professeur = require("../models/professeur");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

const Semestre = require("../models/semestre");
const Matiere = require("../models/matiere");
const FilliereDetail = require("./json-response/filliere/filliere-semestre-elements");
const FilliereEmploi = require("./json-response/filliere/filliere-emploi");

exports.getFillieres = catchAsync(async (req, res, next) => {
  let filter = {};
  if (req.params.id) filter = { cours: req.params.id };
  const features = new APIFeatures(
    Filliere.find(),
    /* .populate({
      path: "categorie",
    }) */ req.query
  )
    .filter()
    .sort()
    .limitFields()
    .pagination();
  const fillieres = await features.query;

  res.status(200).json({
    status: "success",
    fillieres,
  });
});
exports.deleteAllFillieres = catchAsync(async (req, res, next) => {
  await Filliere.deleteMany();
  res.status(200).json({
    status: "success",
    message: "all fillieres is deleted",
  });
});
exports.addFilliere = catchAsync(async (req, res, next) => {
  const data = req.body;
  const Oldfilliere = await Filliere.findOne({
    name: req.body.name,
    niveau: req.body.niveau,
  });
  if (Oldfilliere) {
    return res.status(400).json({
      status: "fail",
      message: " existe before",
    });
  }
  const filliere = await Filliere.create({
    name: req.body.name,
    niveau: req.body.niveau,
    description: req.body.description,
  });

  res.status(200).json({
    status: "success",

    filliere,
  });
});

exports.updateFilliere = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const Oldfilliere = await Filliere.findOne({
    name: req.body.name,
  });
  if (!Oldfilliere._id.equals(id)) {
    return res.status(400).json({
      status: "fail",
      message: "the filliere name existe before",
    });
  }
  const filliere = await Filliere.findById(id);
  filliere.name = req.body.name;
  filliere.niveau = req.body.niveau;
  filliere.description = req.body.description;
  await filliere.save();
  if (!filliere) {
    return next(new AppError("No filliere found with that ID", 404));
  }
  res.status(201).json({
    status: "success",
    filliere: filliere,
  });
});
/* ================================================ DELETE================================================ */
exports.deleteFilliere = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const filliere = await Filliere.findOneAndDelete(id);
  if (!filliere) {
    return next(new AppError("No filliere found with that ID", 404));
  }
  res.status(200).json({
    status: "success",
    message: "filliere ssucceffily delete",
  });
});
/* ======================================================GET BY ID=========================================== */
exports.getFilliere = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const filliere = await Filliere.findById(id);
  if (!filliere) {
    return next(new AppError("No filliere found with that ID", 404));
  }
  res.status(200).json({
    status: "success",
    filliere,
  });
});
/* ====================================================GET DETAIL LIST OF SEMESTRES========================== */
exports.getFilliereDetail = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const filliere = await Filliere.findById(id);
  let list_semestres = [];
  if (!filliere) {
    return next(new AppError("No filliere found with that ID", 404));
  }

  const semestres = await Semestre.find({ filliere: id });
  for (s of semestres) {
    if (s.numero != null) {
      list_semestres.push(s.numero);
    }
  }
  const data = await getFilliereSemestresElements(semestres, filliere.niveau);
  res.status(200).json({
    status: "success",
    _id: filliere._id,
    filliere: filliere.name,
    description: filliere.description,
    niveau: filliere.niveau,
    semestres: list_semestres,
    elements: data,
  });
});
/* exports.getFilliereDetail = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const elements = await Element.find({ filliere: id })
    .sort({ semestre: 1, code_EM: 1 })
    .populate([{ path: "matiere" }]);
  res.status(200).json({
    status: "success",
    elements,
  });
}); */

/* -----------------------------------------------------------FUNCTIONS----------------------- */
/* 1) GET SEMESTRE WITH ELEMENTS  ----------------------------*/
async function getFilliereSemestresElements(semestres, niveau) {
  let data = [];
  let LMD_niveau = ["Licence", "Master", "Doctorat"];
  let LMD_numero = 1;
  for (x of LMD_niveau) {
    if (x == niveau) {
      LMD_numero = LMD_niveau.indexOf(x) + LMD_numero;
    }
  }
  if (Array.isArray(semestres)) {
    for (const s of semestres) {
      if (Array.isArray(s.elements)) {
        for (const el of s.elements) {
          try {
            const matiere = await Matiere.findById(el);
            let matiere_info = await matiere.getInformation();
            let code =
              matiere_info[4] + (await s.numero) + LMD_numero + matiere.numero;
            let element = new FilliereDetail(
              s._id,
              s.numero,
              "S" + s.numero,
              matiere._id,
              code,
              matiere.name
            );
            data.push(element);
          } catch (error) {
            console.log("Error:", error);
          }
        }
      }
    }
  }
  return data;
}
