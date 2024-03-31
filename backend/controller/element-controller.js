const APIFeatures = require("../utils/apiFeatures");
const Element = require("../models/element");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Professeur = require("../models/professeur");
const Categorie = require("../models/categorie");
const Filiere = require("../models/filiere");
const User = require("../auth/models/user");
exports.getElements = catchAsync(async (req, res, next) => {
  let filter = {};
  if (req.params.id) filter = { cours: req.params.id };
  const features = new APIFeatures(Element.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .pagination();
  const elements = await features.query;

  res.status(200).json({
    status: "succés",
    elements,
  });
});

//ADD ELEMENT ===========================================================================
exports.addElement = catchAsync(async (req, res, next) => {
  const data = req.body;
  const categorie = await Categorie.findById(req.body.categorie);
  if (!categorie) {
    return next(
      new AppError("Aucune categorie trouvée avec cet identifiant !", 404)
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
    name: req.body.name,
  });
  if (OldElement) {
    return next(new AppError("L'element existe déja !", 404));
  }
  const element = await Element.create(data);
  res.status(200).json({
    status: "succés",
    message: "La matière est ajouté avec succés .",
    element: element,
  });
});
//EDIT ELEMENT ==============================================================================
exports.updateElement = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const element = await Element.findById(id);
  if (!element) {
    return next(
      new AppError("Aucune element trouvée avec cet identifiant !", 404)
    );
  }

  const OldElement = await Element.findOne({
    semestre: req.body.semestre,
    filiere: req.body.filiere,
    name: req.body.name,
  });
  if (OldElement && !OldElement._id.equals(id)) {
    return next(new AppError("L'element existe déja !", 404));
  }

  element.semestre =
    req.body.semestre != undefined ? req.body.semestre : element.semestre;
  element.name = req.body.name != undefined ? req.body.name : element.name;
  element.categorie =
    req.body.categorie != undefined ? req.body.categorie : element.categorie;
  element.filiere =
    req.body.filiere != undefined ? req.body.filiere : element.filiere;
  element.professeurCM =
    req.body.professeurCM != undefined
      ? req.body.professeurCM
      : element.professeurCM;
  element.professeurTD =
    req.body.professeurTD != undefined
      ? req.body.professeurTD
      : element.professeurTD;
  element.professeurTP =
    req.body.professeurTP != undefined
      ? req.body.professeurTP
      : element.professeurTP;
  element.heuresCM =
    req.body.heuresCM != undefined ? req.body.heuresCM : element.heuresCM;
  element.heuresTD =
    req.body.heuresTD != undefined ? req.body.heuresTD : element.heuresTD;
  element.heuresTP =
    req.body.heuresTP != undefined ? req.body.heuresTP : element.heuresTP;
  await element.save();
  res.status(201).json({
    status: "succés",
    message: "L'element est modifié avec succés .",
    element,
  });
});
//REMOVE ELEMENT =======================================================================
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
    message: `L'element est supprimé avec succés .`,
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

// ADD ELEMENT TO PROFESSEUR =====================================================================
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

//GET ELEMENTS BY CATEGORIE---------------------------------------------------------------------
exports.getElementsByCategorieId = catchAsync(async (req, res, next) => {
  req.query = {
    categorie: req.params.id,
  };
  next();
});
//  UPLOAD ELEMENTS----------------------------------------------------------------------------
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
  ) */ {
    for (const [index, x] of finalJsonData.entries()) {
      if (x[0] == null || x[0] === "code" || x[0] === "CodeEM") {
        console.log(x[1]);
        if (x.length === 2) {
          numero = parseInt(x[1].match(/\d+/)[0]);
        }
      } else {
        let professeurs_Total = [[], [], []];
        for (let z = 4; z < 7; z++) {
          //GET PROFESSEURS CM TD TP LISTE
          let value = x[z].replace("/ ", "/");
          let professeurs = value.split("/");
          for (prof of professeurs) {
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
            const OldUser = await User.findOne({ email: email });
            if (OldUser && OldUser.role === "professeur") {
              let Oldprofesseur = await Professeur.findOne({
                user: OldUser._id,
              });
              if (Oldprofesseur) {
                professeurs_Total[z - 4].push(Oldprofesseur._id);
              } else {
                console.log("NOT existing professeurs ....................");
              }
            }
          }
        }
        console.log(numero);
        let categorieCode = x[0].substring(0, 3);
        let categorie = await Categorie.findOne({
          code: categorieCode,
        });
        let OlElement = await Element.findOne({
          name: x[1].toLowerCase(),
          filiere: filiere._id,
          semestre: numero,
        });
        if (OlElement) {
          console.log(
            "Element existe deja ---------------------------------------------------"
          );
        } else {
          //ADD ELEMENT TO BD
          let dt = {
            categorie: categorie ? categorie._id : "",
            semestre: numero,
            name: x[1],
            filiere: filiere._id,
            professeurCM: professeurs_Total[0],
            professeurTD: professeurs_Total[1],
            professeurTP: professeurs_Total[2],
          };
          // verifier si le categorie existe
          if (categorie) {
            try {
              OlElement = await Element.create(dt);
              //console.log("OK");
            } catch (error) {
              //console.log(error.message);
            }
          } else {
            try {
              console.log(
                "NOUVELLE CATEGORIE --------------------------------"
              );
              let newCategorie = await Categorie.create({
                name: categorieCode,
              });
              dt.categorie = newCategorie._id;

              OlElement = await Element.create(dt);
            } catch (error) {}
          }
        }
        // ADD ELEMENT TO  LISTE ELEMENTS OF PROFESSEURS
        /*    try {
          await Professeur.updateMany(
            {
              $or: [
                { _id: { $in: professeurs_Total[0] } },
                { _id: { $in: professeurs_Total[1] } },
                { _id: { $in: professeurs_Total[2] } },
              ],
            },
            {
              $addToSet: {
                elements: OlElement ? OlElement._id : undefined,
              },
            }
          );
        } catch (error) {
          console.log(error.message);
        } */
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
