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
  const element = await Element.create({
    name: req.body.name,
    semestre: req.body.semestre,
    filiere: req.body.filiere,
    categorie: req.body.categorie,
    heuresCM: req.body.heuresCM,
    heuresTP: req.body.heuresTP,
    heuresTD: req.body.heuresTD,
    professeurCM:
      req.body.professeurCM != [] ? req.body.professeurCM : undefined,
    professeurTP:
      req.body.professeurTP != [] ? req.body.professeurTP : undefined,
    professeurTD:
      req.body.professeurTD != [] ? req.body.professeurTD : undefined,
  });
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
//add groupes
exports.addGroupesToElement = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const element = await Element.findById(id);
  if (!element) {
    return next(
      new AppError("Aucune matière trouvée avec cet identifiant !", 404)
    );
  }

  if (req.body.TP == undefined) {
    req.body.TP =
      req.body["TP/TD"] != undefined
        ? req.body["TP/TD"]
        : req.body.TD != undefined
        ? req.body.TD
        : undefined;
  }
  if (req.body.TD == undefined) {
    req.body.TD =
      req.body["TP/TD"] != undefined
        ? req.body["TP/TD"]
        : req.body.TP != undefined
        ? req.body.TP
        : undefined;
  }
  const type = ["CM", "TD", "TP"];
  for (let t = 0; t < type.length; t++) {
    let data = [];
    const result = checkDuplicatesOrZero(
      req.body[type[t]] ? req.body[type[t]][0]?.groupe : [],
      req.body[type[t]] ? req.body[type[t]][1]?.groupe : [],

      req.body[type[t]] && req.body[type[t]][2]
        ? req.body[type[t]][2]?.groupe
        : [],
      req.body[type[t]] && req.body[type[t]][3]
        ? req.body[type[t]][3]?.groupe
        : []
    );
    if (result.hasDuplicate) {
      console.log("Has duplicate:", result.hasDuplicate);
      return next(
        new AppError("On peut pas avoir deux groupes avec memes numero!", 404)
      );
    }
    if (result.hasZero) {
      console.log("Has zero:", result.hasZero);
      return next(
        new AppError("On peut pas avoir un groupe avec  numero zero !", 404)
      );
    }
    for (let i = 0; i < req.body[type[t]]?.length; i++) {
      for (let g = 0; g < req.body[type[t]][i].groupe.length; g++) {
        let dt = {
          groupe:
            element["professeur" + [type[t]]][i]._id +
            "-" +
            req.body[type[t]][i].groupe[g],
          professeur: element["professeur" + [type[t]]][i]._id,
        };
        // data.push(dt);
        data.push(
          element["professeur" + [type[t]]][i]._id +
            "-" +
            req.body[type[t]][i].groupe[g]
        );
      }
    }
    const professeurCount = {};
    let groupe = [];
    data.forEach((cmItem, index) => {
      //  let groupeData = cmItem.groupe.split("-");
      let groupeData = cmItem.split("-");
      let professeur = groupeData[0];
      let nb = groupeData[1];
      if (professeur) {
        if (!professeurCount[professeur]) {
          professeurCount[professeur] = 0;
        }
        professeurCount[professeur] += 1;
        let numero = parseInt(nb);
        //  console.log(numero);

        // cmItem.groupe =
        // `${professeur}-${professeurCount[professeur]}` + `-` + numero;
        cmItem = `${professeur}-${professeurCount[professeur]}` + `-` + numero;
        groupe.push(cmItem);
      }
    });
    element[type[t]] = groupe;
  }
  await element.save();
  res.status(201).json({
    status: "succés",
    message: "L'element est modifié avec succés .",
    element,
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
  /*   if (!filiere) {
    return next(
      new AppError("Aucune filiere trouvée avec cet identifiant !", 404)
    );
  } */
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
          let value = x[z] != undefined ? x[z].replace("/ ", "/") : undefined;
          let professeurs = value != undefined ? value.split("/") : undefined;
          if (value != undefined && professeurs != undefined) {
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
          } else {
            return next(
              new AppError("Le fichier importer n'est pas valide !", 404)
            );
          }
        }
        // console.log(numero);
        //categorie verification if not existe added -----------------------------------------
        let categorieCode = x[0].substring(0, 3);
        let categorie = await Categorie.findOne({
          code: categorieCode,
        });
        if (!categorie) {
          try {
            categorie = await Categorie.create({
              name: categorieCode,
            });
          } catch (error) {
            console.log(error);
          }
        }
        if (filiere) {
          let semestres = filiere.semestres.split(",");
          let OlElement = await Element.findOne({
            name: x[1].toLowerCase(),
            filiere: filiere._id,
            semestre: numero,
          });
          if (
            parseInt(semestres[0]) == numero ||
            parseInt(semestres[1]) == numero
          ) {
            if (OlElement) {
              console.log(
                "Element existe deja ---------------------------------------------------"
              );
            } else {
              //ADD ELEMENT TO BD
              // console.log("------" + x[1].toLowerCase());
              try {
                let dt = {
                  categorie: categorie._id,
                  semestre: numero,
                  name: x[1].toLowerCase(),
                  filiere: filiere._id,
                  professeurCM: professeurs_Total[0],
                  professeurTD: professeurs_Total[1],
                  professeurTP: professeurs_Total[2],
                };
                OlElement = await Element.create(dt);
              } catch (error) {
                console.log(error);
              }
            }
          }
        } else {
          let filiere = await Filiere.findOne({ name: categorieCode });
          if (filiere) {
            //add to one filiere
            let OlElement = await Element.findOne({
              name: x[1].toLowerCase(),
              filiere: filiere._id,
              semestre: numero,
            });
            let semestres = filiere.semestres.split(",");
            if (
              !OlElement &&
              (parseInt(semestres[0]) == numero ||
                parseInt(semestres[1]) == numero)
            ) {
              try {
                let dt = {
                  categorie: categorie._id,
                  semestre: numero,
                  name: x[1].toLowerCase(),
                  filiere: filiere._id,
                  professeurCM: professeurs_Total[0],
                  professeurTD: professeurs_Total[1],
                  professeurTP: professeurs_Total[2],
                };
                OlElement = await Element.create(dt);
              } catch (error) {
                console.log(error);
              }
            }
          } else {
            //add to all filiere
            const filieres = await Filiere.find();
            for (let f of filieres) {
              let OlElement = await Element.findOne({
                name: x[1].toLowerCase(),
                filiere: f._id,
                semestre: numero,
              });
              let semestres = f.semestres.split(",");
              if (
                !OlElement &&
                (parseInt(semestres[0]) == numero ||
                  parseInt(semestres[1]) == numero)
              ) {
                try {
                  let dt = {
                    categorie: categorie._id,
                    semestre: numero,
                    name: x[1],
                    filiere: f._id,
                    professeurCM: professeurs_Total[0],
                    professeurTD: professeurs_Total[1],
                    professeurTP: professeurs_Total[2],
                  };
                  OlElement = await Element.create(dt);
                } catch (error) {
                  console.log(error);
                }
              }
            }
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

exports.getElementProfesseursByType = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const element = await Element.findById(id);
  if (!element) {
    return next(
      new AppError("Aucune element trouvée avec cet identifiant !", 404)
    );
  }

  let type = req.body.type;
});
function checkDuplicatesOrZero(...arrays) {
  const combinedArray = arrays.flat(); // Flatten the arrays into a single array
  const seen = new Set();
  let hasDuplicate = false;
  let hasZero = false;

  for (const element of combinedArray) {
    if (element === 0) {
      hasZero = true;
    }
    if (seen.has(element)) {
      hasDuplicate = true;
    }
    seen.add(element);
  }

  return {
    hasDuplicate,
    hasZero,
  };
}
