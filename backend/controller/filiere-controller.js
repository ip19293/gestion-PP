const APIFeatures = require("../utils/apiFeatures");
const Filiere = require("../models/filiere");
const Element = require("../models/element");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Emploi = require("../models/emploi");

exports.getFilieres = catchAsync(async (req, res, next) => {
  let filter = {};
  if (req.params.id) filter = { cours: req.params.id };
  const features = new APIFeatures(Filiere.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .pagination();
  const filieresData = await features.query;
  const filieres = filieresData.map((filiere) => ({
    ...filiere.toObject(),
    semestre: filiere.isPaireSemestre
      ? parseInt(filiere.semestres.split(",")[1])
      : parseInt(filiere.semestres.split(",")[0]),
  }));
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
  const Oldfiliere = await Filiere.findOne({
    name: req.body.name,
    semestres: req.body.semestres,
    niveau: req.body.niveau,
  });
  if (Oldfiliere) {
    return next(
      new AppError(
        `La filière ${Oldfiliere.niveau} ${Oldfiliere.name} existe déjà !`,
        404
      )
    );
  }
  const filiere = await Filiere.create({
    name: req.body.name,
    niveau: req.body.niveau,
    semestres: req.body.semestres,
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
    semestres: req.body.semestres,
    niveau: req.body.niveau,
  });
  if (Oldfiliere && !Oldfiliere._id.equals(id)) {
    return next(
      new AppError(
        `La filière ${Oldfiliere.niveau} ${Oldfiliere.name} existe déjà ...`,
        404
      )
    );
  }
  const filiere = await Filiere.findById(id);
  filiere.name = req.body.name;
  filiere.niveau = req.body.niveau;
  filiere.isPaireSemestre = req.body.isPaireSemestre;
  filiere.semestres = req.body.semestres;
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
  let emplois = await filiere.getEmplois();
  if (!filiere) {
    return next(
      new AppError("La filière avec cet identifiant introuvable !", 404)
    );
  }
  res.status(200).json({
    status: "succès",
    //emplois,
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

  res.status(200).json({
    status: "succès",
    _id: filiere._id,
    filiere: filiere.name,
    description: filiere.description,
    niveau: filiere.niveau,
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

  const emploisDatafeatures = new APIFeatures(
    Emploi.find({ filiere: id }),
    req.query
  )
    .filter()
    .sort()
    .limitFields()
    .pagination();

  const emploisData = await emploisDatafeatures.query;
  const emplois = emploisData.map((emploi) => ({
    ...emploi.toObject(),
    professeur: emploi.professeur ? emploi.professeur._id : null,
    nom: emploi.professeur.user ? emploi.professeur.user.nom : null,
    prenom: emploi.professeur.user ? emploi.professeur.user.prenom : null,
    filiere_id: emploi.filiere ? emploi.filiere._id : null,
    filiere: emploi.filiere ? emploi.filiere.name : null,
    niveau: emploi.filiere ? emploi.filiere.niveau : null,
    semestre: emploi.element ? emploi.element.semestre : null,
    name: emploi.element ? emploi.element.name : null,
    code: emploi.element ? emploi.element.code : null,
    element: emploi.element ? emploi.element._id : null,
  }));
  res.status(200).json({
    status: "succès",
    filiere,
    emplois,
  });
});
exports.getStartNewSemestre = catchAsync(async (req, res, next) => {
  const query = await Filiere.findOne({ isPaireSemestre: false });
  await Filiere.updateMany(
    {},
    { $set: { isPaireSemestre: query ? true : false } }
  );

  res.status(200).json({
    status: "succès",
    message: "Le nouveau semestre est debiter .",
  });
});
