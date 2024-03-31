const APIFeatures = require("../utils/apiFeatures");
const Cours = require("../models/cours");
const Professeur = require("../models/professeur");
const Element = require("../models/element");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const VERIFICATION = require("./functions/verificatin");
exports.getCours = catchAsync(async (req, res, next) => {
  let filter = {};
  // if (req.params.id) filter = { cours: req.params.id };
  //EXECUTE QUERY
  const features = new APIFeatures(Cours.find(filter), req.query)
    .filter()
    .sort()
    .limitFields()
    .pagination();
  const cours = await features.query;

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
  if (!professeur) {
    return next(
      new AppError("Aucune enseignant trouvée avec cet identifiant !", 404)
    );
  }

  const element = await Element.findById(req.body.element);

  if (!element) {
    return next(
      new AppError("Aucune element trouvée avec cet identifiant !", 404)
    );
  }

  let professeurs = element["professeur" + req.body.type];
  let elements = await Element.find({
    _id: req.body.element,
    professeurCM: { $in: [req.body.professeur] },
  });
  console.log(elements.length);
  /* 
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
// GET COURS SIGNE BY PROFESSEUR ID ------------------------------------------------------------
exports.getSignedCoursByProfesseurId = catchAsync(async (req, res, next) => {
  const professeur = await Professeur.findById(req.params.id);

  if (!professeur) {
    return next(
      new AppError("Aucun enseignant trouvé avec cet identifiant !", 404)
    );
  }
  req.query = {
    professeur: req.params.id,
    isSigned: "effectué",
    date: req.body.debit
      ? { $gte: req.body.debit, $lte: req.body.fin }
      : undefined,
  };

  next();
});
// GET COURS NON SIGNE BY PROFESSEUR ID ------------------------------------------------------------
exports.getNonSignedCoursByProfesseurId = catchAsync(async (req, res, next) => {
  req.query = {
    professeur: req.params.id,
    isSigned: "en attente",
    date: req.body.debit
      ? { $gte: req.body.debit, $lte: req.body.fin }
      : undefined,
  };
  next();
});
//GET ALL COURS BY PROFESSEUR ID ----------------------------------------------------------------
exports.getAllCoursProf = catchAsync(async (req, res, next) => {
  req.query = {
    professeur: req.params.id,
    date: req.body.debit
      ? { $gte: req.body.debit, $lte: req.body.fin }
      : undefined,
  };

  next();
});

exports.getCoursByProfesseursId = catchAsync(async (req, res, next) => {
  let id = req.params.id;
  const professeur = await Professeur.findById(id);
  if (!professeur) {
    return next(
      new AppError("Aucune enseignant trouvée avec cet identifiant !", 404)
    );
  }
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
    // data,
    dt,
    professeur,
    date,
    cours,
    total,
  });
});
