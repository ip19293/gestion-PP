const APIFeatures = require("../utils/apiFeatures");
const Matiere = require("../models/matiere");
const Professeur = require("../models/professeur");
const Element = require("../models/element");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Categorie = require("../models/categorie");
const semestre = require("../models/semestre");
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

/* ==================================================upload matiere data ======================================== */
exports.uploadMatieres = catchAsync(async (req, res, next) => {
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
    range: "A1:B" + emploiName["!ref"].split(":")[1].replace(/\D/g, ""),
  });
  const finalJsonData = columnData.filter((row) => row.length > 0);
  const categoris = await Categorie.find();

  if (
    ["code", "CodeEM", "Code"].includes(finalJsonData[1][0]) &&
    ["nom", "Titre", "nom de la matiere"].includes(finalJsonData[1][1])
  ) {
    for (const [index, x] of finalJsonData.entries()) {
      if (x[0] == null || x[0] === "code" || x[0] === "CodeEM") {
        console.log(x[1]);
      } else {
        const Oldmatiere = await Matiere.findOne({ name: x[1] });
        if (!Oldmatiere) {
          //find categorie by code
          const categorie = await Categorie.findOne({
            code: x[0].substring(0, 3),
          });
          if (categorie) {
            console.log("La matiere n'existe pas !");
            let dt = {
              categorie: categorie._id,
              code: x[0].substring(0, 3),
              name: x[1],
            };
            console.log(dt);
            const matiere = new Matiere(dt);
            await matiere.save();
            console.log(matiere);
          } else {
            console.log("Le catégorie n'existe pas !");
            let name = x[0].substring(0, 3);
            const categorie = await Categorie.findOne({
              name: name.toLowerCase(),
            });
            if (!categorie) {
              let dt = {
                name: x[0].substring(0, 3),
                description: x[0].substring(0, 3),
              };
              const newCategorie = new Categorie(dt);
              await newCategorie.save();
              if (newCategorie) {
                let data = {
                  categorie: newCategorie._id,
                  code: x[0].substring(0, 3),
                  name: x[1],
                };
                const matiere = new Matiere(data);
                await matiere.save();
              }
            }
          }
        }
      }
    }
  } else {
    message = "Le fichier non valide !";
  }

  console.log(jsonData[4][0]);
  console.log(fileName);
  res.status(200).json({
    status: "succés",
    finalJsonData,
    message,
  });
});
exports.deleteAllMatieres = catchAsync(async (req, res, next) => {
  await Matiere.deleteMany();
  res.status(200).json({
    status: "succés",
    message: "all matieres is deleted",
  });
});
exports.getElementsByMatiereId = catchAsync(async (req, res, next) => {
  let elements = [];
  const elements_list = await Element.find({
    matiere: req.params.id,
  });
  for (el of elements_list) {
    let element = await Element.findById(el._id);
    let element_info = await element.getFiliere_Matiere();
    let dt = {
      _id: el._id,
      creditCM: el.creditCM,
      semestre: el.semestre,
      filiere: element_info[0],
      matiere: element_info[1],
    };
    elements.push(dt);
  }

  res.status(200).json({
    status: "succés",
    elements,
  });
});
exports.getProfesseursByMatiereId = catchAsync(async (req, res, next) => {
  let filter = {};
  let professeurs = [];
  const professeurs_list = await Professeur.find({
    matieres: req.params.id,
  });
  for (x of professeurs_list) {
    let professeur = await Professeur.findById(x._id);
    let prof_info = await professeur.getInfo_Nbh_TH_Nbc_Somme();
    let dt = {
      _id: x._id,
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
