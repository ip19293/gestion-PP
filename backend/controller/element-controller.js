const APIFeatures = require("../utils/apiFeatures");
const Element = require("../models/element");
const Group = require("../models/group");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Semestre = require("../models/semestre");
const Matiere = require("../models/matiere");
exports.getElements = catchAsync(async (req, res, next) => {
  let filter = {};
  if (req.params.id) filter = { cours: req.params.id };
  const features = new APIFeatures(
    Element.find(),
    /* .populate({
      path: "categorie",
    }) */ req.query
  )
    .filter()
    .sort()
    .limitFields()
    .pagination();
  const elements_list = await features.query;
  let elements = [];
  for (x of elements_list) {
    let matiere = await Matiere.findById(x.matiere);
    let matiere_info = await matiere.getCodePrixCNameCCode();
    let element_info = await x.getSemestre_Filiere_Matiere();
    let element_profs = await x.getProfCM_ProfTP_ProfTD();
    let data = {
      _id: x._id,
      semestre_id: x.semestre,
      matiere_id: x.matiere,
      heuresCM: x.heuresCM,
      heuresTP: x.heuresTP,
      heuresTD: x.heuresTD,
      code: matiere_info[0],
      taux: matiere_info[1],
      semestre: element_info[0],
      filiere: element_info[1],
      matiere: element_info[2],
      professeurCM: element_profs[0],
      professeurTP: element_profs[1],
      professeurTD: element_profs[2],
    };
    elements.push(data);
  }

  res.status(200).json({
    status: "succés",
    elements,
  });
});

/* =================================================================ADD ============================ */
exports.addElement = catchAsync(async (req, res, next) => {
  const data = req.body;
  const matiere = await Matiere.findById(req.body.matiere);

  if (!matiere) {
    return next(
      new AppError("Aucune matiére trouvée avec cet identifiant !", 404)
    );
  }
  const semestre = await Semestre.findById(req.body.semestre);
  if (!semestre) {
    return next(
      new AppError("Aucune semestre trouvée avec cet identifiant !", 404)
    );
  }
  const OldElement = await Element.findOne({
    semestre: req.body.semestre,
    matiere: req.body.matiere,
  });
  if (OldElement) {
    return next(new AppError("L'element existe déja !", 404));
  }
  const element = await Element.create({
    matiere: req.body.matiere,
    semestre: req.body.semestre,
    professeurCM: req.body.professeurCM,
    professeurTD: req.body.professeurTD,
    professeurTP: req.body.professeurTP,
    heuresCM: req.body.heuresCM,
    heuresTP: req.body.heuresTP,
    heuresTD: req.body.heuresTD,
  });
  res.status(200).json({
    status: "succés",
    message: "La matière est ajouté avec succés .",
    element: element,
  });
});
/* ======================================================================EDIT ========================= */
exports.updateElement = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const element = await Element.findById(id);
  if (!element) {
    return next(
      new AppError("Aucune element trouvée avec cet identifiant !", 404)
    );
  }
  const matiere = await Matiere.findById(req.body.matiere);

  if (!matiere) {
    return next(
      new AppError("Aucune matiére trouvée avec cet identifiant !", 404)
    );
  }
  const semestre = await Semestre.findById(req.body.semestre);
  if (!semestre) {
    return next(
      new AppError("Aucune semestre trouvée avec cet identifiant !", 404)
    );
  }
  const OldElement = await Element.findOne({
    semestre: req.body.semestre,
    matiere: req.body.matiere,
  });
  if (OldElement && !OldElement._id.equals(id)) {
    return next(new AppError("L'element existe déja !", 404));
  }

  element.semestre = req.body.semestre;
  element.matiere = req.body.matiere;
  element.professeurCM =
    req.body.professeurCM != "" ? req.body.professeurCM : undefined;
  element.professeurTD =
    req.body.professeurTD != "" ? req.body.professeurTD : undefined;
  element.professeurTP =
    req.body.professeurTP != "" ? req.body.professeurTP : undefined;
  element.heuresCM = req.body.heuresCM;
  element.heuresTD = req.body.heuresTD;
  element.heuresTP = req.body.heuresTP;
  await element.save();
  res.status(201).json({
    status: "succés",
    message: "L'element est modifié avec succés .",
    element,
  });
});

exports.deleteElement = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const element = await Element.findOneAndDelete({ _id: id });
  if (!element) {
    return next(
      new AppError("Aucune matière trouvée avec cet identifiant !", 404)
    );
  }
  res.status(200).json({
    status: "succés",
    message: ``,
  });
});
exports.getElement = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const element = await Element.findById(id);
  if (!element) {
    return next(
      new AppError("Aucune matière trouvée avec cet identifiant !", 404)
    );
  }
  res.status(200).json({
    status: "succés",
    element: element,
  });
});
exports.getGroupsByElementId = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const element = await Element.findById(id);
  if (!element) {
    return next(
      new AppError("Aucune matière trouvée avec cet identifiant !", 404)
    );
  }
  const groupes = await Group.find({ semestre: element.semestre });

  res.status(200).json({
    status: "succés",
    groupes: groupes,
  });
});
