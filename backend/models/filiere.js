const mongoose = require("mongoose");
const filiereSchema = mongoose.Schema({
  name: { type: String, required: true, lowercase: true },
  niveau: {
    type: String,
    default: "licence",
    enum: ["licence", "master", "doctorat"],
  },
  description: {
    type: String,
    unique: true,
  },
  isPaireSemestre: {
    type: Boolean,
    default: false,
  },
});
//SAVE MIDLWERED ----------------------------------------------------------------------------------
filiereSchema.pre("save", async function (next) {
  //gernerate description from name
  let description = "";
  let name_part = this.name.split(" ");
  if (!name_part[1]) {
    description = name_part[0].substr(0, 3).toLocaleUpperCase();
  } else if (name_part[1] && !name_part[2]) {
    description =
      name_part[0].substr(0, 2).toLocaleUpperCase() +
      name_part[1].substr(0, 1).toLocaleUpperCase();
  } else {
    name_part.forEach((element) => {
      description = description + element.substr(0, 1).toLocaleUpperCase();
    });
  }
  try {
    this.description =
      this.niveau.substr(0, 1).toLocaleUpperCase() + description;
  } catch (error) {
    console.log(error.message);
  }
  next();
});
//GET PERIODE AND PLACE OF FILIERE --------------------------------------------------------------------
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
filiereSchema.methods.getEmplois = async function () {
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
  const emo = Emploi.aggregate([
    {
      $unwind: "$semestre",
    },
  ]);
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
  const Element = require("./element");
  const elements = await Element.deleteMany({ filiere: filiere._id });
  //await Emploi.deleteMany({ filiere: filiere._id });
  message = `La filière ${filiere.niveau} ${filiere.name} avec  ${elements.deletedCount} elements et d'emploi du temps est supprimé !`;
  filiere.name = message;
  console.log(message);
});

module.exports = mongoose.model("Filiere", filiereSchema);
