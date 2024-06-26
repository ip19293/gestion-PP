const APIFeatures = require("../utils/apiFeatures");
const Emploi = require("../models/emploi");
const Cours = require("../models/cours");

const VERIFICATION = require("./functions/verificatin");
const cron = require("node-cron");
/* ---------------------auto create cours from emplois ---------------------------------- */
const createCoursFromGroupEmplois = async () => {
  const date = new Date();
  const day = date.getDay();
  console.log(day);
  let result = {
    status: "succés",
    message: "",
    day: day,
    emplois: [],
    list_cannot_added: [],
    list_will_added: [],
    added_cours: [],
  };
  let list_will_added = [];
  let list_cannot_added = [];
  let added_cours = [];
  const emplois = await Emploi.find({
    dayNumero: day,
  });

  /* const list_cours_day = await Cours.find({
    $where: async function () {
      let day_cours = await day;
      return this.date.getDay() === day_cours;
    },
  }); */

  const list_cours_day = await Cours.find({
    date: {
      $gte: date,
      $lt: new Date(date.getTime() + 24 * 60 * 60 * 1000),
    },
  });
  if (emplois.length == 0) {
    result.message =
      "Aucun cours creaté aujourd'hui appartir d'emploi du temps ." +
      result.message;
  } else {
    if (emplois.length != 0 && list_cours_day.length == 0) {
      for (x of emplois) {
        list_will_added.push(x);
      }
      result.message = `succés de création de ${emplois.length} cours appartir d'emploi du temps aujourd'hui .`;
    } else {
      for (x of emplois) {
        const result = VERIFICATION(x, list_cours_day, "enseignant");

        if (result[0] == "failed") {
          list_cannot_added.push(x);
          console.log(result[0]);
        } else {
          list_will_added.push(x);
        }
      }
    }
    if (list_will_added.length != 0) {
      for (x of list_will_added) {
        const cours = await Cours.create({
          type: x.type,
          date: date,
          startTime: x.startTime,
          professeur: x.professeur,
          matiere: x.matiere,
        });
        added_cours.push(cours);
      }
      result.message = `succés de création de ${list_will_added.length} cours appartir d'emploi du temps aujourd'hui .`;
    }
    if (list_cannot_added.length != 0) {
      result.message =
        result.message +
        ` Nous avons ${list_cannot_added.length} element d'emploi du temps peut etre ajouter comme nouvaux cours .`;
    }
  }
  result.emplois = emplois;
  result.list_will_added = list_will_added;
  result.list_cannot_added = list_cannot_added;
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
    emplois_to_day: result.emplois,
    list_will_added: result.list_will_added,
    list_cannot_added: result.list_cannot_added,
    added_cours: result.added_cours,
  });
};
