const APIFeatures = require("../utils/apiFeatures");
const Filliere = require("../models/filliere");
const Semestre = require("../models/semestre");
const Matiere = require("../models/matiere");
const Element = require("../models/element");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.getSemestres = catchAsync(async (req, res, next) => {
  let filter = {};
  if (req.params.id) filter = { cours: req.params.id };
  const features = new APIFeatures(
    Semestre.find().populate([
      {
        path: "filliere",
      },
    ]),
    req.query
  )
    .filter()
    .sort()
    .limitFields()
    .pagination();
  const semestres = await features.query;
  res.status(200).json({
    status: "succès",
    semestres,
  });
});

exports.addSemestre = catchAsync(async (req, res, next) => {
  const data = req.body;
  const filliere = await Filliere.findById(req.body.filliere);
  if (!filliere) {
    return next(
      new AppError(`La filière avec cet identifiant introuvable !`, 404)
    );
  }
  const s = await Semestre.findOne({
    filliere: req.body.filliere,
    numero: req.body.numero,
  });
  if (s) {
    return next(
      new AppError(
        `Le semestre ${req.body.numero} de la filière ${filliere.niveau} ${filliere.name}  existe déjà !`,
        404
      )
    );
  }

  let semestre = new Semestre({
    numero: req.body.numero,
    start: req.body.start,
    filliere: req.body.filliere,
    elements: req.body.elements,
  });
  semestre = await semestre.save();
  res.status(200).json({
    status: "succès",
    message: `Le semestre est ajouté avec succès ...`,
    semestre,
  });
});

exports.updateSemestre = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const data = req.body;
  const filliere = await Filliere.findById(req.body.filliere);
  const semestre = await Semestre.findById(id);
  if (!semestre) {
    return next(
      new AppError("Le semestre avec cet identifiant introuvable !", 404)
    );
  }
  if (!filliere) {
    return next(
      new AppError(`La filière avec cet identifiant introuvable !`, 404)
    );
  }
  const s = await Semestre.findOne({
    filliere: req.body.filliere,
    numero: req.body.numero,
  });
  if (s && !s._id.equals(id)) {
    return next(
      new AppError(
        `Le semestre ${req.body.numero} de la filière ${filliere.niveau} ${filliere.name}  existe déjà !`,
        404
      )
    );
  }
  semestre.filliere = req.body.filliere;
  semestre.numero = req.body.numero;
  semestre.elements = req.body.elements;
  semestre.start = req.body.start;
  await semestre.save();
  res.status(201).json({
    status: "succès",
    message: "Le semestre est modifier succès ...",
    semestre: semestre,
  });
});

exports.deleteSemestre = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const semestre = await Semestre.findOneAndDelete({ _id: id });
  if (!semestre) {
    return next(
      new AppError("Le semestre avec cet identifiant introuvable !", 404)
    );
  }

  res.status(200).json({
    status: "succès",
    message: `Le semestre est supprimé avec succès ...`,
  });
});

/* ------------------------------------------------ add one element to semestre ------------------------------- */

exports.addOneElementToSemestre = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const idM = req.params.idM;
  const element = await Matiere.findById(idM);
  if (!element) {
    return next(
      new AppError("L'element avec cet identifiant introuvable !", 404)
    );
  }
  const semestre_up = await Semestre.findById(id);
  if (!semestre_up) {
    return next(
      new AppError("Le semestre avec cet identifiant introuvable !", 404)
    );
  }
  for (e of semestre_up.elements) {
    if (e.equals(idM)) {
      return next(
        new AppError(`L'element existe déja dans ce semestre !`, 404)
      );
    }
  }
  const semestre = await Semestre.updateMany(
    {
      _id: id,
    },
    {
      $addToSet: {
        elements: {
          matiere: idM,
          professeurCM: req.body.professeurCM,
          professeurTP: req.body.professeurTP,
          professeurTD: req.body.professeurTD,
          creditCM: req.body.creditCM,
          creditTP: req.body.creditTP,
          creditTD: req.body.creditTD,
        },
      },
    },
    { new: true }
  );

  res.status(200).json({
    status: "succès",
    message: `L'element est ajouter avec succès ...`,
    semestre,
  });
});
/* ----------------------------------------------------------remove one element from semestre--------------------- */
exports.deleteOneElementFromSemestre = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const idM = req.params.idM;
  const element = await Matiere.findById(idM);
  if (!element) {
    return next(
      new AppError("L'element avec cet identifiant introuvable !", 404)
    );
  }

  const Oldsemestre = await Semestre.findById(id);
  if (!Oldsemestre) {
    return next(
      new AppError("Le semetre avec cet identifiant introuvable !", 404)
    );
  }
  const up_semestre = await Semestre.updateOne(
    {
      _id: id,
    },
    {
      $pull: {
        elements: idM,
      },
    },
    { new: true }
  );
  const semestre = await Semestre.findById(id);
  res.status(200).json({
    status: "succès",
    message: "L'element est supprimé avec succès de ce semestre ...",
    semestre,
  });
});
/* ------------------------------------------------get semestre by numero and filliere_id ------------------------- */
exports.getSemestreByNumero = catchAsync(async (req, res, next) => {
  const numero = req.params.numero;
  const idF = req.params.idF;
  const semestre = await Semestre.findOne({
    numero: numero,
    filliere: idF,
  }).populate({ path: "filliere" });
  if (!semestre) {
    return next(
      new AppError("Le semestre avec cet identifiant introuvable !", 404)
    );
  }

  res.status(200).json({
    status: "succès",
    semestre,
  });
});
/* ------------------------------------------------get semestre element------------------------- */
exports.getSemestreElements = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const semestre = await Semestre.findById(id).populate({ path: "filliere" });
  if (!semestre) {
    return next(
      new AppError("Le semestre avec cet identifiant introuvable !", 404)
    );
  }
  const filliere = await Filliere.findById(semestre.filliere);
  if (!filliere) {
    return next(
      new AppError("La filière avec cet identifiant introuvable !", 404)
    );
  }
  const elements_list = await Element.find({ semestre: semestre._id });
  let elements = [];
  const filliere_info = await filliere.getPeriodePlace();
  for (elem of elements_list) {
    let matiere = await Matiere.findById(elem.matiere);
    let matiere_info = await matiere.getCodePrixCNameCCode();
    let element_profs = await elem.getProfCM_ProfTP_ProfTD();
    let code =
      matiere_info[3] +
      (await semestre.numero) +
      filliere_info[1] +
      matiere.numero;
    let data = {
      _id: elem._id,
      semestre_id: elem.semestre,
      matiere_id: elem.matiere,
      creditCM: elem.creditCM,
      creditTP: elem.creditTP,
      creditTD: elem.creditTD,
      professeurCM: element_profs[0],
      professeurTP: element_profs[1],
      professeurTD: element_profs[2],
      name_EM: matiere.name,
      code_EM: code,
    };
    elements.push(data);
  }
  res.status(200).json({
    status: "succès",
    elements,
  });
});
