const mongoose = require("mongoose");
const Categorie = require("./categorie");
const Matiere = require("./matiere");
const APIFeatures = require("../utils/apiFeatures");
const filiereSchema = mongoose.Schema({
  name: { type: String, required: true, lowercase: true },
  niveau: {
    type: String,
    default: "licence",
    enum: ["licence", "master", "doctorat"],
  },
  description: {
    type: String,
    default: "",
  },
  isPaireSemestre: {
    type: Boolean,
    default: false,
  },
  /* 
  debutSemestrePaire: {
    type: Date,
    select: true,
    default: Date.now(),
  },
  debutSemestreInPaire: {
    type: Date,
    select: true,
    default: function () {
      const start = this.start.getMonth();
      const f = new Date(this.start);
      f.setMonth(start + 4);
      return f;
    },
  }, */
});

filiereSchema.methods.getPeriodePlace = function () {
  let periode = 0;
  let niveaus = ["licence", "master", "doctorat"];
  let place = niveaus.findIndex((niveau) => niveau == this.niveau) + 1;
  if (this.niveau != undefined) {
    if (this.niveau == "master") {
      periode = 2;
    } else {
      periode = 3;
    }
  }
  return [periode, place];
};
filiereSchema.methods.getEmplois = async function (query) {
  const Emploi = require("./emploi");
  const daysOfWeek = [
    "lundi",
    "mardi",
    "mercredi",
    "jeudi",
    "vendredi",
    "samedi",
    "dimanche",
  ];
  let emplois_temp = [];
  /*   const features = new APIFeatures(Emploi.find(), query)
    .filter()
    .sort()
    .limitFields()
    .pagination(); */
  const emplois = await Emploi.aggregate([
    {
      $match: {
        filiere: new mongoose.Types.ObjectId(this._id),
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
        dayNumero: -1,
        hour: 1,
        minute: 1,
      },
    },
    {
      $group: {
        _id: "$jour", // Field to group by
        documents: { $push: "$$ROOT" }, // Push each document into an array
      },
    },
    /*    {
      $project: {
        jour: "$_id", // Rename _id to groupName
        documents: 1, // Include the documents array
        _id: 0, // Exclude _id field
      },
    }, */
  ]).then((groups) => {
    const result = daysOfWeek.map((day) => {
      const documents =
        groups.find((group) => group._id === day)?.documents || [];
      return { [day]: documents };
    });
    emplois_temp = result;
    console.log(result); // Result containing an array of objects, each object representing documents for a specific day
  });

  return emplois_temp;
};
filiereSchema.post("findOneAndDelete", async function (filiere, message) {
  console.log(" filiere remove midleweere work ....................");
  const Emploi = require("./emploi");

  let groups = [];
  let emplois = [];

  for (x of groups) {
    let emploi = await Emploi.deleteMany({ semestre: x._id });
    if (emploi) {
      emplois.push(emploi);
    }
  }

  message = `La filière ${filiere.niveau} ${filiere.name} avec  ${semestres.length} semestres, ${groups.length} groups et ${emplois.length} cours d'emploi du temps est supprimé !`;
  filiere.name = message;
  console.log(message);
});

module.exports = mongoose.model("Filiere", filiereSchema);
