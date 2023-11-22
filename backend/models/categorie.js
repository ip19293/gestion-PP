const mongoose = require("mongoose");
const professeur = require("./professeur");
const schema = mongoose.Schema;
const categorieSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "categorie is required"],
      unique: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },
    prix: {
      type: Number,
      required: [true, "prix is required"],
      default: 100,
      min: 100,
      max: 900,
    },
  },
  { timestamps: true }
);

/* categorieSchema.methods.getCategorieCode = function () {
  let categorie_code = "";
  let categorie_elements = this.name.split(" ");
  if (!categorie_elements[1]) {
    categorie_code = categorie_elements[0].substr(0, 3).toLocaleUpperCase();
  } else if (categorie_elements[1] && !categorie_elements[2]) {
    categorie_code =
      categorie_elements[0].substr(0, 2).toLocaleUpperCase() +
      categorie_elements[1].substr(0, 1).toLocaleUpperCase();
  } else {
    categorie_elements.forEach((element) => {
      categorie_code =
        categorie_code + element.substr(0, 1).toLocaleUpperCase();
    });
    console.log(categorie_code);
  }
  return categorie_code;
}; */
categorieSchema.methods.getInformation = async function () {
  const Matiere = require("./matiere");
  nb_matieres = await Matiere.find({ categorie: this._id }).count();
  let categorie_code = "";
  let categorie_elements = this.name.split(" ");
  if (!categorie_elements[1]) {
    categorie_code = categorie_elements[0].substr(0, 3).toLocaleUpperCase();
  } else if (categorie_elements[1] && !categorie_elements[2]) {
    categorie_code =
      categorie_elements[0].substr(0, 2).toLocaleUpperCase() +
      categorie_elements[1].substr(0, 1).toLocaleUpperCase();
  } else {
    categorie_elements.forEach((element) => {
      categorie_code =
        categorie_code + element.substr(0, 1).toLocaleUpperCase();
    });
    console.log(categorie_code);
  }
  return [categorie_code, nb_matieres];
};
categorieSchema.post("findOneAndDelete", async function (categorie, message) {
  console.log(" categorie remove midleweere work ....................");
  const Matiere = require("./matiere");
  const Professeur = require("./professeur");
  const Semestre = require("./semestre");
  const Cours = require("./cours");
  const Emploi = require("./emploi");
  const matieres = await Matiere.find({ categorie: categorie._id });
  let matieres_ids = matieres.map((doc) => doc._id.toString()).flat();
  const professeurs = await Professeur.find({
    matieres: { $in: matieres_ids },
  });

  let mm = [];

  message = `Successfully deleted categorie : ${categorie.name} `;
  for (m of matieres) {
    mm.push(m.name);
    const professeur = await Professeur.updateMany(
      {
        matieres: { $elemMatch: { $eq: m._id } },
      },
      {
        $pull: {
          matieres: m._id,
        },
      }
    );
    await Semestre.updateMany(
      {
        elements: { $elemMatch: { $eq: m._id } },
      },
      {
        $pull: {
          elements: m._id,
        },
      }
    );
    await Cours.deleteMany({ matiere: m._id });
    await Emploi.deleteMany({ matiere: m._id });
  }
  if (mm.length != 0) {
    message =
      message +
      ` with his elements ${mm.length}  matieres [${mm}] from all professeurs liste , semestres element ,cours ,emploi ...`;
  }

  await Matiere.deleteMany({ categorie: categorie._id });
  console.log(` ${message}`);
  categorie.name = message;
});

module.exports = mongoose.model("Categorie", categorieSchema);
/* ===================================================================FONCTIONS================ */
/* async function deleteMatieres(categorie) {
  const Matiere = require("./matiere");

  await Matiere.deleteMany({ categorie: categorie });
}
 */
