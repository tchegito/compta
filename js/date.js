var MILLISECONDES_PAR_JOUR = 1000 * 60 * 60 * 24;

/** Renvoit le nombre de jours ouvr�s compris entre les 2 dates dohnn�es. G�re �galement les jours f�ries. **/
function ecartJoursOuvres(d1, d2) {
	//alert("Ecart entre "+d1+" et "+d2);
	var delta = d2.getTime() - d1.getTime();
	if (delta < 0) {
		return false;
	}
	var ref = utcDate(d1);
	var dateFin = utcDate(addDay(d2, 1));
	//alert(dateToStringShort(ref));
	var deltaJours = delta / MILLISECONDES_PAR_JOUR;
	var nbJoursOuvres = 0;
	var prevDay = -1;	// On fait �a dans le cas du changement d'heure => sinon on compte un jour de trop
	while (dateToStringShort(ref) != dateToStringShort(dateFin)) {
		var newDay = ref.getUTCDay();
		//console.log(dateToStringShort(ref)+" "+newDay+" ?");
		if (prevDay != newDay && (newDay > 0 && newDay < 6) && !isFerie(ref)) {
			//console.log(dateToStringShort(ref)+" ==> ok");
			nbJoursOuvres++;
		}
		ref.setTime(ref.getTime() + MILLISECONDES_PAR_JOUR);
		prevDay = newDay;
	}
	return nbJoursOuvres;
}

/** Renvoit un �cart de jours sans tenir compte des jours ouvr�s **/
function ecartJours(d1, d2) {
	var delta = d2.getTime() - d1.getTime();
	return delta / 1000 / 3600 / 24;
}

function utcDate(dat) {
	var m = dat.getMonth();
	var d = dat.getDate();
	var annee = dat.getYear();
	return new Date(Date.UTC(annee+1900, m, d));
}
var feries = {};

function calculePaques(Y) {
	var a = Y % 19;
	var b = Math.floor(Y / 100);
	var c = Y % 100;
	var d = Math.floor(b / 4);
	var e = b % 4;
	var f = Math.floor((b + 8) / 25);
	var g = Math.floor((b - f + 1) / 3);
	var h = (19 * a + b - d - g + 15) % 30;
	var i = Math.floor(c / 4);
	var k = c % 4;
	var l = (32 + 2 * e + 2 * i - h - k) % 7;
	var m = Math.floor((a + 11 * h + 22 * l) / 451);
	var n0 = (h + l + 7 * m + 114);
	var n = Math.floor(n0 / 31) - 1;
	var p = n0 % 31 + 1;
	return new Date(Date.UTC(Y, n, p));
}

function addDay(date, nbDays) {
	return new Date(date.getTime() + MILLISECONDES_PAR_JOUR * nbDays);
}

function calculeJoursFeries(annee) {
	var paques = calculePaques(annee + 1900);
	feries[annee] = [ "1/1", // Jour de l'an
		dateToStringShort(paques),
		dateToStringShort(addDay(paques, 1)),
		dateToStringShort(addDay(paques, 39)),
		dateToStringShort(addDay(paques, 50)),
		"1/5",	// 1er mai
		"8/5",	// 8 mai
		"14/7", // 14 juillet
		"15/8", // Assomption
		"1/11", // Toussaint
		"11/11", // Armistice
		"25/12"]; // No�l
}

/** Transforme une date en <jour>/<mois>. Par exemple "1/12" ou "24/8" **/
function dateToStringShort(d) {
	return d.getUTCDate() + "/" + (d.getUTCMonth()+1);
}

/** Transforme une date en <mois>/<ann�e>. Par exemple "1/2016" ou "7/2015" **/
function dateMoisToStringShort(d) {
	return (d.getUTCMonth()+1) + "/" + d.getUTCFullYear();
}

/**  Renvoie une date sous la forme "<jour> <mois> <année>". Par exemple "4 novembre 2016" **/
function dateToString(d) {
	return d.getUTCDate() + " " + (jQuery.datepicker.regional.fr.monthNames[d.getUTCMonth()]) + " " + d.getUTCFullYear();
}

function isFerie(d) {
	var y = d.getYear();
	if (feries[y] === undefined) {
		calculeJoursFeries(y);
	}
	joursFeries = feries[y];
	var strDate = dateToStringShort(d);
	return joursFeries.indexOf(strDate) != -1;
}

/** Construit une cha�ne "du <debut> <mois1> au <fin> <mois2>".
 * On ne rep�te pas le mois si c'est le m�me. **/
function formateDureeString(dateDebut, dateFin) {
	var mois1 = dateDebut.getMonth();
	var mois2 = dateFin.getMonth();

	var annee1 = dateDebut.getYear() + 1900;
	var annee2 = dateFin.getYear() + 1900;

	var str = "du " + dateDebut.getDate();
	if (mois1 != mois2) {
		str += " " + jQuery.datepicker.regional.fr.monthNames[mois1];
		if (annee1 != annee2) {
			str += " " + annee1;

		}
	}
	str += " au ";
	str += dateFin.getDate();
	str += " ";
	str += jQuery.datepicker.regional.fr.monthNames[mois2];
	str += " ";
	str += annee2;
	return str;
}

function addMonth(date, nbMonth) {
	return new Date(Date.UTC(
		date.getUTCFullYear(),
		date.getUTCMonth()+nbMonth,
		date.getUTCDate()))
}

function firstDayOfMonth(date) {
	return new Date(Date.UTC(
		date.getUTCFullYear(),
		date.getUTCMonth(),
		1));
}

function lastDayOfMonth(d) {
	return addDay(addMonth(firstDayOfMonth(d), 1), -1);
}

function createDate(year, month, date) {
	return new Date(Date.UTC(year, month, date));
}

/*
function addDay(date, nbDay) {
	return new Date(Date.UTC(
		date.getUTCFullYear(),
		date.getUTCMonth(),
		date.getUTCDate()+nbMonth
	));
}
	*/