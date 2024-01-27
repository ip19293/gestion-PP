const APIFeatures = require("../utils/apiFeatures");
const Semestre = require("../models/semestre");
const Group = require("../models/group");
const Professeur = require("../models/professeur");
const Matiere = require("../models/matiere");
const Filliere = require("../models/filliere");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Emploi = require("../models/emploi");
const { default: mongoose } = require("mongoose");
const matiere = require("../models/matiere");
const professeur = require("../models/professeur");

exports.getGroups = catchAsync(async (req, res, next) => {
  let filter = {};
  if (req.params.id) filter = { cours: req.params.id };
  const features = new APIFeatures(
    Group.find().populate([
      {
        path: "semestre",
      },
    ]),
    req.query
  )
    .filter()
    .sort()
    .limitFields()
    .pagination();
  const groups = await features.query;
  res.status(200).json({
    status: "succés",
    groups,
  });
});
/* ================================================================ ADD GROUP ========================= */
exports.addGroup = catchAsync(async (req, res, next) => {
  const semestre = await Semestre.findById(req.body.semestre);
  if (!semestre) {
    return next(
      new AppError(
        `Aucun semestre trouvé avec identifiant ${req.body.semestre} !`,
        404
      )
    );
  }
  const filliere = await Filliere.findById(semestre.filliere);
  if (!filliere) {
    return next(
      new AppError(`Aucun filiere trouvé avec cet identifiant !`, 404)
    );
  }
  let group = await Group.findOne({
    semestre: req.body.semestre,
    numero: req.body.numero,
    type: req.body.type,
  });
  let ms = `Le groupe ${req.body.numero} ${req.body.type} existe déja dans S${semestre.numero} ${filliere.niveau} ${filliere.name} !`;

  if (group) {
    return next(new AppError(ms, 404));
  }

  group = new Group({
    numero: req.body.numero,
    type: req.body.type,
    semestre: req.body.semestre,
    startEmploi: req.body.startEmploi,
  });
  group = await group.save();
  res.status(200).json({
    status: "succés",
    message: "Le groupe est ajouté avec succés .",
    group,
  });
});
/* ================================================================ EDIT GROUP ========================= */
exports.updateGroup = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const group = await Group.findById(id);
  if (!group) {
    return next(
      new AppError(
        "Aucun groupe trouvé avec cet identifiant introuvable !",
        404
      )
    );
  }
  const semestre = await Semestre.findOne({ _id: req.body.semestre });
  if (!semestre) {
    return next(
      new AppError(
        `Aucun semstre trouvé avec l'identifiant ${req.body.semestre}`,
        404
      )
    );
  }
  const filliere = await Filliere.findById(semestre.filliere);
  if (!filliere) {
    return next(
      new AppError(`Aucun filiere trouvé avec cet identifiant !`, 404)
    );
  }
  const gp = await Group.findOne({
    _id: { $ne: id },
    semestre: req.body.semestre,
    numero: req.body.numero,
    type: req.body.type,
  });

  let ms = `Le groupe ${req.body.numero} ${req.body.type} existe déja dans S${semestre.numero} ${filliere.niveau} ${filliere.name} !`;

  if (gp) {
    return next(new AppError(ms, 404));
  }
  group.semestre = req.body.semestre;
  group.numero = req.body.numero;
  group.type = req.body.type;
  await group.save();
  res.status(201).json({
    status: "succés",
    message: "Le groupe modifié avec succés .",
    group: group,
  });
});
/* ================================================================GET  GROUP BY ID ========================= */

