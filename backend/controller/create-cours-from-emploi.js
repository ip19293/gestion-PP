const APIFeatures = require("../utils/apiFeatures");

const Emploi = require("../models/emploi");
const Cours = require("../models/cours");
const VERIFICATION = require("./functions/verificatin");
const cron = require("node-cron");
/* ---------------------auto create cours from emplois ---------------------------------- */
const createCoursFromGroupEmplois = async () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  const day = date.getDay();
  console.log(day);
  let added_cours = [];
  let result = {
    status: "succés",
    message: "",
    day: day,
    date: date,
    today_emplois: [],
    added_cours: [],
    today_cours: [],
  };
  /* -get to day emplois list-------------------------------- */
  const emplois = await Emploi.find({
    dayNumero: day,
  });
  /* get to day cours list-------------------------------------- */

  const list_cours_day = await Cours.find({
    date: {
      $gte: date,
      $lt: new Date(date.getTime() + 24 * 60 * 60 * 1000),
    },
  });
  for (x of emplois) {
    const result = VERIFICATION(x, list_cours_day, "enseignant");

    if (result[0] == "failed") {
      console.log(result[0]);
    } else {
      try {
        const cours = await Cours.create({
          type: x.type,
          date: date,
          startTime: x.startTime,
          professeur: x.professeur,
          groupe: x.groupe,
          element: x.element,
        });
        added_cours.push(cours);
      } catch (error) {}
    }
  }
  result.today_emplois = emplois;
  result.today_cours = list_cours_day;
  result.added_cours = added_cours;
  return result;
};
const auto = async () => {
  try {
    console.log("CRON WORK ============================");
  } catch (error) {
    console.log("CRON NOT WORK ============================", error);
  }
};
const intervallInMilliseconds = 5 * 1000;
const everyDay = " 0 0 * * *";
const every30Minutes = "*/30 * * * *";
const everyNBMinutes = "*/1 * * * *";
const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
cron.schedule(
  everyDay,
  () => {
    createCoursFromGroupEmplois();
  },
  { schedule: true }
);

exports.auto = async (req, res, next) => {
  const result = await createCoursFromGroupEmplois();
  res.status(200).json({
    status: "succés",
    message: result.message,
    day: result.day,
    date: result.date,
    added_cours: result.added_cours,
    today_emplois: result.today_emplois,
    today_cours: result.today_cours,
  });
};
