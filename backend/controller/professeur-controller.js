const APIFeatures = require("../utils/apiFeatures");
const Element = require("../models/element");
const Professeur = require("../models/professeur");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Cours = require("../models/cours");
const professeur = require("../models/professeur");
const User = require("../auth/models/user");
//------------------------------------------------get all professeurs ------------------------------------------------ */
exports.getProfesseurs = catchAsync(async (req, res, next) => {
  let filter = {};
  if (req.params.id) filter = { cours: req.params.id };
  const features = new APIFeatures(Professeur.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .pagination();
  const professeurs = await features.query;
  res.status(200).json({
    status: "succés",
    professeurs,
  });
});

//ADD NEW PROFESSEUR -----------------------------------------------------------------------------
exports.addProfesseur = catchAsync(async (req, res, next) => {
  const data = req.body;
  const professeur = new Professeur({
    user: req.body.user,
    elements: req.body.elements,
    accountNumero: req.body.accountNumero,
    banque: req.body.banque,
  });
  await professeur.save();
  res.status(200).json({
    status: "succés",
    message: "L'enseignat est ajouté avec succés .",
    professeur,
  });
});
//EDIT PROFESSEUR ---------------------------------------------------------------------------------
exports.updateProfesseur = catchAsync(async (req, res, next) => {
  const professeur = await Professeur.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );
  if (!professeur) {
    return next(
      new AppError("Aucun enseignant trouvé avec cet identifiant !", 404)
    );
  }
  res.status(201).json({
    status: "succés",
    message: "L'enseignat est modifié avec succés .",
    professeur: professeur,
  });
});
//REMOVE PROFESSEUR --------------------------------------------------------------------------------------
exports.deleteProfesseur = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const professeur = await Professeur.findOneAndDelete({ _id: id });
  if (!professeur) {
    return next(
      new AppError("Aucun enseignant trouvé avec cet identifiant !", 404)
    );
  }
  res.status(200).json({
    status: "succés",
    message: professeur.nom,
  });
});

///GET PROFESSEUR BY ID--------------------------------------------------------------------------------------
exports.getProfesseurById = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  console.log(id);
  const Oldprofesseur = await Professeur.findById(id);
  if (!Oldprofesseur) {
    return next(
      new AppError("Aucun enseignant trouvé avec cet identifiant !", 404)
    );
  }

  let prof_cours_detail = await Oldprofesseur.DetailNBH_TH_Nbc_Somme();
  let elements = await Oldprofesseur.getElements();
  let emplois = await Oldprofesseur.getEmplois();
  let lundi = emplois[0];
  /*   "2024-02-20T13:36:43.076Z",
    "2024-02-21T13:36:43.076Z" */
  await Oldprofesseur.getPaiementData();
  res.status(200).json({
    status: "succés",
    lundi,
    emplois,
    elements,
    prof_cours_detail,
    professeur: Oldprofesseur,
  });
});
///Get Professeur By Email-----------------------------------------------------------------------------------------

exports.getProfesseurEmail = catchAsync(async (req, res, next) => {
  req.query = { email: req.params.email };

  next();
});
// ADD ELEMENTS TO PROFESSEUR ------------------------------------------------------------------------------------
exports.addElementToProfesseur = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const Oldprofesseur = await Professeur.findById(id);
  if (!Oldprofesseur) {
    return next(
      new AppError("Aucun enseignant trouvé avec cet identifiant !", 404)
    );
  }
  let type = "professeur" + req.params.type;
  const query = {
    $addToSet: {
      professeurCM: id,
      professeurTD: id,
      professeurTP: id,
    },
  };
  // query.$addToSet[type] = id;

  const element = await Element.findByIdAndUpdate(
    { _id: req.params.idM },
    query,
    { new: true }
  );
  if (!element) {
    return next(
      new AppError("Aucun enseignant trouvé avec cet identifiant !", 404)
    );
  }
  res.status(200).json({
    status: "succés",
    message: `L'enseigant ${Oldprofesseur.nom} ${Oldprofesseur.prenom}  est ajouté a l'élément ${element.name} CM, TD, TP professeurs  avec succés .`,
    element,
  });
});

//REMOVE ELEMENTS FROM PROFESSEUR-----------------------------------------------------------------------------------------
exports.removeElementFromProfesseur = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const Oldprofesseur = await Professeur.findById(id);
  if (!Oldprofesseur) {
    return next(
      new AppError("Aucun enseignant trouvé avec cet identifiant !", 404)
    );
  }
  let type = "professeur" + req.params.type;
  const query = {
    $pull: { professeurCM: id, professeurTD: id, professeurTP: id },
  };
  //query.$pull[type] = id;

  const element = await Element.findByIdAndUpdate(
    { _id: req.params.idM },
    query,
    { new: true, runValidators: true }
  );
  if (!element) {
    return next(
      new AppError("Aucun enseignant trouvé avec cet identifiant !", 404)
    );
  }
  res.status(200).json({
    status: "succés",
    message: `L'enseigant ${Oldprofesseur.nom} ${Oldprofesseur.prenom}  est supprimé de l'élément ${element.name} CM, TD, TP professeurs  avec succés .`,
    element,
  });
});

//UPLOAD PROFESSEURS ------------------------------------------------------------------------------------------
exports.uploadProfesseurs = catchAsync(async (req, res, next) => {
  const XLSX = require("xlsx");
  const fileName = req.file.filename;
  let message = "Le fichier est téléchargé avec succés";
  let url = `C:/Users/HP/Desktop/gestion-PP/backend/uploads/${fileName}`;
  const workbook = XLSX.readFile(url, { cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const uniqueSuffixAccontNumero = Date.now();
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
        const element = await Element.findOne({ name: x[1] });
        for (const [i, prof] of professeursCM.entries()) {
          let professeur = prof.split(" ");
          let nom = professeur[0] != undefined ? professeur[0] : "";
          let prenom = professeur[1] != undefined ? professeur[1] : "";
          let famille = professeur[2] != undefined ? professeur[2] : "";
          let email =
            famille != ""
              ? nom + `.${prenom}` + `.${famille}` + "@supnum.mr"
              : prenom != ""
              ? nom + `.${prenom}` + "@supnum.mr"
              : nom + `.${nom}` + "@supnum.mr";
          email = email.toLowerCase();
          const Olduser = await User.findOne({ email: email });
          if (Olduser) {
            const Oldprofesseur = await Professeur.findOne({
              user: Olduser._id,
            });
            if (!Oldprofesseur) {
              const professeur = await Professeur.create({
                user: Olduser._id,
                accountNumero: uniqueSuffixAccontNumero + `-${index}${z}${i}`,
              });
            }
          } else {
            let dt = {
              nom: nom,
              prenom:
                famille != ""
                  ? prenom + " " + famille
                  : prenom != ""
                  ? prenom
                  : nom,
              email: email,
              password: "1234@supnum",
              passwordConfirm: "1234@supnum",
              photo: "http://localhost:5000/uploads/images/user.png",
              mobile: parseInt(uniqueSuffixAccontNumero + `${index}${z}${i}`),
            };
            try {
              const user = await User.create(dt);
              await Professeur.create({
                user: user._id,
                accountNumero: uniqueSuffixAccontNumero + `-${index}${z}${i}`,
              });
            } catch (error) {}
          }
        }
      }
    }
  }
  res.status(200).json({
    status: "succés",
    finalJsonData,

    message,
  });
});
