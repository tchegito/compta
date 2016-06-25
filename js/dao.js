// Middle level to the database

// Return all factures including the given date
function getFacturesPeriod(date1, date2) {
    var d1 = date1.getTime();
    var d2 = date2.getTime();

    var result = [];
    for (fact in db.factures) {
        var facture = db.factures[fact];
        // We take the date from payment, not real work period
        if (facture.datePaie < date2 && facture.datePaie > date1) {
            result.push(facture);
        }
    }
    return result;
}

function getFraisPeriod(date1, date2) {
    var d1 = date1.getTime();
    var d2 = date2.getTime();

    var result = [];
    for (ndf in db.ndfs) {
        var ndf = db.ndfs[ndf];
        if (ndf.dateMois < date2 && ndf.dateMois > date1) {
            result.push(ndf);
        }
    }
    return result;
}

function calculeTotalTvaNdf(ndf) {
    var tva = 0;
    for (var i = 0;i<ndf.lignes.length;i++) {
        var l = ndf.lignes[i]
        tva += addFloat(l.tva55) * 0.055/1.055;
        tva += addFloat(l.tva10) * 0.1/1.1;
        tva += addFloat(l.tva20) * 0.2/1.2;
    }
    return tva;
}
function calculeTvaAuto() {
    var debut = new Date(Date.UTC(2015, 7, 1));
    var fin = new Date(Date.UTC(2015, 11, 31));
    return calculeTva(debut, fin);
}
function calculeTva(debut, fin) {
    console.log(debut+" a "+fin);
    var factures = getFacturesPeriod(debut, fin);
    var frais = getFraisPeriod(debut, fin);
    var sommeTvaFactures = 0;
    for (f in factures) {
        console.log("facture: "+factures[f].montantTTC);
        sommeTvaFactures += factures[f].montantTTC - factures[f].montantHT;
    }
    console.log("total tva facture="+sommeTvaFactures);
    var sommeTvaFrais = 0;
    for (n in frais) {
        sommeTvaFrais += calculeTotalTvaNdf(frais[n]);
    }
    console.log("total tva frais="+sommeTvaFrais);
    return sommeTvaFactures - sommeTvaFrais;
}