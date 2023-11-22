const Cours = require("../../models/cours");
const Professeur = require("../../models/professeur");
const Matiere = require("../../models/matiere");

exports.types_TO_th_nbh_nbm_thsm = (types) => {
  let th = 0;
  let nbh = 0;
  let nbm = 0;
  let thsm = 0;
  types.forEach((e) => {
    if (e.name == "CM") {
      th = th + e.nbh;
    }
    if (e.name == "TD" || e.name == "TP") {
      th = th + (e.nbh * 2) / 3;
    }
    thsm = th + thsm;
    nbh = nbh + e.nbh;
  });
  nbm = (nbh % 1) * 60;

  return [th, nbh, nbm, thsm];
};

/* -----------------------------cours response function------------------------------- */

/* -----------------------------get semestre and the list of elements------------------------------- */

async function getSemestreElements(semestre) {
  const data = [];
  for (const e of semestre.elements) {
    try {
      const matiere = await Matiere.findById(e);
      code =
        (await matiere.getCode()) +
        (await matiere.getNumero()) +
        "1" +
        (await semestre.numero);
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

module.exports = getSemestreElements;
