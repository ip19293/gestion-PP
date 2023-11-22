const APIFeatures = require("../utils/apiFeatures");
const Filliere = require("../models/filliere");
const Semestre = require("../models/semestre");
const Matiere = require("../models/matiere");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const SemestreResponse = require("./json-response/filliere/filliere-semestre-elements");

exports.getSemestres = catchAsync(async (req, res, next) => {
  let filter = {};
  if (req.params.id) filter = { cours: req.params.id };
  const features = new APIFeatures(
    Semestre.find().populate([
      {
        path: "filliere",
      },
    ]),
    req.query
  )
    .filter()
    .sort()
    .limitFields()
    .pagination();
  const semestres = await features.query;
  res.status(200).json({
    status: "success",
    semestres,
  });
});

exports.addSemestre = catchAsync(async (req, res, next) => {
  const data = req.body;
  const filliere = await Filliere.findById(req.body.filliere);
  if (!filliere) {
    return next(
      new AppError(`No filliere found with that ID ${req.body.filliere}`, 404)
    );
  }
  const s = await Semestre.findOne({
    filliere: req.body.filliere,
    numero: req.body.numero,
  });
  if (s) {
    return next(
      new AppError(
        `${filliere.niveau} ${filliere.name} S${req.body.numero} existe before ....`,
        404
      )
    );
  }

  let semestre = new Semestre({
    numero: req.body.numero,
    start: req.body.start,
    filliere: req.body.filliere,
    elements: req.body.elements,
  });
  semestre = await semestre.save();
  res.status(200).json({
    status: "success",
    semestre,
  });
});

exports.updateSemestre = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const data = req.body;
  const filliere = await Filliere.findById(req.body.filliere);
  const s = await Semestre.find({
    filliere: req.body.filliere,
    numero: req.body.numero,
  });
  if (!s._id.equals(id)) {
    return next(
      new AppError(
        `${filliere.niveau} ${filliere.name} S${req.body.numero} existe before ....`,
        404
      )
    );
  }
  const semestre = await Semestre.findById(id);
  semestre.filliere = req.body.filliere;
  semestre.numero = req.body.numero;
  semestre.elements = req.body.elements;
  semestre.start = req.body.start;
  await semestre.save();
  /* const semestre = await Semestre.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  }); */
  if (!semestre) {
    return next(new AppError("No semestre found with that ID", 404));
  }

  res.status(201).json({
    status: "success",
    message: "semestre update successfully",
    semestre: semestre,
  });
});

exports.deleteSemestre = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const semestre = await Semestre.findOneAndDelete(id);
  if (!semestre) {
    return next(new AppError("No semestre found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    message: `semestre ssucceffily delete ...`,
  });
});

/* ------------------------------------------------ add one element to semestre ------------------------------- */

exports.addOneElementToSemestre = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const idM = req.params.idM;
  let message = "";
  const element = await Matiere.findById(idM);
  if (!element) {
    return next(new AppError("No element found with that ID", 404));
  }
  const semestre_up = await Semestre.findById(id);
  if (!semestre_up) {
    return next(new AppError("No semestre found with that ID", 404));
  }
  for (e of semestre_up.elements) {
    if (e.equals(idM)) {
      message = `Element existe before in semestre ...`;
    }
  }
  const semestre = await Semestre.updateMany(
    {
      _id: id,
    },
    {
      $addToSet: {
        elements: idM,
      },
    },
    { new: true }
  );

  if (semestre.modifiedCount != 0) {
    message = `Element added successfully ...`;
  }

  res.status(200).json({
    status: "success",
    message,
    semestre,
  });
});
/* ----------------------------------------------------------remove one element from semestre--------------------- */
exports.deleteOneElementFromSemestre = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const idM = req.params.idM;
  const element = await Matiere.findById(idM);
  if (!element) {
    return next(new AppError("No element found with that ID", 404));
  }

  const Oldsemestre = await Semestre.findById(id);
  if (!Oldsemestre) {
    return next(new AppError("No semestre found with that ID", 404));
  }
  const up_semestre = await Semestre.updateOne(
    {
      _id: id,
    },
    {
      $pull: {
        elements: idM,
      },
    },
    { new: true }
  );
  const semestre = await Semestre.findById(id);
  res.status(200).json({
    status: "success",
    message: "Element was  successfully removed from this semestre ...",
    semestre,
  });
});
/* ------------------------------------------------get semestre by numero and filliere_id ------------------------- */
exports.getSemestreByNumero = catchAsync(async (req, res, next) => {
  const numero = req.params.numero;
  const idF = req.params.idF;
  const semestre = await Semestre.findOne({
    numero: numero,
    filliere: idF,
  }).populate({ path: "filliere" });
  if (!semestre) {
    return next(new AppError("No semestre found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    semestre,
  });
});
/* ------------------------------------------------get semestre element------------------------- */
exports.getSemestreElements = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const semestre = await Semestre.findById(id).populate({ path: "filliere" });
  if (!semestre) {
    return next(new AppError("No semestre found with that ID", 404));
  }
  const filliere = Filliere.findById(semestre.filliere);
  if (!filliere) {
    return next(new AppError("No filliere found with that semestre ID", 404));
  }
  let elements = [];
  let LMD_niveau = ["Licence", "Master", "Doctorat"];
  let LMD_numero = 1;
  for (x of LMD_niveau) {
    if (x == filliere.niveau) {
      LMD_numero = LMD_niveau.indexOf(x) + LMD_numero;
    }
  }
  for (s of semestre.elements) {
    let matiere = await Matiere.findById(s);
    let matiere_info = await matiere.getInformation();
    let code = matiere_info[4] + (await s.numero) + LMD_numero + matiere.numero;
    let data = {
      id: s,
      name_EM: matiere.name,
      code_EM: code,
    };
    elements.push(data);
  }
  const data = await getSemestreElements(semestre);
  res.status(200).json({
    status: "success",
    elements,
  });
});
/* =========================================================GET  */
/* -----------------------------------------------------------FUNCTIONS----------------------- */
/* 1) GET SEMESTRE WITH ELEMENTS  ----------------------------*/
async function getSemestreElements(semestre) {
  const data = [];
  for (const e of semestre.elements) {
    try {
      const matiere = await Matiere.findById(e);
      let matiere_info = await matiere.getInformation();
      let code =
        matiere_info[4] + (await s.numero) + LMD_numero + matiere.numero;
      let s = new SemestreResponse(
        semestre._id,
        semestre.numero,
        semestre.filliere.name,
        semestre.start,
        semestre.finish,
        [e, code, matiere.name]
      );
      data.push(s);
    } catch (error) {
      console.log("Error:", error);
    }
  }
  return data;
}
