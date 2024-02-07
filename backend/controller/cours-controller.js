const APIFeatures = require("../utils/apiFeatures");
const Cours = require("../models/cours");
const Professeur = require("../models/professeur");
const Matiere = require("../models/matiere");
const Element = require("../models/element");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const { default: mongoose } = require("mongoose");
const VERIFICATION = require("./functions/verificatin");
exports.getCours = catchAsync(async (req, res, next) => {
  let filter = {};
  if (req.params.id) filter = { cours: req.params.id };
  //EXECUTE QUERY
  const features = new APIFeatures(
    Cours.find(filter),

    req.query
  )
    .filter()
    .sort()
    .limitFields()
    .pagination();
  const cours_list = await Cours.find({});
  let cours = [];
  for (x of cours_list) {
    /*     let professeur = await Professeur.findById(x.professeur);
    let prof_info = await professeur.getInformation(); */
    let cour = await Cours.findById(x._id);
    let cour_info = await cour.getTHSomme();
    let elm_info = await cour.getProfesseurMatiere();
    let data = {
      _id: x._id,
      /*   categorie_id: matiere.categorie,
      matiere_id: x.matiere,
      professeur_id: x.professeur,
      matiere: matiere.name,
      professeur: prof_info[1] + " " + prof_info[2], */
      date: x.date,
      nbh: x.nbh,
      type: x.type,
      isSigned: x.isSigned,
      isPaid: x.isPaid,
      startTime: x.startTime,
      finishTime: x.finishTime,
      element: x.element,
      group: x.group,
      TH: cour_info[0],
      somme: cour_info[1],
      prix: cour_info[7],
      matiere_prix: cour_info[8],
      professeur_id: elm_info[0],
      professeur: elm_info[1] + " " + elm_info[2],
      matiere_id: elm_info[3],
      matiere: elm_info[4],
    };
    cours.push(data);
  }
  res.status(200).json({
    status: "succès",
    cours,
    cours_list,
  });
});

exports.getOneCours = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const cours = await Cours.findById(id);
  if (!cours) {
    return next(
      new AppError("Aucune cours trouvée avec cet identifiant !", 404)
    );
  }
  let cours_info = await cours.getInformation();
  res.status(200).json({
    status: "succès",
    cours_info,
  });
});

