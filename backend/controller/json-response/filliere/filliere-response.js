class FilliereResponse {
  constructor(filliere_id, filliere, niveau, semestre) {
    this.filliere_id = filliere_id;
    this.filliere = filliere;
    this.niveau = niveau;
    this.semestre = semestre;
  }
}

module.exports = FilliereResponse;

class FilliereDetail {
  constructor(
    semestre_id,
    semestre_numero,
    semestre,
    element_id,
    code_EM,
    name_EM
  ) {
    this.semestre_id = semestre_id;
    this.semestre_numero = semestre_numero;
    this.semestre = semestre;
    this.element_id = element_id;
    this.code_EM = code_EM;
    this.name_EM = name_EM;
  }
}

module.exports = FilliereDetail;

class FilliereEmploi {
  constructor(
    dayNumero,
    day,
    startTime,
    finishTime,
    professeur_id,
    matiere_id,
    professeur,
    matiere
  ) {
    this.dayNumero = dayNumero;
    this.day = day;
    this.startTime = startTime;
    this.finishTime = finishTime;
    this.professeur_id = professeur_id;
    this.matiere_id = matiere_id;
    this.professeur = professeur;
    this.matiere = matiere;
  }
}

module.exports = FilliereEmploi;
