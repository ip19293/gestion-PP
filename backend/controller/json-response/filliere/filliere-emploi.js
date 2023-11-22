class FilliereEmploi {
  constructor(
    semestre_id,
    semestre_numero,
    group_id,
    emploi_id,
    dayNumero,
    day,
    startTime,
    finishTime,
    professeur_id,
    matiere_id,
    professeur,
    matiere
  ) {
    this.semestre_id = semestre_id;
    this.semestre_numero = semestre_numero;
    this.group_id = group_id;
    this.emploi_id = emploi_id;
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