/* ==================================================================ADD COURS======================================= */
exports.addCours = catchAsync(async (req, res, next) => {
  /* const professeur = await Professeur.findById(req.body.professeur);
  const matiere = await Matiere.findById(req.body.matiere); */

  /*   if (!professeur) {
    return next(
      new AppError("Aucune enseignant trouvée avec cet identifiant !", 404)
    );
  }
  if (!matiere) {
    return next(
      new AppError("Aucune matiére trouvée avec cet identifiant !", 404)
    );
  } */
  const element = await Element.findById(req.body.element);

  if (!element) {
    return next(
      new AppError("Aucune element trouvée avec cet identifiant !", 404)
    );
  }
  let type = element["professeur" + req.body.type];
  console.log(type);
  const professeur_elm = await Professeur.findById(type);
  let query = professeur_elm
    ? { element: req.body.element, date: req.body.date }
    : {
        professeur: req.body.professeur,
        date: req.body.date,
      };
  if (!professeur_elm) {
    /*    const professeur = await Professeur.findById(req.body.professeur);
    if (!professeur) {
      return next(
        new AppError("Aucune enseignant trouvée avec cet identifiant !", 404)
      );
    } */
    return next(
      new AppError(
        `Il n'y a pas de professeur  ${req.body.type} de cette élément  !`,
        404
      )
    );
  }

  const cours_list = await Cours.find(query);
  const result = VERIFICATION(req.body, cours_list, "enseignant");

  if (result[0] == "failed") {
    console.log(result[0]);
    return next(new AppError(`${result[1]}`, 404));
  }

  /* ------------------------------------------------------ */
  const cours = await Cours.create({
    type: req.body.type,
    nbh: req.body.nbh,
    date: req.body.date,
    startTime: req.body.startTime,
    // professeur: professeur_elm ? undefined : req.body.professeur,
    /*  matiere: req.body.matiere, */
    element: req.body.element,
    /*     group: req.body.group, */
  });

  res.status(201).json({
    status: "succès",
    message: `Le cour est ajouté avec succés `,
    cours,
  });
});
/* ======================================================================EDIT COURS ============================================================== */
exports.updateCours = async (req, res, next) => {
  const id = req.params.id;
  /*   const professeur = await Professeur.findById(req.body.professeur);
  const matiere = await Matiere.findById(req.body.matiere); */
  /*   if (!professeur) {
    return next(
      new AppError("Aucune enseignant trouvée avec cet identifiant !", 404)
    );
  }
  if (!matiere) {
    return next(
      new AppError("Aucune matiére trouvée avec cet identifiant !", 404)
    );
  } */
  const element = await Element.findById(req.body.element);
  if (!element) {
    return next(
      new AppError("Aucune element trouvée avec cet identifiant !", 404)
    );
  }
  let type = element["professeur" + req.body.type];
  console.log(type);
  const professeur_elm = await Professeur.findById(type);
  let query = professeur_elm
    ? { _id: { $ne: id }, element: req.body.element, date: req.body.date }
    : {
        _id: { $ne: id },
        professeur: req.body.professeur,
        date: req.body.date,
      };
  if (!professeur_elm) {
    /*   const professeur = await Professeur.findById(req.body.professeur);
    if (!professeur) {
      return next(
        new AppError("Aucune enseignant trouvée avec cet identifiant !", 404)
      );
    } */
    return next(
      new AppError(
        `Il n'y a pas de professeur  ${req.body.type} de cette élément  !`,
        404
      )
    );
  }
  const cours_list = await Cours.find(query);
  const result = VERIFICATION(req.body, cours_list, "enseignant");

  if (result[0] == "failed") {
    console.log(result[0]);
    return next(new AppError(`${result[1]}`, 404));
  }
  const cours = await Cours.findById(id);
  cours.type = req.body.type;
  cours.nbh = req.body.nbh;
  cours.date = req.body.date;
  cours.startTime = req.body.startTime;
  // cours.professeur = professeur_elm ? undefined : req.body.professeur;
  /*   cours.matiere = req.body.matiere; */
  cours.element = req.body.element;
  cours.group = req.body.group;
  await cours.save();
  if (!cours) {
    return next(
      new AppError("Aucune cours trouvée avec cet identifiant !", 404)
    );
  }

  res.status(200).json({
    status: "succès",
    message: `Le cour est modifie avec succés `,
    cours,
  });
};
/* ============================================================METHODS:s============================================ 
-------------------------------------------------------------------- signe one cour------------------
*/
exports.signeCours = async (req, res, next) => {
  const id = req.params.id;
  const cours = await Cours.findByIdAndUpdate(
    id,
    {
      isSigned: "oui",
    },
    {
      new: true,
      runValidators: true,
    }
  );
  res.status(200).json({
    status: "succès",
    message: "Le cours est signé avec succés .",
    cours,
  });
};
/* -------------------------------------------------------------------- signe all cours not signe------------------ */
exports.signeAllCours = async (req, res, next) => {
  const id = req.params.id;
  const all_cours = await Cours.find({ isSigned: "pas encore" });
  all_cours.forEach(async (elm) => {
    await Cours.findByIdAndUpdate(
      elm._id,
      {
        isSigned: "oui",
      },
      {
        new: true,
        runValidators: true,
      }
    );
  });
  res.status(200).json({
    status: "succès",
    message: "Tous les cours sont signé .",
  });
};
/* =============================================================REMOVE BY ID======================================= */
exports.deleteCours = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const cours = await Cours.findByIdAndDelete({ _id: id });
  if (!cours) {
    return next(
      new AppError("Aucune cours trouvée avec cet identifiant !", 404)
    );
  }
  res.status(200).json({
    status: "succès",
    message: "Le cours est supprimée avec succés .",
  });
});

exports.getNotPaidCours = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const cours = await Cours.aggregate([
    {
      $match: {
        isPaid: "pas encore",
      },
    },
    {
      $group: {
        _id: "professeur",
      },
    },
  ]);

  res.status(200).json({
    status: "succès",
    count: cours.length,
    cours,
  });
});
exports.getPaidCours = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const cours = await Cours.find().populate([
    {
      path: "professeur",
    },
    {
      path: "matiere",
    },
  ]);

  res.status(200).json({
    status: "succès",
    cours,
  });
});