exports.getGroupById = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const group = await Group.findById(id);
  if (!group) {
    return next(
      new AppError(
        "Aucun groupe trouvé avec cet identifiant introuvable !",
        404
      )
    );
  }
  const semestre = await Semestre.findById(group.semestre);
  const filliere = await Filliere.findById(semestre.filliere);
  const group_emplois = await Emploi.aggregate([
    {
      $match: {
        group: new mongoose.Types.ObjectId(id),
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

  res.status(200).json({
    status: "succés",
    filliere: filliere.name,
    description: filliere.description,
    niveau: filliere.niveau,
    semestre: semestre.numero,
    semestre_id: semestre._id,
    group_id: group._id,
    group_emplois,
  });
});
/* ================================================================REMOVE GROUP ========================= */

exports.deleteGroup = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const group = await Group.findOneAndDelete({ _id: id });
  if (!group) {
    return next(
      new AppError(
        "Aucun groupe trouvé avec cet identifiant introuvable !",
        404
      )
    );
  }

  res.status(200).json({
    status: "succés",
    message: `Le groupe est supprimé avec succés avec liste d'emploi .`,
  });
});

/* ================================================================ GET ALL GROUPS IN FILLIERE  ========================= */
exports.getAllGroupsInFilliere = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const filliere = await Filliere.findById(id);
  let message = "";
  if (!filliere) {
    return next(
      new AppError("Aucun filière trouvé avec cet identifiant !", 404)
    );
  }
  const semestres = await Semestre.find({ filliere: id }).sort({ numero: 1 });

  if (semestres.length == 0) {
    message = message + "Aucun semestre trouvé dans cette filière";
  }

  let all_groups = [];
  let semestre_names = [];
  let groups = [];
  for (x of semestres) {
    const gps = await Group.find({ semestre: x._id });
    let ss = {
      numero: x.numero,
      _id: x._id,
    };
    semestre_names.push(ss);
    if (gps.length != 0) {
      for (y of gps) {
        let data = {
          niveau: filliere.niveau,
          semestre: x._id,
          semestre_numero: x.numero,
          _id: y._id,
          numero: y.numero,
          type: y.type,
        };
        all_groups.push(data);
        groups.push(y);
      }
    }
  }

  if (all_groups.length == 0) {
    message = message + "Aucun groupe trouvé dans cette filière .";
  }
  res.status(200).json({
    status: "succés",
    message,
    semestre_names,
    all_groups,
    filliere: filliere.name,
    description: filliere.description,
    niveau: filliere.niveau,
  });
});
/* =============================================================GET GROUP EMPLOIS=================================================== */
exports.getGroupEmplois = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const group = await Group.findById(id);
  if (!group) {
    return next(
      new AppError(
        "Aucun groupe trouvé avec cet identifiant introuvable !",
        404
      )
    );
  }
  let group_info = await group.getSNumero_FId_FName_FNiveau_NiveauAnnee();
  const semestre = await Semestre.findById(group.semestre);
  const filliere = await Filliere.findById(semestre.filliere);
  const emplois_list = await Emploi.aggregate([
    {
      $match: {
        group: new mongoose.Types.ObjectId(id),
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
  /*   emplois_list.sort((a, b) => {
    const ta_startTime = timeToMinutes(a.startTime);
    const tb_startTime = timeToMinutes(b.startTime);
    return ta_startTime + a.dayNumero - (tb_startTime + b.dayNumero);
  }); */

  let emplois = [];
  for (x of emplois_list) {
    let em = await Emploi.findById(x._id);
    let dt = await em.getProfesseurMatiere();
    let day = await em.getDayName();
    let data = {
      id: x._id,
      group: x.group,
      day: day,
      startTime: x.startTime,
      finishTime: x.finishTime,
      dayNumero: x.dayNumero,
      element: x.element,
      matiere_id: dt[3],
      professeur: dt[1] + " " + dt[2],
      professeur_id: dt[0],
      matiere: dt[4],
      type: x.type,
      nbh: x.nbh,
    };
    emplois.push(data);
  }
  res.status(200).json({
    status: "succés",
    filliere: filliere.name,
    description: filliere.description,
    annee: group_info[4],
    semestre: group_info[0],
    niveau: filliere.niveau,
    group: group.numero,
    group_type: group.type,
    emplois,
  });
});
/* --------------------------------------------------------- */
function timeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}
