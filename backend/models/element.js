const mongoose = require("mongoose");
const Filiere = require("./filiere");
const Professeur = require("./professeur");

const elementSchema = mongoose.Schema({
  /*   semestre: {
    type: mongoose.Schema.ObjectId,
    ref: "Semestre",
    required: [true, "Le semestre est requis !"],
  }, */

  filiere: {
    type: mongoose.Schema.ObjectId,
    ref: "Filiere",
    required: [true, "La filiere est requis !"],
    select: true,
  },
  semestre: {
    required: [true, "Numéro de semestre est requis !"],
    type: Number,
    select: true,
    enum: [1, 2, 3, 4, 5, 6],
    validate: {
      // this only works on CREATE and SAVE!!!
      validator: async function (el) {
        const filiere = await Filiere.findById(this.filiere);
        let filiere_info = await filiere.getPeriodePlace();
        let periode = 2 * filiere_info[0];
        return el <= periode;
      },
      message: function () {
        let periode = this.periode;
        let niveau = this.filiere.niveau;
        return `Seulement  ${periode} semestres dans ${niveau} !`;
      },
    },
  },

  matiere: {
    type: mongoose.Schema.ObjectId,
    ref: "Matiere",
    required: [true, "Le matiére est requis !"],
  },
  heuresCM: { type: Number, default: 0 },
  heuresTP: { type: Number, default: 0 },
  heuresTD: { type: Number, default: 0 },
  professeurCM: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "Professeur",
    },
  ],
  professeurTP: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "Professeur",
    },
  ],

  professeurTD: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "Professeur",
    },
  ],
  name: { type: String, lowercase: true },

  info: {
    code: String,
    categorie: {
      type: mongoose.Schema.ObjectId,
      ref: "Categorie",
    },
    CM: [String],
    TD: [String],
    TP: [String],
  },
});
/* elementSchema.pre("validate", async function (next) {
  try {
    if (this.professeurCM == undefined) {
      this.professeurCM = undefined;
    }
    if (this.professeurTP == undefined) {
      this.professeurTP = undefined;
    }
    if (this.professeurTD == undefined) {
      this.professeurTD = undefined;
    }
  } catch (error) {
    next(error);
  }
}); */
/* ---------------------------------------------------------------------------------------------------------SAVE MDL------------------------- */
/* elementSchema.pre("save", async function (next) {
  next();
}); */
elementSchema.pre("save", async function (next) {
  const Matiere = require("./matiere");
  const Filiere = require("./filiere");
  const matiere = await Matiere.findById(this.matiere);
  const filiere = await Filiere.findById(this.filiere);
  let matiere_info = await matiere.getCodePrixCNameCCode();
  let filiere_info = await filiere.getPeriodePlace();
  let code = matiere_info[3] + this.semestre + filiere_info[1] + matiere.numero;
  this.info.code = code;
  this.name = matiere.name;
  this.info.categorie = matiere.categorie;
  let professeursCM_List = [];
  let professeursTP_List = [];
  let professeursTD_List = [];
  const unqRef = [...new Set(this.professeurCM.map(String))];
  const unqRefTP = [...new Set(this.professeurTP.map(String))];
  const unqRefTD = [...new Set(this.professeurTD.map(String))];
  if (
    this.professeurCM.length !== unqRef.length ||
    this.professeurTD.length !== unqRefTD.length ||
    this.professeurTP.length !== unqRefTP.length
  ) {
    const error = new Error(
      "ID d'objets en double dans les professeur référence !"
    );
    return next(error);
  }
  try {
    const existe_professeurCM = await Promise.all(
      this.professeurCM.map(async (el) => {
        const refDoc = await Professeur.findById(el);
        if (!refDoc) {
          throw new Error(
            `Aucun document reference trouvé pour cet identifiant: ${el} !`
          );
        } else {
          professeursCM_List.push(refDoc.nom + " " + refDoc.prenom);
        }
        return refDoc;
      })
    );
    const existe_professeurTD = await Promise.all(
      this.professeurTD.map(async (el) => {
        const refDoc = await Professeur.findById(el);
        if (!refDoc) {
          throw new Error(
            `Aucun document reference trouvé pour cet identifiant: ${el} !`
          );
        } else {
          professeursTD_List.push(refDoc.nom + " " + refDoc.prenom);
        }
        return refDoc;
      })
    );
    const existe_professeurTP = await Promise.all(
      this.professeurTP.map(async (el) => {
        const refDoc = await Professeur.findById(el);
        if (!refDoc) {
          throw new Error(
            `Aucun document reference trouvé pour cet identifiant: ${el} !`
          );
        } else {
          professeursTP_List.push(refDoc.nom + " " + refDoc.prenom);
        }
        return refDoc;
      })
    );

    this.info.CM = professeursCM_List;
    this.info.TD = professeursTD_List;
    this.info.TP = professeursTP_List;
    next();
  } catch (error) {
    next(error);
  }
});
elementSchema.post("findOneAndDelete", async function (element) {
  console.log(" element remove midleweere work ....................");
  const Cours = require("./cours");
  const Emploi = require("./emploi");

  await Cours.deleteMany({ element: element._id });
  await Emploi.deleteMany({ element: element._id });
});
/* -------------------------------------------------------------GET PRIX---------------------------- */
elementSchema.methods.getPrix = async function () {
  const Matiere = require("./matiere");
  const matiere = await Matiere.findById(this.matiere);
  let matiere_info = await matiere.getCodePrixCNameCCode();
  let prix = await matiere_info[1];
  return prix;
};
/* -----------------------------------------------------------GET Filiere Matiere--------------------------- */
elementSchema.methods.getFiliere_Matiere = async function () {
  const Matiere = require("./matiere");
  const Filiere = require("./filiere");
  try {
    const matiere = await Matiere.findById(this.matiere);
    const filiere = await Filiere.findById(this.filiere);
    return [filiere, matiere];
  } catch (error) {}
};
/* --------------------------------------------------------GET PROFESSEURS--------------------------------------- */
elementSchema.methods.getProfCM_ProfTP_ProfTD = async function () {
  const Professeur = require("./professeur");
  let profCM = [];
  let profTP = [];
  let profTD = [];
  for (cm of this.professeurCM) {
    let professeurCM = await Professeur.findById(cm);
    if (professeurCM) {
      profCM_user = await professeurCM.getUserInformation();
      let dt = {
        _id: cm,
        nom: profCM_user.nom,
        prenom: profCM_user.prenom,
      };
      profCM.push(dt);
    }
  }
  for (TP of this.professeurTP) {
    let professeurTP = await Professeur.findById(TP);
    if (professeurTP) {
      profTP_user = await professeurTP.getInformation();
      let dt = {
        _id: TP,
        nom: profTP_user[1],
        prenom: profTP_user[2],
      };
      profTP.push(dt);
    }
  }
  for (TD of this.professeurTD) {
    let professeurTD = await Professeur.findById(TD);
    if (professeurTD) {
      profTD_user = await professeurTD.getInformation();
      let dt = {
        _id: TD,
        nom: profTD_user[1],
        prenom: profTD_user[2],
      };
      profTD.push(dt);
    }
  }

  return [profCM, profTP, profTD];
};
/* elementSchema.methods.getProfCM_ProfTP_ProfTD = async function () {
  let profCM = "ll n'y a pas";
  let profTP = "ll n'y a pas";
  let profTD = "ll n'y a pas";
  let profCM_id = "";
  let profTD_id = "";
  let profTP_id = "";
  const Professeur = require("./professeur");
  const professeurCM = await Professeur.findById(this.professeurCM);
  const professeurTP = await Professeur.findById(this.professeurTP);
  const professeurTD = await Professeur.findById(this.professeurTD);
  if (professeurCM) {
    profCM_user = await professeurCM.getInformation();
    if (profCM_user) {
      profCM_id = professeurCM._id;
      profCM = `${profCM_user[1]} ${profCM_user[2]}`;
    }
  }
  if (professeurTP) {
    profTP_user = await professeurTP.getInformation();
    if (profTP_user) {
      profTP_id = professeurTP._id;
      profTP = `${profTP_user[1]} ${profTP_user[2]}`;
    }
  }
  if (professeurTD) {
    profTD_user = await professeurTD.getInformation();
    if (profTD_user) {
      profTD_id = professeurTD._id;
      profTD = `${profTD_user[1]} ${profTD_user[2]}`;
    }
  }

  return [profCM, profTP, profTD];
}; */

/* elementSchema.methods.getSemestre_Filiere_Matiere = async function () {
  const Matiere = require("./matiere");
  const Semestre = require("./semestre");
  const Filiere = require("./filiere");
  try {
    const matiere = await Matiere.findById(this.matiere);
    const semestre = await Semestre.findById(this.semestre);
    const filiere = await Filiere.findById(semestre.filiere);
    return [semestre.numero, filiere.name, matiere.name];
  } catch (error) {}
}; */
module.exports = mongoose.model("Element", elementSchema);
