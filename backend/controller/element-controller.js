const APIFeatures = require("../utils/apiFeatures");
const Element = require("../models/element");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Professeur = require("../models/professeur");
const Matiere = require("../models/matiere");
const Filiere = require("../models/filiere");
const User = require("../auth/models/user");
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
    let element_info = await x.getFiliere_Matiere();
    //let element_profs = await x.getProfCM_ProfTP_ProfTD();
    let data = {
      _id: x._id,
      semestre: x.semestre,
      matiere: x.matiere,
      filiere: x.filiere,
      heuresCM: x.heuresCM,
      heuresTP: x.heuresTP,
      heuresTD: x.heuresTD,
      code: matiere_info[0],
      taux: matiere_info[1],
      filiere_name: element_info[0].name,
      matiere_mane: element_info[1].name,
      /*       professeurCM: element_profs[0],
      professeurTP: element_profs[1],
      professeurTD: element_profs[2], */
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
  const filiere = await Filiere.findById(req.body.filiere);
  if (!filiere) {
    return next(
      new AppError("Aucune filiere trouvée avec cet identifiant !", 404)
    );
  }
  const OldElement = await Element.findOne({
    filiere: req.body.filiere,
    semestre: req.body.semestre,
    matiere: req.body.matiere,
  });
  if (OldElement) {
    return next(new AppError("L'element existe déja !", 404));
  }
  let TD =
    req.body.professeurTD === undefined || req.body.professeurTD === ""
      ? undefined
      : req.body.professeurTD;
  let CM =
    req.body.professeurCM === undefined || req.body.professeurCM === ""
      ? undefined
      : req.body.professeurCM;
  let TP =
    req.body.professeurTP === undefined || req.body.professeurTP === ""
      ? undefined
      : req.body.professeurTP;
  const element = await Element.create({
    matiere: req.body.matiere,
    semestre: req.body.semestre,
    filiere: req.body.filiere,
    professeurCM: CM,
    professeurTD: TD,
    professeurTP: TP,
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
  const matiere = await Matiere.findById(req.body.matiere);
  if (!element) {
    return next(
      new AppError("Aucune element trouvée avec cet identifiant !", 404)
    );
  }

  if (!matiere) {
    return next(
      new AppError("Aucune matiére trouvée avec cet identifiant !", 404)
    );
  }
  const filiere = await Filiere.findById(req.body.filiere);
  if (!filiere) {
    return next(
      new AppError("Aucune filiere trouvée avec cet identifiant !", 404)
    );
  }
  const OldElement = await Element.findOne({
    semestre: req.body.semestre,
    filiere: req.body.filiere,
    matiere: req.body.matiere,
  });
  if (OldElement && !OldElement._id.equals(id)) {
    return next(new AppError("L'element existe déja !", 404));
  }

  element.semestre = req.body.semestre;
  element.matiere = req.body.matiere;
  element.professeurCM = req.body.professeurCM;
  element.professeurTD = req.body.professeurTD;
  element.professeurTP = req.body.professeurTP;
  /*   element.professeurCM =
    req.body.professeurCM != "" ? req.body.professeurCM : undefined;
  element.professeurTD =
    req.body.professeurTD != "" ? req.body.professeurTD : undefined;
  element.professeurTP =
    req.body.professeurTP != "" ? req.body.professeurTP : undefined; */
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
  let prix = await element.getPrix();
  if (!element) {
    return next(
      new AppError("Aucune matière trouvée avec cet identifiant !", 404)
    );
  }
  res.status(200).json({
    status: "succés",
    //element: element,
    prix,
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
/* =================================================================ADD professeur to element ==================*/
exports.addProfesseurToElements = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  let elem = await Element.findById(id);
  let query = {
    professeurCM: undefined,
    professeurTD: undefined,
    professeurTP: undefined,
  };
  if (!elem) {
    return next(
      new AppError("Aucune element trouvée avec cet identifiant !", 404)
    );
  }
  const profCM = await Professeur.findById(req.body.professeurCM);
  const profTP = await Professeur.findById(req.body.professeurTP);
  const profTD = await Professeur.findById(req.body.professeurTD);
  if (profCM) query.professeurCM = req.body.professeurCM;
  if (profTP) query.professeurTP = req.body.professeurTP;
  if (profTD) query.professeurTD = req.body.professeurTD;
  const element = await Element.updateMany(
    {
      _id: id,
    },
    {
      $addToSet: query,
    }
  );
  let ms = `Le donnée  est ajouté  avec succés .`;
  if (element.modifiedCount == 0) {
    ms = `Le donnée existe déja  !`;
  }
  res.status(200).json({
    status: "succés",
    message: ms,
    element,
  });
});
//----------------------------------------------------------------------------------------------
exports.uploadElements = catchAsync(async (req, res, next) => {
  const id = req.params.id;
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
    /*  range: "B1:E1:F1" + emploiName["!ref"].split(":")[1].replace(/\D/g, ""), */
  });
  const finalJsonData = columnData.filter((row) => row.length > 0);
  const filiere = await Filiere.findById(id);
  if (!filiere) {
    return next(
      new AppError("Aucune filiere trouvée avec cet identifiant !", 404)
    );
  }
  let numero = 0;
  /*   if (
    ["code", "CodeEM", "Code"].includes(finalJsonData[1][0]) &&
    ["nom", "Titre", "nom de la matiere"].includes(finalJsonData[1][1])
  ) { */
  for (const [index, x] of finalJsonData.entries()) {
    if (x[0] == null || x[0] === "code" || x[0] === "CodeEM") {
      console.log(x[1]);
      if (x.length === 2) {
        numero = parseInt(x[1].match(/\d+/)[0]);
      }
    } else {
      const matiere = await Matiere.findOne({ name: x[1] });
      const element = await Element.findOne({ matiere: matiere._id });
      let professeurs_Total = [[], [], []];
      for (let z = 4; z < 7; z++) {
        let value = x[z].replace("/ ", "/");
        let professeursCM = value.split("/");
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
              professeurs_Total[z - 4].push(Oldprofesseur._id);
            } else {
              console.log("NOT existing professeurs ....................");
            }
          }
        }
      }
      if (matiere && !element) {
        try {
          let dt = {
            matiere: matiere._id,
            semestre: numero,
            filiere: filiere._id,
            professeurCM: professeurs_Total[0],
            professeurTD: professeurs_Total[1],
            professeurTP: professeurs_Total[2],
          };

          const element = await Element.create(dt);
          console.log(dt);
        } catch (error) {}
      } else {
        console.log("NOT EXISTING MATIERE  --------------------------");
      }
    }
  }
  /* 
      for (let z = 4; z < 7; z++) {
        let value = x[z].replace("/ ", "/");
        let professeursCM = value.split("/");
        const matiere = await Matiere.findOne({ name: x[1] });

        console.log(matiere + "------------------------------------");
         professeursCM = professeursCM.filter((el) => el !== " ");
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
