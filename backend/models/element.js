const mongoose = require("mongoose");
const Filiere = require("./filiere");
const Categorie = require("./categorie");

const elementSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Le nom is required"],
      lowercase: true,
      trim: true,
    },
    code: {
      type: String,
      select: true,
      unique: true,
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
        message: `Le semestre ${this.semestre} n'existe pas !`,
      },
    },
    heuresCM: { type: Number, default: 32 },
    heuresTP: { type: Number, default: 12 },
    heuresTD: { type: Number, default: 22 },
    CM: [
      String,
      /*   {
        groupe: String,
        professeur: {
          type: mongoose.Schema.ObjectId,
          ref: "Professeur",
        },
      }, */
    ],
    TP: [
      String,
      /*    {
        groupe: String,
        professeur: {
          type: mongoose.Schema.ObjectId,
          ref: "Professeur",
        },
      }, */
    ],
    TD: [
      String,
      /*    {
        groupe: String,
        professeur: {
          type: mongoose.Schema.ObjectId,
          ref: "Professeur",
        },
      }, */
    ],

    categorie: {
      type: mongoose.Schema.ObjectId,
      ref: "Categorie",
      required: [true, "La catégorie est requis !"],
    },

    filiere: {
      type: mongoose.Schema.ObjectId,
      ref: "Filiere",
      required: [true, "La filiére est requis !"],
      select: true,
    },

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
  },

  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
//FIND MIDELEWEERE TO POPULATE QUERY ---------------------------------------------------------------
elementSchema.pre(/^find/, function (next) {
  this.populate([
    {
      path: "professeurCM professeurTP professeurTD",
      select: "user",
      populate: {
        path: "user",
        select: "nom prenom",
      },
    },
    { path: "filiere", select: "name niveau" },
  ]);

  next();
});
//PRE SAVE MIDELEWEERE ------------------------------------------------------------------------------
elementSchema.pre("save", async function (next) {
  const Professeur = require("./professeur");
  const filiere = await Filiere.findById(this.filiere);
  let filiere_info = await filiere.getPeriodePlace();
  // initialisation 0f code field
  // les valeurs diffrent de code
  let categorie = await Categorie.findById(this.categorie);
  let stringArray = await this.constructor
    .find({
      categorie: this.categorie,
      filiere: this.filiere,
      semestre: this.semestre,
    })
    .distinct("code");
  let numberArray = stringArray.map((str) =>
    parseInt(str.charAt(str.length - 1))
  );
  //console.log(numberArray);
  let nb = getNonExistingNumber(numberArray);
  let codeStringPart = categorie.code;
  let code = codeStringPart + this.semestre + filiere_info[1] + nb;
  this.code = filiere.description + "-" + code;

  //verivication de IDS IN professeurCM , professeurTD & professeurTP filelds
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
  const existe_professeurCM = await Promise.all(
    this.professeurCM.map(async (el) => {
      const refDoc = await Professeur.findById(el);
      if (!refDoc) {
        throw new Error(
          `Aucun document reference trouvé pour cet identifiant: ${el} !`
        );
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
      }
      return refDoc;
    })
  );

  next();
});
elementSchema.pre("save", function (next) {
  //console.log(this.isNew);
  try {
    if (this.isNew) {
      const type = ["CM", "TD", "TP"];
      for (let t = 0; t < type.length; t++) {
        let data = [];
        for (let i = 0; i < this["professeur" + [type[t]]].length; i++) {
          let dt = {
            groupe: this["professeur" + [type[t]]][i]._id + "-" + i,
            professeur: this["professeur" + [type[t]]][i]._id,
          };
          /*      data.push(dt); */
          data.push(this["professeur" + [type[t]]][i]._id + "-" + i);
        }

        const professeurCount = {};
        let groupe = [];
        data.forEach((cmItem, index) => {
          /*           let groupeData = cmItem.groupe.split("-"); */
          let groupeData = cmItem.split("-");
          let professeur = groupeData[0];
          let nb = groupeData[1];
          if (professeur) {
            if (!professeurCount[professeur]) {
              professeurCount[professeur] = 0;
            }
            professeurCount[professeur] += 1;
            let numero = parseInt(nb) + 1;
            //  console.log(numero);
            /* 
            cmItem.groupe =
              `${professeur}-${professeurCount[professeur]}` + `-` + numero; */
            cmItem =
              `${professeur}-${professeurCount[professeur]}` + `-` + numero;
            groupe.push(cmItem);
          }
        });
        this[[type[t]]] = groupe;
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

const getNonExistingNumber = function (arr) {
  if (arr) {
  }
  for (let i = 0; i <= arr.length; i++) {
    if (!arr.includes(i)) {
      return i;
    }
  }
  return arr.length + 1;
};

//POST FIND ONE AND DELETE MIDELWEERE ---------------------------------------------------------------
elementSchema.post("findOneAndDelete", async function (element) {
  console.log(" element remove midleweere work ....................");
  const Emploi = require("./emploi");
  //await Cours.deleteMany({ element: element._id });
  await Emploi.deleteMany({ element: element._id });
});
//GET PRIX METHOD ------------------------------------------------------------------------------------
elementSchema.methods.getPrix = async function () {
  let categorie = await Categorie.findById(this.categorie);
  return categorie.prix;
};

module.exports = mongoose.model("Element", elementSchema);
