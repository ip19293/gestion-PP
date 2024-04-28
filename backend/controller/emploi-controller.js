const APIFeatures = require("../utils/apiFeatures");
const Emploi = require("../models/emploi");
const Professeur = require("../models/professeur");
const Element = require("../models/element");
const Filiere = require("../models/filiere");
const User = require("../auth/models/user");
const Categorie = require("../models/categorie");
const mongoose = require("mongoose");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const VERIFICATION = require("./functions/verificatin");
exports.getEmplois = catchAsync(async (req, res, next) => {
  let filter = {};
  if (req.params.id) filter = { emplois: req.params.id };
  const features = new APIFeatures(Emploi.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .pagination();
  const emplois = await features.query;
  // const data = functions.emploi_respone(emploi);
  res.status(200).json({
    status: "succés",
    emplois,
  });
});
/* =======================================================================GET BY ID=================================== */
exports.getEmploiById = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const emploi = await Emploi.findById(id);
  if (!emploi) {
    return next(
      new AppError("Aucun emploi trouvé avec cet identifiant !", 404)
    );
  }
  let professeurs = await emploi.getEmploiProfesseurs();
  res.status(200).json({
    status: "succés",
    emploi,
    professeurs,
  });
});

/* ==============================================================ADD EMPLOI============================== */
exports.addEmploi = catchAsync(async (req, res, next) => {
  const element = await Element.findById(req.body.element);

  if (!element) {
    return next(
      new AppError("Aucun élément trouvé avec cet identifiant !", 404)
    );
  } else {
    let professeurs = element["professeur" + req.body.type];
    let prof = professeurs.find((el) =>
      el.equals(new mongoose.Types.ObjectId(req.body.professeur))
    );
    console.log(new mongoose.Types.ObjectId(req.body.professeur));
    //let professeur = await Professeur.findById(type);
    if (!prof) {
      /*   return next(
        new AppError(
          `Ce professeur  ne fait pas partie des professeurs de ${req.body.type}  pour  l'elément !`,
          404
        )
      ); */
    }
  }

  const emplois_day = await Emploi.find({
    dayNumero: req.body.dayNumero,
    filiere: req.body.filiere,
  });

  const result_filiere = VERIFICATION(req.body, emplois_day, "filiere");

  if (result_filiere[0] == "failed") {
    console.log(result_filiere[0]);
    return next(new AppError(`${result_filiere[1]}`, 404));
  }
  const cours_list = await Emploi.find({
    professeur: req.body.professeur,
    dayNumero: req.body.dayNumero,
  });
  const result_prof = VERIFICATION(req.body, cours_list, "enseigant");
  if (result_prof[0] == "failed") {
    console.log(result_prof[0]);
    return next(new AppError(`${result_prof[1]}`, 404));
  }
  /* ------------------------------------------------------ */
  let emploi = new Emploi({
    type: req.body.type,
    nbh: req.body.nbh,
    startTime: req.body.startTime,
    element: req.body.element,
    dayNumero: req.body.dayNumero,
    filiere: req.body.filiere,
    professeur: req.body.professeur,
  });
  emploi = await emploi.save();
  res.status(201).json({
    status: "succés",
    message: `L'emploi ajouté avec succés .`,
    emploi,
  });
});
/* ===================================================================UPDATE bY ID======================================== */
exports.updateEmploi = async (req, res, next) => {
  const id = req.params.id;
  const element = await Element.findById(req.body.element);

  const emploi = await Emploi.findById(id);
  if (!emploi) {
    return next(
      new AppError("Aucun emploi trouvé avec cet identifiant !", 404)
    );
  }
  if (!element) {
    return next(
      new AppError("Aucun élément trouvé avec cet identifiant !", 404)
    );
  } else {
    let type = element["professeur" + req.body.type];
    console.log(type);
    let professeur = await Professeur.findById(type);
    if (!professeur) {
      return next(
        new AppError(
          `Il n'y a pas de professeur  ${req.body.type} de cette élément  !`,
          404
        )
      );
    }
  }
  const emplois_day = await Emploi.find({
    _id: { $ne: id },
    dayNumero: req.body.dayNumero,
    group: req.body.group,
  });
  const result = VERIFICATION(req.body, emplois_day, "groupe");

  if (result[0] == "failed") {
    console.log(result[0]);
    return next(new AppError(`${result[1]}`, 404));
  }
  const cours_list = await Emploi.find({
    _id: { $ne: id },
    element: req.body.element,
    dayNumero: req.body.dayNumero,
  });
  const result_prof = VERIFICATION(req.body, cours_list, "enseigant");
  if (result_prof[0] == "failed") {
    console.log(result_prof[0]);
    return next(new AppError(`${result_prof[1]}`, 404));
  }
  emploi.type = req.body.type;
  emploi.nbh = req.body.nbh;
  emploi.startTime = req.body.startTime;
  emploi.element = req.body.element;
  emploi.dayNumero = req.body.dayNumero;
  await emploi.save();

  res.status(200).json({
    status: "succés",
    message: `Emploi modifié avec succés .`,
    emploi,
  });
};
/* =============================================================REMOVE BY ID======================================= */
exports.deleteEmploi = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const emploi = await Emploi.findByIdAndDelete({ _id: id });
  if (!emploi) {
    return next(
      new AppError("Aucun emploi trouvé avec cet identifiant !", 404)
    );
  }
  res.status(200).json({
    status: "succés",
    message: "L'emploi supprimé avec succés .",
  });
});
/* ====================================================================GET PROFESSEUR EMPLOI====================*/
exports.getEmploisByProfesseurId = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const professeur = await Professeur.findById(id);

  if (!professeur) {
    return next(new AppError("Aucun enseignant trouvé !", 404));
  }

  const emplois = await Emploi.aggregate([
    {
      $match: {
        professeur: new mongoose.Types.ObjectId(id),
      },
    },
    {
      $addFields: {
        hour: {
          $toInt: {
            $arrayElemAt: [{ $split: ["$startTime", ":"] }, 0],
          },
        },
        minute: {
          $toInt: {
            $arrayElemAt: [{ $split: ["$startTime", ":"] }, 1],
          },
        },
      },
    },
    {
      $sort: {
        dayNumero: 1,
        hour: 1,
        minute: 1,
      },
    },
  ]);

  /*   const groupedEmploi = emplois.reduce((acc, obj) => {
    const key = obj.day;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(obj);

    return acc;
  }, {}); */
  /*  let data = [];
  if (groupedEmploi.Dimanche) data.push(groupedEmploi.Dimanche);
  if (groupedEmploi.Lundi) data.push(groupedEmploi.Lundi);
  if (groupedEmploi.Mardi) data.push(groupedEmploi.Mardi);
  if (groupedEmploi.Mercredi) data.push(groupedEmploi.Mercredi);
  if (groupedEmploi.Jeudi) data.push(groupedEmploi.Jeudi);
  if (groupedEmploi.Vendredi) data.push(groupedEmploi.Vendredi);
  if (groupedEmploi.Samedi) data.push(groupedEmploi.Samedi); */
  res.status(200).json({
    status: "succés",
    /*   groupedEmploi, */
    emplois,
  });
});
/* ====================================================================Upload emplois =====================================*/
exports.uploadEmplois = catchAsync(async (req, res, next) => {
  /*   const id = req.params.id;
    const filiere = await Filiere.findById(id); */
  const XLSX = require("xlsx");
  const fileName =
    req.file !== undefined ? req.file.filename : "choisiez un fichier !";
  if (!req.file) {
    return next(new AppError(fileName, 404));
  }
  let message = "Le fichier est téléchargé et les emplois ajoutée avec succés";
  let url = `C:/Users/HP/Desktop/gestion-PP/backend/uploads/${fileName}`;
  const workbook = XLSX.readFile(url, { cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  console.log(sheetName);
  const emploiName = workbook.Sheets[sheetName];

  // Create an object to store summed column values
  const columnSums = {};

  // Iterate over each cell in the sheet
  for (const cellAddress in sheet) {
    if (cellAddress[0] === "!" || isNaN(cellAddress[1])) {
      // Skip non-cell data
      continue;
    }

    const cellValue = sheet[cellAddress].v;
    if (sheet[XLSX.utils.decode_cell(cellAddress).c]) {
      const columnName = sheet[XLSX.utils.decode_cell(cellAddress).c].v;
    } else {
      continue;
    }

    // Check if the column is labeled "facteur commun" and the cell value is a number
    if (columnName === "A" && !isNaN(cellValue)) {
      // Sum the values in the "A" column
      columnSums["A"] = (columnSums["A"] || 0) + cellValue;
    }
  }

  // Convert the sheet to JSON
  const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  // Update the JSON data with summed "facteur commun" column values
  jsonData.forEach((row, rowIndex) => {
    row.forEach((cell, columnIndex) => {
      if (sheet[XLSX.utils.decode_cell({ c: columnIndex }).c]) {
        const columnName =
          sheet[XLSX.utils.decode_cell({ c: columnIndex }).c].v;
        if (columnName === "A" && !isNaN(cell)) {
          // Replace the original value with the summed value
          jsonData[rowIndex][columnIndex] = columnSums["A"];
        }
      }
    });
  });
  const finalJsonData = jsonData.filter((row) => row.length > 0);
  console.log(jsonData[4][0]);

  // Remove null and empty values from the JSON data
  const filteredJsonData = finalJsonData.map((row) =>
    row.filter((cell) => cell !== null && cell !== undefined && cell !== "")
  );
  let filiere = "";
  let emplois = [];
  let daysOfWeek = [
    "Dimanche",
    "Lundi",
    "Mardi",
    "Mercredi",
    "Jeudi",
    "Vendredi",
    "Samedi",
  ];
  let startTime_List = ["8:00", "9:45", "11:30", "15:00", "17:00"];
  for (const [index, x] of finalJsonData.entries()) {
    // console.log(x.length);
    if (x.length == 1) filiere = x[0].split("-")[0];
    if (x.length == 21 && x[0] !== null && x[0] !== undefined && x[0] !== "") {
      for (let y = 1; y < 18; y = y + 4) {
        let dt = {};
        if (x[y] !== null && x[y] !== undefined && x[y] !== "") {
          let st =
            y == 1
              ? "8:00"
              : y == 5
              ? "9:45"
              : y == 9
              ? "11:30"
              : y == 13
              ? "15:00"
              : y == 17
              ? "17:00"
              : "";
          let matiere_index =
            y == 1 ? index + 1 : finalJsonData[index + 1].length - 1;
          let professeur_index =
            y == 1 ? index + 2 : finalJsonData[index + 2].length - 1;
          let matiere =
            y == 1
              ? finalJsonData[matiere_index][1].toLowerCase()
              : finalJsonData[index + 1][matiere_index].toLowerCase();
          let professeur =
            y == 1
              ? finalJsonData[professeur_index][1]
              : finalJsonData[index + 2][professeur_index];
          let element = await Element.findOne({
            name: matiere,
          });
          let professeur_data = professeur.split("/");
          let famille =
            professeur_data[2] != undefined ? "." + professeur_data[2] : "";
          let email =
            professeur_data[1] != undefined
              ? professeur_data[0] +
                `.${professeur_data[1]}` +
                `${famille}` +
                "@supnum.mr"
              : professeur_data[0] + `.${professeur_data[0]}` + "@supnum.mr";
          email = email.toLowerCase();
          let Oldprofesseur = await Professeur.findOne({
            email: email,
          });

          let data = {
            jour: x[0],
            dayNumero: daysOfWeek.indexOf(x[0]),
            code: x[y],
            type: x[y + 1],
            startTime: st,
            nbh: 1.5,
            element: element ? element._id : "",
            professeur: Oldprofesseur ? Oldprofesseur._id : "",
            matiere: matiere,
          };
          if (!Oldprofesseur) {
            const Olduser = await User.findOne({ email: email });
            let dt = {
              nom: professeur_data[0],
              prenom:
                professeur_data[1] != undefined
                  ? professeur_data[1] + " " + famille
                  : professeur_data[0],
              email: email,
              password: "1234@supnum",
              passwordConfirm: "1234@supnum",
              photo: "http://localhost:5000/uploads/images/user.png",
            };
            const user = Olduser ? Olduser : await User.create(dt);
            const professeur = await Professeur.create({
              user: user._id,
              matieres: element.matiere,
            });
            data.professeur = professeur._id;
          } else {
            try {
              await Professeur.updateOne(
                {
                  _id: Oldprofesseur._id,
                },
                {
                  $addToSet: {
                    matieres: element.matiere,
                  },
                }
              );
            } catch (error) {}
          }
          if (!element) {
            try {
              const newCategorie = new Categorie({
                name: data.code.substring(0, 3),
                description: data.code.substring(0, 3),
              });
              await newCategorie.save();
              let dataM = {
                categorie: newCategorie._id,
                name: data.matiere,
              };
              // const matiere = new Matiere(dataM);
              // await matiere.save();
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
              const filiere = await Filiere.findOne({ name: filiere });
              let dt = {
                matiere: matiere._id,
                semestre: numero,
                filiere: filiere._id,
                professeurCM: Oldprofesseur._id,
                professeurTD: Oldprofesseur._id,
                professeurTP: Oldprofesseur._id,
              };

              const element = await Element.create(dt);
              data.element = element._id;
            } catch (error) {}
          } else {
            await Element.updateOne(
              {
                _id: element._id,
              },
              {
                $addToSet: {
                  professeurCM: Oldprofesseur._id,
                  professeurTP: Oldprofesseur._id,
                  professeurTD: Oldprofesseur._id,
                },
              }
            );
          }
          /* -----------------------------------------------------Creation d'emploi----------------------------------------- */
          const cours_list = await Emploi.find({
            professeur: data.professeur,
            dayNumero: data.dayNumero,
          });
          const result_prof = VERIFICATION(data, cours_list, "enseigant");
          if (result_prof[0] == "failed") {
            message =
              "Le fichier est téléchargé et les emplois ajoutée avec succés, et certaines emplois n'ont pas été enregistrées en rasion de la synchronisation de leur calender avec d'autre emplois";
            /*   console.log(result_prof[0]);
             return next(new AppError(`${result_prof[1]}`, 404)); */
          } else {
            let emploi = new Emploi(data);
            emploi = await emploi.save();
            emplois.push(emploi);
            console.log(emploi);
          }
        }
      }
      /*    if (x[1] !== null && x[1] !== undefined && x[1] !== "") {
        let matiere_index = index + 1;
        let professeur_index = index + 2;
        let matiere = finalJsonData[matiere_index][1].toLowerCase();
        let element = await Element.findOne({
          "info.name": matiere,
        });
        let dt = {
          jour: x[0],
          dayNumero: daysOfWeek.indexOf(x[0]),
          code: x[1],
          type: x[2],
          startTime: "8:00",
          nbh: 1.5,
          element: element._id,
          professeur: finalJsonData[professeur_index][1],
          matiere: finalJsonData[matiere_index][1],
        };
        emplois.push(dt);
        console.log(dt);
      }
      if (x[5] !== null && x[5] !== undefined && x[5] !== "") {
        let professeur_index = finalJsonData[index + 2].length - 1;
        let matiere_index = finalJsonData[index + 1].length - 1;
        let matiere = finalJsonData[index + 1][matiere_index].toLowerCase();
        let element = await Element.findOne({
          "info.name": matiere,
        });
        let dt = {
          jour: x[0],
          dayNumero: daysOfWeek.indexOf(x[0]),
          code: x[5],
          type: x[6],
          startTime: "9:45",
          nbh: 1.5,
          element: element._id,
          professeur: finalJsonData[index + 2][professeur_index],
          matiere: finalJsonData[index + 1][matiere_index],
        };
        emplois.push(dt);
        console.log(dt);
      }
      if (x[9] !== null && x[9] !== undefined && x[9] !== "") {
        let professeur_index = finalJsonData[index + 2].length - 1;
        let matiere_index = finalJsonData[index + 1].length - 1;
        let matiere = finalJsonData[index + 1][matiere_index].toLowerCase();
        let element = await Element.findOne({
          "info.name": matiere,
        });
        let dt = {
          jour: x[0],
          dayNumero: daysOfWeek.indexOf(x[0]),
          code: x[9],
          type: x[10],
          startTime: "11:30",
          nbh: 1.5,
          element: element._id,
          professeur: finalJsonData[index + 2][professeur_index],
          matiere: finalJsonData[index + 1][matiere_index],
        };
        emplois.push(dt);
        console.log(dt);
      }
      if (x[13] !== null && x[13] !== undefined && x[13] !== "") {
        let professeur_index = finalJsonData[index + 2].length - 1;
        let matiere_index = finalJsonData[index + 1].length - 1;
        let matiere = finalJsonData[index + 1][matiere_index].toLowerCase();
        let element = await Element.findOne({
          "info.name": matiere,
        });
        let dt = {
          jour: x[0],
          dayNumero: daysOfWeek.indexOf(x[0]),
          code: x[13],
          type: x[14],
          startTime: "15:00",
          nbh: 1.5,
          element: element._id,
          professeur: finalJsonData[index + 2][professeur_index],
          matiere: finalJsonData[index + 1][matiere_index],
        };

        console.log(dt);
      }
      if (x[17] !== null && x[17] !== undefined && x[17] !== "") {
        let professeur_index = finalJsonData[index + 2].length - 1;
        let matiere_index = finalJsonData[index + 1].length - 1;
        let matiere = finalJsonData[index + 1][matiere_index].toLowerCase();
        let element = await Element.findOne({
          "info.name": matiere,
        });
        let dt = {
          jour: x[0],
          dayNumero: daysOfWeek.indexOf(x[0]),
          code: x[17],
          type: x[18],
          startTime: "17:00",
          nbh: 1.5,
          element: element._id,
          professeur: finalJsonData[index + 2][professeur_index],
          matiere: finalJsonData[index + 1][matiere_index],
        };
        emplois.push(dt);
        console.log(dt);
      } */
    }
  }

  console.log(filiere);
  res.status(200).json({
    status: "succés",
    emplois,

    message,
  });
});
