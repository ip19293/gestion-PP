const APIFeatures = require("../utils/apiFeatures");
const Semestre = require("../models/facture");
const Group = require("../models/group");
const Professeur = require("../models/professeur");
const Matiere = require("../models/matiere");
const Emploi = require("../models/emploi");
const Cours = require("../models/cours");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const cron = require("node-cron");
const createPaiementFromProfCours = async () => {
  const date = new Date();
  const dayNumeroInManth = date.getDate();
  console.log(dayNumeroInManth);

  if (dayNumeroInManth >= 25) {
  }
};
