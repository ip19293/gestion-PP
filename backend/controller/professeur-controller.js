const APIFeatures = require("../utils/apiFeatures");
const Matiere = require("../models/matiere");
const Professeur = require("../models/professeur");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Cours = require("../models/cours");
const professeur = require("../models/professeur");
const User = require("../auth/models/user");
exports.getProfesseurs = catchAsync(async (req, res, next) => {
  let filter = {};
  if (req.params.id) filter = { cours: req.params.id };
  const features = new APIFeatures(Professeur.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .pagination();
  const professeurs_list = await features.query;
  let professeurs = [];
  for (x of professeurs_list) {
    let prof_info = await x.getInformation();
    let data = {
      _id: prof_info[0],
      nom: prof_info[1],
      prenom: prof_info[2],
      email: prof_info[3],
      mobile: prof_info[4],
      nbh: prof_info[5],
      th: prof_info[6],
      nbc: prof_info[7],
      somme: prof_info[8],
    };
    professeurs.push(data);
  }

  res.status(200).json({
    status: "success",
    professeurs,
  });
});

exports.deleteAllProfesseurs = catchAsync(async (req, res, next) => {
  await Professeur.deleteMany();
  res.status(200).json({
    status: "success",
    message: "all professeurs is deleted",
  });
});

exports.addProfesseur = catchAsync(async (req, res, next) => {
  const data = req.body;
  let professeur = new Professeur({
    nom: req.body.nom,
    prenom: req.body.prenom,
    mobile: req.body.mobile,
    email: req.body.email,
    matieres: req.body.matieres,
  });
  professeur = await professeur.save();
  res.status(200).json({
    status: "success",
    data: {
      professeur,
    },
  });
});

exports.updateProfesseur = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const data = req.body;
  const professeur = await Professeur.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!professeur) {
    return next(new AppError("No professeur found with that ID", 404));
  }
  const user = await User.findByIdAndUpdate(professeur.user, data, {
    new: true,
    runValidators: true,
  });
  res.status(201).json({
    status: "success",
    message: "professeur update successfully",
    professeur: professeur,
  });
});

exports.deleteProfesseur = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const professeur = await Professeur.findOneAndDelete(id);
  if (!professeur) {
    return next(new AppError("No professeur found with that ID", 404));
  }
  const user = await User.findByIdAndDelete(professeur.user);
  let ms = "";
  if (user) {
    ms = "User and ";
  }

  res.status(200).json({
    status: "success",
    message: ms + professeur.nom,
  });
});
exports.getProfCours = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const cours_lsit = await Cours.find({ professeur: id });
  let cours = [];
  for (x of cours_lsit) {
    let matiere = await Matiere.findById(x.matiere);
    let cour = await Cours.findById(x._id);
    let cour_info = await cour.getInformation();
    let data = {
      _id: x._id,
      categorie_id: matiere.categorie,
      matiere_id: x.matiere,
      professeur_id: x.professeur,
      matiere: cour_info[8],
      professeur: cour_info[1] + " " + cour_info[2],
      email: cour_info[3],
      nombre_heures: cour_info[5],
      TH: cour_info[6],
      somme: cour_info[7],
      date: x.date,
      CM: x.types[0].nbh,
      TD: x.types[1].nbh,
      TP: x.types[2].nbh,
      prix: cour_info[8],
      isSigned: x.isSigned,
      isPaid: x.isPaid,
      startTime: x.startTime,
      finishTime: x.finishTime,
    };
    cours.push(data);
  }
  res.status(200).json({
    status: "success",
    cours,
  });
});
exports.getProfCoursNon = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const cours_lsit = await Cours.find({ professeur: id, isSigned: "NO" });
  let cours = [];
  for (x of cours_lsit) {
    let matiere = await Matiere.findById(x.matiere);
    let cour = await Cours.findById(x._id);
    let cour_info = await cour.getInformation();
    let data = {
      _id: x._id,
      categorie_id: matiere.categorie,
      matiere_id: x.matiere,
      professeur_id: x.professeur,
      matiere: cour_info[8],
      professeur: cour_info[1] + " " + cour_info[2],
      email: cour_info[3],
      nombre_heures: cour_info[5],
      TH: cour_info[6],
      somme: cour_info[7],
      date: x.date,
      CM: x.types[0].nbh,
      TD: x.types[1].nbh,
      TP: x.types[2].nbh,
      prix: cour_info[8],
      isSigned: x.isSigned,
      isPaid: x.isPaid,
      startTime: x.startTime,
      finishTime: x.finishTime,
    };
    cours.push(data);
  }

  res.status(200).json({
    status: "success",
    cours,
  });
});
///Get Professeur By ID-----------------------------------------------------------------------------------------
exports.getProfesseurById = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const professeur = await Professeur.findById(id);
  if (!professeur) {
    return next(new AppError("No professeur found with that ID", 404));
  }
  res.status(200).json({
    status: "success",
    professeur,
    matieres: await professeur.getMatieres(),
  });
});
///Get Professeur By Email-----------------------------------------------------------------------------------------

exports.getProfesseurEmail = catchAsync(async (req, res, next) => {
  const email = req.params.email;
  const professeur = await Professeur.findOne({
    email: email,
  }).populate([
    {
      path: "matieres",
      populate: { path: "categorie" },
    },
  ]);
  if (!professeur) {
    return next(new AppError("No professeur found with that EMAIL", 404));
  }
  res.status(200).json({
    status: "success",
    professeur,
  });
});
exports.addMatiereToProfesseus = catchAsync(async (req, res, next) => {
  const id = req.params.id;

  const professeur = await Professeur.updateMany(
    {
      _id: id,
    },
    {
      $addToSet: {
        matieres: req.body.matieres,
      },
    }
  );
  const matiere = await Matiere.findById(req.body.matiere);
  const matiere_prof = professeur.matieres;

  if (!professeur) {
    return next(new AppError("No professeur found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    professeur,
    matiere,
  });
});

//Remove matiere from professeur     -----------------------------------------------------------------------------------------------------
exports.deleteOneMatProf = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const idM = req.params.idM;
  const Oldprofesseur = await Professeur.findById(id);
  if (!Oldprofesseur) {
    return next(new AppError("No professeur found with that ID", 404));
  }
  const professeur = await Professeur.updateMany(
    {
      _id: id,
    },
    {
      $pull: {
        matieres: idM,
      },
    }
  );

  res.status(200).json({
    status: "success",
    message: "matiere deleted successfully",
    professeur,
  });
});
// Add Cours to Professeur ===============================================================
exports.addCoursToProf = catchAsync(async (req, res, next) => {
  const data = req.body;
  const professeur = await Professeur.findById(req.params.id);
  const matiere = await Matiere.findById(req.body.matiere);
  if (!professeur) {
    return next(new AppError("No professeur found with that ID", 404));
  }
  if (!matiere) {
    return next(new AppError("No matiere found with that ID", 404));
  }
  const cours = await Cours.create({
    professeur: req.params.id,
    types: req.body.types,
    date: req.body.date,
    startTime: req.body.startTime,
    matiere: req.body.matiere,
  });
  res.status(201).json({
    status: "success",
    cours,
  });
});
//----------------------------------------------------------------------------------------------
