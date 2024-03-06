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
  const features = new APIFeatures(Cours.find(filter), req.query)
    .filter()
    .sort()
    .limitFields()
    .pagination();
  const cours = await await features.query;

  /*   
let cours = [];
for (let cour of cours_list) {
    let cour_info = await cour.getTHSomme();
    let elm_info = await cour.getProfesseurMatiere();
    let data = {
      _id: cour._id,
      date: cour.date,
      nbh: cour.nbh,
      type: cour.type,
      isSigned: cour.isSigned,
      isPaid: cour.isPaid,
      startTime: cour.startTime,
      finishTime: cour.finishTime,
      element: cour.element,
      group: cour.group,
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
  } */
  res.status(200).json({
    status: "succès",
    cours,
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

  res.status(200).json({
    status: "succès",
    cours,
  });
});

/* ==================================================================ADD COURS======================================= */
exports.addCours = catchAsync(async (req, res, next) => {
  const professeur = await Professeur.findById(req.body.professeur);
  /*  const matiere = await Matiere.findById(req.body.matiere); */
  if (!professeur) {
    return next(
      new AppError("Aucune enseignant trouvée avec cet identifiant !", 404)
    );
  }

  /* 
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
  /*  let type = element["professeur" + req.body.type];
   console.log(type);
  const professeur_elm = await Professeur.findById(type);
  let query = professeur_elm
    ? { element: req.body.element, date: req.body.date }
    : {
        professeur: req.body.professeur,
        date: req.body.date,
      };
  if (!professeur_elm) {
       const professeur = await Professeur.findById(req.body.professeur);
    if (!professeur) {
      return next(
        new AppError("Aucune enseignant trouvée avec cet identifiant !", 404)
      );
    }
    return next(
      new AppError(
        `Il n'y a pas de professeur  ${req.body.type} de cette élément  !`,
        404
      )
    );
  } */

  const cours_list = await Cours.find({
    professeur: req.body.professeur,
    date: req.body.date,
  });
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
    professeur: req.body.professeur,
    element: req.body.element,
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
  let message = "Le cours est signé avec succés .";
  const cours_sign = await Cours.findById(id);
  if (!cours_sign) {
    return next(
      new AppError("Aucune cours trouvée avec cet identifiant !", 404)
    );
  }
  if (cours_sign.isSigned === "annulé" && cours_sign.signedBy != "admin") {
    return next(
      new AppError(
        "La signature a été annulé afin que le cours ne soit pas compté !",
        404
      )
    );
  }
  const professeur = await Professeur.findById(cours_sign.professeur);
  if (!professeur) {
    return next(
      new AppError("Aucune professeur trouvée avec cet identifiant !", 404)
    );
  }
  let query = {};
  if (cours_sign.isSigned === "annulé") {
    query =
      req.user.role === "admin"
        ? {
            isSigned: "en attente",
            signedBy: undefined,
          }
        : {};
    message =
      req.user.role === "admin"
        ? "La signature mise en attente par l'admin avec succés."
        : "La signature a été annulé seul d'admin peut mise en attente ";
  } else if (cours_sign.isSigned === "en attente") {
    query = {
      isSigned: "effectué",
      signedBy: req.user.role,
    };
    await professeur.setNBC_NBH_SOMME(cours_sign);
  } else {
    query =
      req.user.role === "admin"
        ? {
            isSigned: "annulé",
          }
        : {};
    await professeur.setNBC_NBH_SOMME(cours_sign, "remove");
    message =
      req.user.role === "admin"
        ? "La signature a été annulé  avec succés."
        : "Seul l'admin qui peut annuler la signature !";
  }
  const cours = await Cours.findOneAndUpdate({ _id: id }, query, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "succès",
    message,
    cours,
  });
};
/* -------------------------------------------------------------------- signe all cours not signe------------------ */
exports.signeAllCours = async (req, res, next) => {
  const id = req.params.id;
  const all_cours = await Cours.find({ isSigned: "en attente" });
  all_cours.forEach(async (elm) => {
    await Cours.findByIdAndUpdate(
      elm._id,
      {
        isSigned: "effectué",
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
        isPaid: "en attente",
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
  let prof_info = await professeur.getNbh_TH_Nbc_Somme(
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
          isSigned: "effectué",
          isPaid: "en attente",
        }
      : {
          /*    professeur: req.params.id, */
          isSigned: "effectué",
          isPaid: "en attente",
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
  const professeur = await Professeur.findById(id);
  if (!professeur) {
    return next(
      new AppError("Aucune enseignant trouvée avec cet identifiant !", 404)
    );
  }
  let prof_info = await professeur.getUserInformation(
    req.body.debit,
    req.body.fin
  );
  const data = await professeur.DetailNBH_TH_Nbc_Somme(
    req.body.debit,
    req.body.fin
  );
  let cours = data.cours[0].matiere;
  let total = data.cours[0].total;
  let dt = {
    _id: {
      matiere: "total",
    },
    nbh: total.length !== 0 ? total[0].NBH : 0,
    th: total.length !== 0 ? total[0].TH : 0,
    somme: total.length !== 0 ? total[0].SOMME : 0,
    nbc: total.length !== 0 ? total[0].NBC : 0,
  };
  cours.push(dt);
  let date = data.date;
  res.status(200).json({
    status: "succès",
    dt,
    professeur,
    date,
    cours,
    total,
  });
});