exports.getAllCoursProf = catchAsync(async (req, res, next) => {
  let cours = [];
  let data = {};
  const id = req.params.id;
  const professeur = await Professeur.findById(id);

  if (!professeur) {
    return next(
      new AppError("Aucune enseignant trouvée avec cet identifiant !", 404)
    );
  }
  let prof_info = await professeur.getInfo_Nbh_TH_Nbc_Somme(
    req.body.debit,
    req.body.fin
  );
  let prof = {
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
  const query =
    req.body.debit !== undefined && req.body.fin !== undefined
      ? {
          date: { $gte: debit, $lte: fin },
          /*  professeur: req.params.id, */
          date: { $gte: req.body.debit, $lte: req.body.fin },
          isSigned: "oui",
          isPaid: "pas encore",
        }
      : {
          /*    professeur: req.params.id, */
          isSigned: "oui",
          isPaid: "pas encore",
        };
  const cours_list = await Cours.find(query).sort({ date: 1 });

  for (x of cours_list) {
    let prof_matiere_info = await x.getProfesseurMatiere();
    if (prof_matiere_info[0].equals(id)) {
      let matiere = await Matiere.findById(prof_matiere_info[3]);
      let cour_info = await x.getTHSomme();
      let matiere_info = await matiere.getCodePrixCNameCCode();
      let data = {
        _id: x._id,
        date: x.date,
        type: x.type,
        isSigned: x.isSigned,
        isPaid: x.isPaid,
        startTime: x.startTime,
        finishTime: x.finishTime,
        matiere_id: x.matiere,
        professeur_id: x.professeur,
        categorie_id: matiere.categorie,
        matiere: matiere.name,
        TH: cour_info[0],
        somme: cour_info[1],
        matiere_prix: matiere_info[1],
      };
      cours.push(data);
    }
  }
  res.status(200).json({
    status: "succès",
    first_cours_date: cours[0].date,
    last_cours_date: cours[cours.length - 1].date,
    professeur: prof,
    cours_list,
    cours,
  });
});
exports.getCoursByProfesseursId = catchAsync(async (req, res, next) => {
  let id = req.params.id;
  let cours_list = [];
  let facture = [];
  let cours = [];
  let debit = new Date(req.body.debit);
  let fin = new Date(req.body.fin);
  const professeur = await Professeur.findById(id);
  if (!professeur) {
    return next(
      new AppError("Aucune enseignant trouvée avec cet identifiant !", 404)
    );
  }
  let prof_info = await professeur.getInfo_Nbh_TH_Nbc_Somme(
    req.body.debit,
    req.body.fin
  );
  let prof = {
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
    firstCours: prof_info[11],
    lastCours: prof_info[12],
  };
  const queryMatch =
    req.body.debit !== undefined && req.body.fin !== undefined
      ? {
          $match: {
            date: { $gte: debit, $lte: fin },
            professeur: new mongoose.Types.ObjectId(id),
            isSigned: "oui",
            isPaid: "pas encore",
          },
        }
      : {
          $match: {
            professeur: new mongoose.Types.ObjectId(id),
            isSigned: "oui",
            isPaid: "pas encore",
          },
        };
  cours_list = await Cours.aggregate([
    queryMatch,
    { $group: { _id: "$element", data: { $push: "$$ROOT" } } },
  ]).sort({ date: 1 });
  for (x of cours_list) {
    let element = await Element.findById(x._id);
    let matiere = await Matiere.findById(element.matiere);
    let matiere_info = await matiere.getCodePrixCNameCCode();
    let nbc = x.data.length;
    let nbh = 0;
    let th = 0;
    let somme = 0;
    let prix = matiere_info[1];
    for (y of x.data) {
      let cour = await Cours.findById(y._id);
      let cours_prof_matiere = await cour.getProfesseurMatiere();
      let matiere = await Matiere.findById(cours_prof_matiere[3]);
      let cour_info = await cour.getTHSomme();
      nbh = nbh + cour.nbh;
      th = th + cour_info[0];
      somme = somme + cour_info[1];
      let data = {
        _id: y._id,
        date: y.date,
        type: y.type,
        isSigned: y.isSigned,
        isPaid: y.isPaid,
        startTime: y.startTime,
        finishTime: y.finishTime,
        matiere_id: y.matiere,
        professeur_id: y.professeur,
        nbh: y.nbh,
        categorie_id: matiere.categorie,
        matiere: matiere.name,
        TH: cour_info[0],
        somme: cour_info[1],
        matiere_prix: matiere_info[1],
      };
      cours.push(data);
    }
    let data = {
      nbc: nbc,
      prix: prix,
      nbh: nbh,
      th: th,
      somme: somme,
      matiere: matiere.name,
    };
    facture.push(data);
  }
  let dt = {
    matiere: "TOTAL",
    nbh: prof_info[7],
    th: prof_info[8],
    nbc: prof_info[9],
    somme: prof_info[10],
  };
  facture.push(dt);
  res.status(200).json({
    status: "succès",
    facture,
    professeur: prof,
    cours,
  });
});
