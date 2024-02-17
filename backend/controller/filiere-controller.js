const APIFeatures = require("../utils/apiFeatures");
const Filiere = require("../models/filiere");
const Element = require("../models/element");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Emploi = require("../models/emploi");
const Matiere = require("../models/matiere");

exports.getFilieres = catchAsync(async (req, res, next) => {
  let filter = {};
  if (req.params.id) filter = { cours: req.params.id };
  const features = new APIFeatures(
    Filiere.find(),
    /* .populate({
      path: "categorie",
    }) */ req.query
  )
    .filter()
    .sort()
    .limitFields()
    .pagination();
  const filieres = await features.query;

  res.status(200).json({
    status: "succès",
    filieres,
  });
});
exports.deleteAllFilieres = catchAsync(async (req, res, next) => {
  await Filiere.deleteMany();
  res.status(200).json({
    status: "succès",
    message: "all Filieres is deleted",
  });
});
/* -----------------------------------------------------------ADD NEW Filiere-------------------------------------------------------------- */
exports.addFiliere = catchAsync(async (req, res, next) => {
  const data = req.body;
  const Oldfiliere = await Filiere.findOne({
    name: req.body.name,
    niveau: req.body.niveau,
  });
  if (Oldfiliere) {
    return res.status(400).json({
      status: "échec",
      message: `La filière ${Oldfiliere.niveau} ${Oldfiliere.name} existe déjà !`,
    });
  }
  const filiere = await Filiere.create({
    name: req.body.name,
    niveau: req.body.niveau,
    description: req.body.description,
  });

  res.status(200).json({
    status: "succès",
    message: `La filière est ajouté avec succés .`,
    filiere,
  });
});

exports.updateFiliere = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const Oldfiliere = await Filiere.findOne({
    name: req.body.name,
    niveau: req.body.niveau,
  });
  if (Oldfiliere && !Oldfiliere._id.equals(id)) {
    return res.status(400).json({
      status: "échec",
      message: `La filière ${Oldfiliere.niveau} ${Oldfiliere.name} existe déjà ...`,
    });
  }
  const filiere = await Filiere.findById(id);
  filiere.name = req.body.name;
  filiere.niveau = req.body.niveau;
  filiere.description = req.body.description;
  filiere.isPaireSemestre = req.body.isPaireSemestre;
  await filiere.save();
  if (!filiere) {
    return next(
      new AppError("La filière avec cet identifiant introuvable !", 404)
    );
  }
  res.status(201).json({
    status: "succès",
    message: `La filière est modifié avec succés .`,
    filiere: filiere,
  });
});
/* ================================================ DELETE================================================ */
exports.deleteFiliere = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const filiere = await Filiere.findOneAndDelete({ _id: id });
  if (!filiere) {
    return next(
      new AppError("La filière avec cet identifiant introuvable !", 404)
    );
  }
  res.status(200).json({
    status: "succès",
    message: filiere.name,
  });
});
/* ======================================================GET BY ID=========================================== */
exports.getFiliere = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const filiere = await Filiere.findById(id);
  let filiere_info = await filiere.getPeriodePlace();
  if (!filiere) {
    return next(
      new AppError("La filière avec cet identifiant introuvable !", 404)
    );
  }
  res.status(200).json({
    status: "succès",
    filiere_info,
    filiere,
  });
});

/* ====================================================GET DETAIL LIST OF SEMESTRES========================== */
exports.getFiliereDetail = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const filiere = await Filiere.findById(id);
  if (!filiere) {
    return next(
      new AppError("La filière avec cet identifiant introuvable !", 404)
    );
  }
  const elements = await Element.find({ filiere: id }).sort({
    semestre: 1,
  });
  let filiere_info = await filiere.getPeriodePlace();
  /*  for (elem of list_elements) {
    let elem_info = await elem.getFiliere_Matiere();
    let elem_profs = await elem.getProfCM_ProfTP_ProfTD();
    let matiere_info = await elem_info[1].getCodePrixCNameCCode();
    let code =
      matiere_info[3] + elem.semestre + filiere_info[1] + elem_info[1].numero;

    let dt = {
      _id: elem._id,
      filiere: elem.filiere,
      semestre: elem.semestre,
      matiere: elem.matiere,
      heuresCM: elem.heuresCM,
      heuresTP: elem.heuresTP,
      heuresTD: elem.heuresTD,
      name_EM: elem_info[1].name,
      categorie: elem_info[1].categorie,
      code_EM: code,
      professeurCM: elem_profs[0],
      professeurTP: elem_profs[1],
      professeurTD: elem_profs[2],
    };
    elements.push(dt);
  } */
  /*   const semestres = await Semestre.find({ filiere: id });
  for (s of semestres) {
    if (s.numero != null) {
      list_semestres.push(s.numero);
    }
  }
  const data = await getFilliereSemestresElements(semestres, filliere); */
  res.status(200).json({
    status: "succès",
    _id: filiere._id,
    filiere: filiere.name,
    description: filiere.description,
    niveau: filiere.niveau,
    //semestres: list_semestres,
    // elements: data,
    elements: elements,
  });
});
exports.getFiliereEmplois = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const filiere = await Filiere.findById(id);
  if (!filiere) {
    return next(
      new AppError("La filière avec cet identifiant introuvable !", 404)
    );
  }
  const emplois = await Emploi.find({ filiere: filiere._id });
  res.status(200).json({
    status: "succès",
    _id: filiere._id,
    filiere: filiere.name,
    description: filiere.description,
    niveau: filiere.niveau,
    emplois: emplois,
  });
});
/* -----------------------------------------------------------FUNCTIONS----------------------- */
/* 1) GET SEMESTRE WITH ELEMENTS  ----------------------------*/
/* async function getFilliereSemestresElements(semestres, filliere) {
  let data = [];
  let filliere_info = await filliere.getPeriodePlace();
  if (Array.isArray(semestres)) {
    for (const s of semestres) {
      if (Array.isArray(s.elements)) {
        for (const el of s.elements) {
          try {
            const matiere = await Matiere.findById(el);
            let matiere_info = await matiere.getCodePrixCNameCCode();
            let code =
              matiere_info[3] +
              (await s.numero) +
              filliere_info[1] +
              matiere.numero;
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
} */
