const APIFeatures = require("../utils/apiFeatures");
const Matiere = require("../models/matiere");
const Professeur = require("../models/professeur");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Categorie = require("../models/categorie");
exports.getMatieres = catchAsync(async (req, res, next) => {
  let filter = {};
  if (req.params.id) filter = { cours: req.params.id };
  const features = new APIFeatures(
    Matiere.find().sort({ numero: 1 }),
    /* .populate({
      path: "categorie",
    }) */ req.query
  )
    .filter()
    .sort()
    .limitFields()
    .pagination();
  const matieres_list = await features.query;
  let matieres = [];
  for (x of matieres_list) {
    let matiere_info = await x.getCodePrixCNameCCode();
    let data = {
      _id: x._id,
      name: x.name,
      categorie: x.categorie,
      categorie_name: matiere_info[2],
      code: matiere_info[0],
      taux: matiere_info[1],
      numero: x.numero,
    };
    matieres.push(data);
  }

  res.status(200).json({
    status: "succés",
    matieres,
  });
});
exports.deleteAllMatieres = catchAsync(async (req, res, next) => {
  await Matiere.deleteMany();
  res.status(200).json({
    status: "succés",
    message: "all matieres is deleted",
  });
});
exports.getMatieresProf = catchAsync(async (req, res, next) => {
  let filter = {};
  let professeurs = [];
  const professeurs_list = await Professeur.find({
    matieres: req.params.id,
  });
  for (x of professeurs_list) {
    let professeur = await Professeur.findById(x._id);
    let prof_info = await professeur.getInfo_Nbh_TH_Nbc_Somme();
    let dt = {
      _id: prof_info[0],
      nom: prof_info[1],
      prenom: prof_info[2],
    };
    professeurs.push(dt);
  }
  res.status(200).json({
    status: "succés",
    professeurs,
  });
});
/* =================================================================ADD ============================ */
exports.addMatiere = catchAsync(async (req, res, next) => {
  const data = req.body;
  const categorie = await Categorie.findById(req.body.categorie);
  if (!categorie) {
    return next(
      new AppError("Aucune catégorie trouvée avec cet identifiant !", 404)
    );
  }
  const Oldmatiere = await Matiere.findOne({ name: req.body.name });
  if (Oldmatiere) {
    return next(new AppError("Le matiére existe déja !", 404));
  }
  const matiere = new Matiere({
    name: req.body.name,
    categorie: req.body.categorie,
  });
  await matiere.save();
  res.status(200).json({
    status: "succés",
    message: "La matière est ajouté avec succés .",
    matiere: matiere,
  });
});
/* ======================================================================EDIT ========================= */
exports.updateMatiere = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const categorie = await Categorie.findById(req.body.categorie);
  if (!categorie) {
    return next(
      new AppError("Aucune catégorie trouvée avec cet identifiant !", 404)
    );
  }
  const Oldmatiere = await Matiere.findOne({ name: req.body.name });
  if (Oldmatiere && !Oldmatiere._id.equals(id)) {
    return next(new AppError("La matière existe déja !", 404));
  }

  const matiere = await Matiere.findById(id);
  matiere.name = req.body.name;
  matiere.categorie = req.body.categorie;
  await matiere.save();
  if (!matiere) {
    return next(
      new AppError("Aucune catégorie trouvée avec cet identifiant !", 404)
    );
  }
  res.status(201).json({
    status: "succés",
    message: "La matière est modifié avec succés .",
    matiere,
  });
});

exports.deleteMatiere = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const matiere = await Matiere.findOneAndDelete({ _id: id });
  if (!matiere) {
    return next(
      new AppError("Aucune matière trouvée avec cet identifiant !", 404)
    );
  }
  res.status(200).json({
    status: "succés",
    message: matiere.name,
  });
});
exports.getMatiere = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const matiere = await Matiere.findById(id).populate([
    {
      path: "categorie",
      select: "prix name",
    },
  ]);
  if (!matiere) {
    return next(
      new AppError("Aucune matière trouvée avec cet identifiant !", 404)
    );
  }
  res.status(200).json({
    status: "succés",
    matiere,
  });
});
/* ==========================GET ALL PROFESSEURS MATIERE ============================================ */
exports.getAllProfesseursByMatiereId = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const matiere = await Matiere.findByIdAndDelete(id);
  if (!matiere) {
    return next(
      new AppError("Aucune matière trouvée avec cet identifiant !", 404)
    );
  }

  const professeurs = await Professeur.find([
    {
      matieres: id,
    },
  ]);
  res.status(200).json({
    status: "succés",
    professeurs,
  });
});
