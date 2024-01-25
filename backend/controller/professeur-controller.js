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
    let user = await User.findById(x.user);
    let prof_info = await x.getInfo_Nbh_TH_Nbc_Somme();

    let data = {
      _id: prof_info[0],
      nom: prof_info[1],
      prenom: prof_info[2],
      email: prof_info[3],
      mobile: prof_info[4],
      banque: prof_info[5],
      accountNumero: prof_info[6],
      nbh: prof_info[7],
      th: prof_info[8],
      nbc: prof_info[9],
      somme: prof_info[10],
    };
    professeurs.push(data);
  }

  res.status(200).json({
    status: "succés",
    professeurs,
  });
});

exports.deleteAllProfesseurs = catchAsync(async (req, res, next) => {
  await Professeur.deleteMany();
  res.status(200).json({
    status: "succés",
    message: "all professeurs is deleted",
  });
});

exports.addProfesseur = catchAsync(async (req, res, next) => {
  const data = req.body;
  let professeur = new Professeur({
    user: req.body.user,
    matieres: req.body.matieres,
    banque: req.body.banque,
    accountNumero: req.body.accountNumero,
  });
  professeur = await professeur.save();
  res.status(200).json({
    status: "succés",
    message: "L'enseignat est ajouté avec succés .",
    professeur,
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
    return next(
      new AppError("Aucun enseignant trouvé avec cet identifiant !", 404)
    );
  }
  const user = await User.findByIdAndUpdate(professeur.user, data, {
    new: true,
    runValidators: true,
  });
  res.status(201).json({
    status: "succés",
    message: "L'enseignat est modifié avec succés .",
    professeur: professeur,
  });
});

exports.deleteProfesseur = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const professeur = await Professeur.findOneAndDelete({ _id: id });
  if (!professeur) {
    return next(
      new AppError("Aucun enseignant trouvé avec cet identifiant !", 404)
    );
  }
  const user = await User.findByIdAndDelete({ _id: professeur.user });

  res.status(200).json({
    status: "succés",
    message: professeur._id,
  });
});
exports.getProfCours = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const professeur = await Professeur.findById(id);
  let prof_info = await professeur.getInfo_Nbh_TH_Nbc_Somme();
  if (!professeur) {
    return next(
      new AppError("Aucun enseignant trouvé avec cet identifiant !", 404)
    );
  }
  const cours_lsit = await Cours.find({ professeur: id });
  let cours = [];
  for (x of cours_lsit) {
    let matiere = await Matiere.findById(x.matiere);
    let cour = await Cours.findById(x._id);
    let cour_info = await cour.getTHSomme();
    let matiere_info = await matiere.getCodePrixCNameCCode();
    let data = {
      _id: x._id,
      categorie_id: matiere.categorie,
      matiere_id: x.matiere,
      professeur_id: x.professeur,
      matiere: matiere.name,
      professeur: prof_info[1] + " " + prof_info[2],
      email: prof_info[3],
      nbh: cour.nbh,
      type: cour.type,
      TH: cour_info[0],
      somme: cour_info[1],
      date: cour.date,
      prix: matiere_info[1],
      isSigned: x.isSigned,
      isPaid: x.isPaid,
      startTime: x.startTime,
      finishTime: x.finishTime,
    };
    cours.push(data);
  }
  res.status(200).json({
    status: "succés",
    cours,
  });
});
exports.getProfCoursSigned = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const professeur = await Professeur.findById(id);
  let prof_info = await professeur.getInfo_Nbh_TH_Nbc_Somme();
  if (!professeur) {
    return next(
      new AppError("Aucun enseignant trouvé avec cet identifiant !", 404)
    );
  }

  const cours_lsit = await Cours.find({ professeur: id, isSigned: "oui" });
  let cours = [];
  for (x of cours_lsit) {
    let matiere = await Matiere.findById(x.matiere);
    let cour = await Cours.findById(x._id);
    let cour_info = await cour.getTHSomme();
    let matiere_info = await matiere.getCodePrixCNameCCode();
    let data = {
      _id: x._id,
      categorie_id: matiere.categorie,
      matiere_id: x.matiere,
      professeur_id: x.professeur,
      matiere: matiere.name,
      professeur: prof_info[1] + " " + prof_info[2],
      email: prof_info[3],
      nbh: cour.nbh,
      type: cour.type,
      TH: cour_info[0],
      somme: cour_info[1],
      date: cour.date,
      prix: matiere_info[1],
      isSigned: x.isSigned,
      isPaid: x.isPaid,
      startTime: x.startTime,
      finishTime: x.finishTime,
    };
    cours.push(data);
  }
  res.status(200).json({
    status: "succés",
    cours,
  });
});
exports.getProfCoursNon = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const professeur = await Professeur.findById(id);
  let prof_info = await professeur.getInfo_Nbh_TH_Nbc_Somme();
  if (!professeur) {
    return next(
      new AppError("Aucun enseignant trouvé avec cet identifiant !", 404)
    );
  }
  const cours_lsit = await Cours.find({
    professeur: id,
    isSigned: "pas encore",
  });
  let cours = [];
  for (x of cours_lsit) {
    let matiere = await Matiere.findById(x.matiere);
    let cour = await Cours.findById(x._id);
    let cour_info = await cour.getTHSomme();
    let matiere_info = await matiere.getCodePrixCNameCCode();
    let data = {
      _id: x._id,
      categorie_id: matiere.categorie,
      matiere_id: x.matiere,
      professeur_id: x.professeur,
      matiere: matiere.name,
      professeur: prof_info[1] + " " + prof_info[2],
      email: prof_info[3],
      nbh: cour.nbh,
      type: cour.type,
      TH: cour_info[0],
      somme: cour_info[1],
      date: cour.date,
      prix: matiere_info[1],
      isSigned: x.isSigned,
      isPaid: x.isPaid,
      startTime: x.startTime,
      finishTime: x.finishTime,
    };
    cours.push(data);
  }

  res.status(200).json({
    status: "succés",
    cours,
  });
});
///Get Professeur By ID-----------------------------------------------------------------------------------------
exports.getProfesseurById = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const professeur_find = await Professeur.findById(id);
  if (!professeur_find) {
    return next(
      new AppError("Aucun enseignant trouvé avec cet identifiant !", 404)
    );
  }
  const prof_info = await professeur_find.getInformation();
  if (!prof_info) {
    return next(new AppError("Le donnée de cet enseignant est vide !", 404));
  }
  let matieres = await professeur_find.getMatieres();

  const professeur = {
    _id: professeur_find._id,
    nom: prof_info[1],
    prenom: prof_info[2],
    email: prof_info[3],
  };
  res.status(200).json({
    status: "succés",
    professeur,
    matieres: matieres,
  });
});
///Get Professeur By Email-----------------------------------------------------------------------------------------

