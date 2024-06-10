const APIFeatures = require("../utils/apiFeatures");
const Cours = require("../models/cours");
const Professeur = require("../models/professeur");
const Element = require("../models/element");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const mongoose = require("mongoose");
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
  const coursData = await features.query;
  const cours = coursData.map((cours) => ({
    ...cours.toObject(),
    professeur: cours.professeur ? cours.professeur._id : null,
    nom: cours.professeur.user ? cours.professeur.user.nom : null,
    prenom: cours.professeur.user ? cours.professeur.user.prenom : null,
    //-----------------------------------------------------------------
    element: cours.element ? cours.element._id : null,
    matiere: cours.element ? cours.element.name : null,
    filiere: cours.element ? cours.element.code.split("-")[0] : null,
    code: cours.element ? cours.element.code.split("-")[1] : null,
    //professeur: undefined,
  }));
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
  } else {
    let gps = element[req.body.type];
    let gp = gps.find((el) => el === req.body.groupe);
    if (!gp) {
      return next(new AppError("Aucune groupe trouvée avec ce numero !", 404));
    }
    const gp_cours = await Cours.aggregate([
      {
        $match: {
          groupe: req.body.groupe,
          isSigned: "effectué",
        },
      },
      {
        $group: {
          _id: null,
          nbh: { $sum: "$nbh" },
        },
      },
      {
        $project: {
          nbh: 1,
        },
      },
    ]);
    if (gp_cours.length > 0) {
      console.log("nombre heures:" + gp_cours[0].nbh);
      if (gp_cours[0].nbh >= element["heures" + req.body.type]) {
        return next(
          new AppError(
            ` Le nombre des heures de ${req.body.type} de ce groupe sont terminer !`,
            404
          )
        );
      }
    }
  }

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
    groupe: req.body.groupe,
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
  } else {
    let gps = element[req.body.type];
    let gp = gps.find((el) => el === req.body.groupe);
    if (!gp) {
      return next(new AppError("Aucune groupe trouvée avec ce numero !", 404));
    }
    const gp_cours = await Cours.aggregate([
      {
        $match: {
          groupe: req.body.groupe,
          isSigned: "effectué",
        },
      },
      {
        $group: {
          _id: null,
          nbh: { $sum: "$nbh" },
        },
      },
      {
        $project: {
          nbh: 1,
        },
      },
    ]);
    if (gp_cours.length > 0) {
      console.log("nombre heures:" + gp_cours[0].nbh);
      if (gp_cours[0].nbh >= element["heures" + req.body.type]) {
        return next(
          new AppError(
            ` Le nombre des heures de ${req.body.type} de ce groupe sont terminer !`,
            404
          )
        );
      }
    }
  }
  let query = {
    _id: { $ne: id },
    professeur: req.body.professeur,
    date: req.body.date,
  };
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
  cours.professeur = req.body.professeur;
  cours.groupe = req.body.groupe;
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
    let type = "heures" + cours_sign.type;
    let element = await Element.findById(cours_sign.element);
    if (element) {
      const gp_cours = await Cours.aggregate([
        {
          $match: {
            groupe: cours_sign.groupe,
            isSigned: "effectué",
          },
        },
        {
          $group: {
            _id: null,
            nbh: { $sum: "$nbh" },
          },
        },
        {
          $project: {
            nbh: 1,
          },
        },
      ]);
      if (gp_cours.length > 0) {
        console.log("nombre heures:" + gp_cours[0].nbh);
        if (gp_cours[0].nbh >= element["heures" + cours_sign.type]) {
          return next(
            new AppError(
              ` Le nombre des heures de ${req.body.type} de ce groupe sont terminer !`,
              404
            )
          );
        }
      }
    }
    query = {
      isSigned: "effectué",
      signedBy: req.user.role,
    };
  } else {
    if (req.user.role === "admin") {
      query =
        req.user.role === "admin"
          ? {
              isSigned: "annulé",
            }
          : {};
      message =
        req.user.role === "admin"
          ? "La signature a été annulé  avec succés."
          : "Seul l'admin qui peut annuler la signature !";
    }
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
  const data = await professeur.paiementDetailResultats(
    req.body.debit,
    req.body.fin
  );
  let cours = data[0].matieres;
  let total = data[0].total;
  /*   let dt = {
    _id: {
      matiere: "total",
    },
    nbh: total.length !== 0 ? total[0].NBH : 0,
    th: total.length !== 0 ? total[0].TH : 0,
    somme: total.length !== 0 ? total[0].SOMME : 0,
    nbc: total.length !== 0 ? total[0].NBC : 0,
  };
  cours.push(dt);
  let date = data.date; */
  res.status(200).json({
    status: "succès",
    data,
    /*  dt,
    professeur,
    date,
    cours,
    total, */
  });
});

exports.getMonthlyCourseCountByProfessor = catchAsync(
  async (req, res, next) => {
    let result = await Cours.aggregate([
      {
        $match: { isSigned: "effectué" },
      },
      {
        $addFields: {
          month: { $month: "$date" },
          year: { $year: "$date" },
        },
      },
      {
        $group: {
          _id: {
            professeur: "$professeur",
            year: "$year",
            month: "$month",
          },

          nbc: { $sum: 1 },
          nbh: { $sum: "$nbh" },
          th: { $sum: "$th" },
          somme: { $sum: "$somme" },
        },
      },
      {
        $sort: {
          professeur: 1,
          year: 1,
          month: 1,
        },
      },

      {
        $lookup: {
          from: "professeurs",
          localField: "_id.professeur",
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
        $project: {
          _id: 0,
          year: "$_id.year",
          month: "$_id.month",
          nbc: 1,
          nbh: 1,
          th: 1,
          somme: 1,
          nom: "$userData.nom",
          prenom: "$userData.prenom",
        },
      },
    ]);
    if (req.params.id) {
      console.log(req.params.id);
      result = await Cours.aggregate([
        {
          $match: {
            isSigned: "effectué",
            professeur: new mongoose.Types.ObjectId(req.params.id),
          },
        },
        {
          $addFields: {
            month: { $month: "$date" },
            year: { $year: "$date" },
          },
        },
        {
          $group: {
            _id: {
              professeur: "$professeur",
              year: "$year",
              month: "$month",
            },

            nbc: { $sum: 1 },
            nbh: { $sum: "$nbh" },
            th: { $sum: "$th" },
            somme: { $sum: "$somme" },
          },
        },
        {
          $sort: {
            professeur: 1,
            year: 1,
            month: 1,
          },
        },

        {
          $lookup: {
            from: "professeurs",
            localField: "_id.professeur",
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
          $project: {
            _id: 0,
            year: "$_id.year",
            month: "$_id.month",
            nbc: 1,
            nbh: 1,
            th: 1,
            somme: 1,
            nom: "$userData.nom",
            prenom: "$userData.prenom",
          },
        },
      ]);
    }

    res.status(200).json({
      status: "succès",
      result,
    });
  }
);
