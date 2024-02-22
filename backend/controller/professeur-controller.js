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
  const professeurs = await features.query;

  /* for (let x of professeurs_list) {
    let prof_info = await x.getInfo_Nbh_TH_Nbc_Somme();
    if (prof_info[0]) {
      let data = {
        _id: x._id,
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
  } */

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

  if (!professeur) {
    return next(
      new AppError("Aucun enseignant trouvé avec cet identifiant !", 404)
    );
  }
  const cours = await Cours.find({ professeur: id });
  /* let cours = [];
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
  } */
  res.status(200).json({
    status: "succés",
    cours,
  });
});
exports.getProfCoursSigned = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const professeur = await Professeur.findById(id);

  if (!professeur) {
    return next(
      new AppError("Aucun enseignant trouvé avec cet identifiant !", 404)
    );
  }
  const cours = await Cours.find({ professeur: id, isSigned: "effectué" });
  /*  const cours_lsit = await Cours.find({ professeur: id, isSigned: "oui" });
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
  } */
  res.status(200).json({
    status: "succés",
    cours,
  });
});
exports.getProfCoursNon = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const professeur = await Professeur.findById(id);
  /*   let prof_info = await professeur.getNbh_TH_Nbc_Somme(); */
  if (!professeur) {
    return next(
      new AppError("Aucun enseignant trouvé avec cet identifiant !", 404)
    );
  }
  const cours = await Cours.find({
    professeur: id,
    isSigned: "en attente",
  });
  /*   let cours = [];
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
 */
  res.status(200).json({
    status: "succés",
    cours,
  });
});
///Get Professeur By ID-----------------------------------------------------------------------------------------
exports.getProfesseurById = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  console.log(id);
  const Oldprofesseur = await Professeur.findById(id);
  if (!Oldprofesseur) {
    return next(
      new AppError("Aucun enseignant trouvé avec cet identifiant !", 404)
    );
  }
  const prof_info = await Oldprofesseur.getUserInformation();
  if (!prof_info) {
    return next(new AppError("Le donnée de cet enseignant est vide !", 404));
  }
  let matieres = await Oldprofesseur.getMatieres();
  let prof_cours_detail = await Oldprofesseur.DetailNBH_TH_Nbc_Somme();
  let elements = await Oldprofesseur.getElements();
  let emplois = await Oldprofesseur.getEmplois();
  let lundi = emplois[0];
  /*   "2024-02-20T13:36:43.076Z",
    "2024-02-21T13:36:43.076Z" */

  res.status(200).json({
    status: "succés",
    lundi,
    emplois,
    elements,
    prof_cours_detail,
    matieres: matieres,
    professeur: Oldprofesseur,
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
exports.uploadProfesseurs = catchAsync(async (req, res, next) => {
  const XLSX = require("xlsx");
  const fileName = req.file.filename;
  let message = "Le fichier est téléchargé avec succés";
  let url = `C:/Users/HP/Desktop/gestion-PP/backend/uploads/${fileName}`;
  const workbook = XLSX.readFile(url, { cellDates: true });
  const sheetName = workbook.SheetNames[0];
  console.log(sheetName);
  const emploiName = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(emploiName);

  // Extract data from the first two columns
  const columnData = XLSX.utils.sheet_to_json(emploiName, {
    header: 1,
  });
  const finalJsonData = columnData.filter((row) => row.length > 0);

  for (const [index, x] of finalJsonData.entries()) {
    if (x[0] == null || x[0] === "code" || x[0] === "CodeEM") {
      console.log(x[1]);
    } else {
      for (let z = 4; z < 7; z++) {
        let value = x[z].replace("/ ", "/");
        let professeursCM = value.split("/");
        const matiere = await Matiere.findOne({ name: x[1] });
        for (prof of professeursCM) {
          let professeur = prof.split(" ");
          let famille = professeur[2] != undefined ? "." + professeur[2] : "";
          let email =
            professeur[1] != undefined
              ? professeur[0] +
                `.${professeur[1]}` +
                `${famille}` +
                "@supnum.mr"
              : professeur[0] + `.${professeur[0]}` + "@supnum.mr";
          email = email.toLowerCase();

          const Olduser = await User.findOne({ email: email });
          if (Olduser) {
            const Oldprofesseur = await Professeur.findOne({
              user: Olduser._id,
            });
            if (!Oldprofesseur) {
              const professeur = await Professeur.create({
                user: Olduser._id,
                matieres: matiere._id,
              });
            } else {
              await Professeur.updateOne(
                {
                  _id: Oldprofesseur._id,
                },
                {
                  $addToSet: {
                    matieres: matiere._id,
                  },
                }
              );
            }
          } else {
            let dt = {
              nom: professeur[0],
              prenom:
                professeur[1] != undefined
                  ? professeur[1] + " " + famille
                  : professeur[0],
              email: email,
              password: "1234@supnum",
              passwordConfirm: "1234@supnum",
              photo: "http://localhost:5000/uploads/images/user.png",
            };
            try {
              const user = await User.create(dt);
              const professeur = await Professeur.create({
                user: user._id,
                matieres: matiere._id,
              });
            } catch (error) {}
          }
        }
      }
    }
  }
  /* 
  for (const [index, x] of finalJsonData.entries()) {
    if (x[0] == null || x[0] === "code" || x[0] === "CodeEM") {
      console.log(x[1]);
    } else {
      for (let z = 4; z < 7; z++) {
        let value = x[z].replace("/ ", "/");
        let professeursCM = value.split("/");
        const matiere = await Matiere.findOne({ name: x[1] });
        for (prof of professeursCM) {
          let professeur = prof.split(" ");
          let famille = professeur[2] != undefined ? "." + professeur[2] : "";
          let email =
            professeur[1] != undefined
              ? professeur[0] +
                `.${professeur[1]}` +
                `${famille}` +
                "@supnum.mr"
              : professeur[0] + `.${professeur[0]}` + "@supnum.mr";
         const OldUser = await User.findOne({ email: email });
          if (OldUser && OldUser.role === "professeur") {
            let Oldprofesseur = await Professeur.findOne({ user: OldUser._id });
            if (Oldprofesseur) {
              if (matiere) {
                await Professeur.updateOne(
                  {
                    _id: Oldprofesseur._id,
                  },
                  {
                    $addToSet: {
                      matieres: matiere._id,
                    },
                  }
                );
              } else {
                console.log("Matiere not existe --------------------------");
              }
              console.log("prof existing ....................");
            }
          } else {
            let dt = {
              nom: professeur[0],
              prenom:
                professeur[1] != undefined
                  ? professeur[1] + " " + famille
                  : professeur[0],
              email: email,
              password: "1234@supnum",
              passwordConfirm: "1234@supnum",
            };
            try {
              const user = await User.create(dt);
              if (user) {
                const professeur = await Professeur.create({
                  user: user._id,
                  matieres: matiere._id,
                });
               
              }
          
            } catch (error) {}
          }
        }
      }
    }
  } */

  res.status(200).json({
    status: "succés",
    finalJsonData,

    message,
  });
});
