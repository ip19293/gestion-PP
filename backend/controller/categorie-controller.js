const APIFeatures = require("../utils/apiFeatures");
const Categorie = require("../models/categorie");
const Matiere = require("../models/matiere");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const filterOb = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  c;
  return newObj;
};
/*  1)============================= get All Categorie ======================================================*/
exports.getCategories = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Categorie.find(), req.query);
  const categories_list = await features.query;
  let categories = [];
  for (elem of categories_list) {
    let categorie_info = await elem.getInformation();
    let data = {
      _id: elem._id,
      name: elem.name,
      description: elem.description,
      prix: elem.prix,
      nb_matieres: categorie_info[1],
      code: categorie_info[0],
    };
    categories.push(data);
  }
  res.status(200).json({
    status: "success",
    categories,
  });
});
// 2) delete All Categorie
exports.deleteAllCategories = catchAsync(async (req, res, next) => {
  await Categorie.deleteMany();
  res.status(200).json({
    status: "success",
    message: "all Categories is deleted",
  });
});
// 3) Create new Categorie
exports.addCategorie = catchAsync(async (req, res, next) => {
  const data = req.body;
  const Oldcategorie = await Categorie.findOne({ name: req.body.name });
  if (Oldcategorie) {
    return res.status(400).json({
      status: "fail",
      message: "the categorie name existe before",
    });
  }
  const categorie = await Categorie.create(data);

  res.status(200).json({
    status: "success",
    categorie,
  });
});
// 4) Edit a Categorie
exports.updateCategorie = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const data = req.body;

  const categorie = await Categorie.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!categorie) {
    return next(new AppError("No Categorie found with that ID", 404));
  }
  res.status(201).json({
    status: "success",
    categorie,
  });
});
// 5) Remove a Categorie

exports.deleteCategorie = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const categorie = await Categorie.findById(id);

  if (!categorie) {
    return next(new AppError("No Categorie found with that ID", 404));
  }
  const deleted_categorie = await Categorie.findOneAndDelete(id);
  res.status(200).json({
    status: "success",
    message: deleted_categorie.name,
    categorie,
  });
});
// 6) get Categorie By ID
exports.getCategorieById = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const categorie = await Categorie.findById(id);
  if (!categorie) {
    return next(new AppError("No Categorie found with that ID", 404));
  }
  res.status(200).json({
    status: "success",
    categorie,
  });
});
//Get Categorie matieres
exports.getCategorieMatieres = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const matieres = await Matiere.find({
    categorie: id,
  });

  res.status(200).json({
    status: "success",
    matieres,
  });
});
/* -----------------------------------------------------FONCTIONS------------------------ */
