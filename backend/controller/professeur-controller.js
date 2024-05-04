const APIFeatures = require("../utils/apiFeatures");
const Element = require("../models/element");
const Professeur = require("../models/professeur");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Cours = require("../models/cours");
const User = require("../auth/models/user");

// Total Paiement Resultat -----------------------------------------------------------------------------------------
exports.totalResultats = catchAsync(async (req, res, next) => {
  const id = req.params.id;

  const matchQuery =
    req.body.debit !== undefined && req.body.fin !== undefined
      ? {
          date: {
            $gte: new Date(req.body.debit),
            $lte: new Date(req.body.fin),
          },
          isSigned: "effectué",
          isPaid: "en attente",
        }
      : {
          isSigned: "effectué",
          isPaid: "en attente",
        };
  const result = await Cours.aggregate([
    {
      $match: matchQuery,
    },
    {
      $lookup: {
        from: "professeurs",
        localField: "professeur",
        foreignField: "_id",
        as: "professeurData",
      },
    },
    { $unwind: "$professeurData" },
    {
      $lookup: {
        from: "users",
        localField: "professeurData.user",
        foreignField: "_id",
        as: "userData",
      },
    },
    { $unwind: "$userData" },
    {
      $group: {
        _id: "$professeur",
        fromDate: {
          $min: {
            $cond: [
              { $eq: [req.body.debit, undefined] },
              "$date",
              new Date(req.body.debit),
            ],
          },
        },
        toDate: {
          $max: {
            $cond: [
              { $eq: [req.body.fin, undefined] },
              "$date",
              new Date(req.body.fin),
            ],
          },
        },
        first_cours_date: { $min: "$date" },
        last_cours_date: { $max: "$date" },
        nbc: { $sum: 1 },
        nbh: { $sum: "$nbh" },
        somme: { $sum: "$somme" },
        nom: { $first: "$userData.nom" },
        prenom: { $first: "$userData.prenom" },
        email: { $first: "$userData.email" },
        banque: { $first: "$professeurData.banque" },
        accountNumero: { $first: "$professeurData.accountNumero" },
        user: { $first: "$userData._id" },
      },
    },
  ]);
  res.status(200).json({
    status: "succés",
    result,
  });
});
//------------------------------------------------get all professeurs ------------------------------------------------ */
exports.getProfesseurs = catchAsync(async (req, res, next) => {
  let filter = {};
  if (req.params.id) filter = { cours: req.params.id };

  const features = new APIFeatures(Professeur.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .pagination();
  const professeursData = await features.query;
  const professeurs = professeursData.map((professeur) => ({
    ...professeur.toObject(),
    user: professeur.user ? professeur.user._id : null,
    nom: professeur.user ? professeur.user.nom : null,
    prenom: professeur.user ? professeur.user.prenom : null,
    email: professeur.user ? professeur.user.email : null,
    mobile: professeur.user ? professeur.user.mobile : null,
  }));
  res.status(200).json({
    status: "succés",
    professeurs,
  });
});

//ADD NEW PROFESSEUR -----------------------------------------------------------------------------
exports.addProfesseur = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.body.user);
  if (user) {
    const old_professeur = await Professeur.findOne(user._id);
    if (old_professeur) {
      return next(
        new AppError("L'identifient d'utilisateur n'est pas valide !", 401)
      );
    }
  } else {
    return next(new AppError("Aucun utilisateur n'est trouver avec ID !", 401));
  }
  const professeur = new Professeur({
    user: req.body.user,
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
    message:
      "L'eneignant(e) est suupprimé  et ces [ cours, emploi] avec succés .",
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
  /*  
 
  let emplois = await Oldprofesseur.getEmplois();
  let lundi = emplois[0]; */
  /*   "2024-02-20T13:36:43.076Z",
    "2024-02-21T13:36:43.076Z" */
  const resultats = await Oldprofesseur.paiementTotalResultats();
  res.status(200).json({
    status: "succés",
    professeur: Oldprofesseur,
  });
});
///GET PROFESSEUR ELEMENTS --------------------------------------------------------------------------------------
exports.getElements = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  console.log(id);
  const Oldprofesseur = await Professeur.findById(id);
  if (!Oldprofesseur) {
    return next(
      new AppError("Aucun enseignant trouvé avec cet identifiant !", 404)
    );
  }
  let elements = await Oldprofesseur.getElements(req.body.type);

  res.status(200).json({
    status: "succés",
    professeur: Oldprofesseur,
    elements,
  });
});
///GET professeur paiement detail -----------------------------------------------------------------------------------
exports.paiementDetailResultats = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  console.log(id);
  const Oldprofesseur = await Professeur.findById(id);
  if (!Oldprofesseur) {
    return next(
      new AppError("Aucun enseignant trouvé avec cet identifiant !", 404)
    );
  }
  const resultats = await Oldprofesseur.paiementDetailResultats(
    req.body.fromDate,
    req.body.toDate
  );

  let cours = resultats[0].matieres;
  let dt = {
    name: "total",
    nbh: resultats[0].total.length !== 0 ? resultats[0].total[0].nbh : 0,
    th: resultats[0].total.length !== 0 ? resultats[0].total[0].th : 0,
    somme: resultats[0].total.length !== 0 ? resultats[0].total[0].somme : 0,
    nbc: resultats[0].total.length !== 0 ? resultats[0].total[0].nbc : 0,
    fromDate:
      resultats[0].total.length !== 0
        ? resultats[0].total[0].fromDate
        : undefined,
    toDate:
      resultats[0].total.length !== 0
        ? resultats[0].total[0].toDate
        : undefined,
    first_cours_date:
      resultats[0].total.length !== 0
        ? resultats[0].total[0].first_cours_date
        : undefined,
    last_cours_date:
      resultats[0].total.length !== 0
        ? resultats[0].total[0].last_cours_date
        : undefined,
  };
  cours.push(dt);

  res.status(200).json({
    status: "succés",
    _id: Oldprofesseur._id,
    nom: Oldprofesseur.user.nom,
    prenom: Oldprofesseur.user.prenom,
    email: Oldprofesseur.user.email,
    accountNumero: Oldprofesseur.accountNumero,
    banque: Oldprofesseur.banque,
    cours,
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
  let type = "professeur" + req.body.type;
  let query =
    req.body.type === undefined
      ? {
          $addToSet: {
            professeurCM: id,
            professeurTD: id,
            professeurTP: id,
          },
        }
      : {
          $addToSet: {
            [type]: id,
          },
        };

  const element = await Element.findByIdAndUpdate(
    { _id: req.params.idM },
    query,
    { new: true }
  );
  if (!element) {
    return next(
      new AppError("Aucun element trouvé avec cet identifiant !", 404)
    );
  }
  res.status(200).json({
    status: "succés",
    message: `L'élément  ${element.name} est ajouté au liste   ${
      req.body.type != undefined ? req.body.type : "CM, TD, TP"
    } professeur  avec succés .`,
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
  let type = "professeur" + req.body.type;
  const query =
    req.body.type === undefined
      ? {
          $pull: { professeurCM: id, professeurTD: id, professeurTP: id },
        }
      : {
          $pull: { [type]: id },
        };
  const element = await Element.findByIdAndUpdate(
    { _id: req.params.idM },
    query,
    { new: true, runValidators: true }
  );
  if (!element) {
    return next(
      new AppError("Aucun element trouvé avec cet identifiant !", 404)
    );
  }
  res.status(200).json({
    status: "succés",
    message: `L'élément ${element.name}  est supprimé de liste   ${
      req.body.type != undefined ? req.body.type : "CM, TD, TP"
    } de professeur  avec succés .`,
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