exports.getProfesseurEmail = catchAsync(async (req, res, next) => {
  const email = req.params.email;
  const professeur = await Professeur.findOne({
    email: email,
  });
  if (!professeur) {
    return next(new AppError("Aucun enseignant trouvé avec cet e-mail !", 404));
  }
  res.status(200).json({
    status: "succés",
    professeur,
  });
});
exports.addMatiereToProfesseus = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  let prof = await Professeur.findById(id);
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

  if (!prof) {
    return next(
      new AppError("Aucun enseignant trouvé avec cet identifiant !", 404)
    );
  }

  let ms = `La matière est ajouté au liste d'enseigant(e) avec succés .`;
  if (professeur.modifiedCount == 0) {
    ms = `La matière existe déja dans la liste d'enseigant(e) .`;
  }
  res.status(200).json({
    status: "succés",
    message: ms,
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
    return next(
      new AppError("Aucun enseignant trouvé avec cet identifiant !", 404)
    );
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
    status: "succés",
    message: "La matière est supprimé avec succés ",
    professeur,
  });
});
// Add Cours to Professeur ===============================================================
exports.addCoursToProf = catchAsync(async (req, res, next) => {
  const data = req.body;
  const professeur = await Professeur.findById(req.params.id);
  const matiere = await Matiere.findById(req.body.matiere);
  if (!professeur) {
    return next(
      new AppError("Aucun enseignant trouvé avec cet identifiant !", 404)
    );
  }
  if (!matiere) {
    return next(
      new AppError("Aucun matière trouvé avec cet identifiant !", 404)
    );
  }
  const cours = await Cours.create({
    professeur: req.params.id,
    types: req.body.types,
    date: req.body.date,
    startTime: req.body.startTime,
    matiere: req.body.matiere,
  });
  res.status(201).json({
    status: "succés",
    message: `Le cour est ajouté au liste d'enseigant(e) avec succés .`,
    cours,
  });
});
//----------------------------------------------------------------------------------------------
