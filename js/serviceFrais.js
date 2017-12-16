app.service('frais', function() {/**
 * Created by Tchegito on 29/10/2017.
 */
    // Return all factures including the given date
    this.getFacturesPeriod = function(date1, date2) {
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
    };

    /** Renvoie le montant TTC encaissé sur une période donnée **/
    this.getCreditsTTCPeriod = function(date1, date2) {
        var factures = this.getFacturesPeriod(date1, date2);
        var montant = 0;
        factures.forEach(function(facture) {
            //console.log(facture);
            montant += parseFloat(facture.montantTTC, 10);
        });
        return montant;
    };

    this.getFraisPeriod = function(date1, date2) {
        var d1 = date1.getTime();
        var d2 = date2.getTime();

        var result = [];
        for (ndf in db.ndfs) {
            var ndf = db.ndfs[ndf];
            //console.log("test frais : dateMois="+new Date(ndf.dateMois)+" et date1="+date1+" montant="+calculeTotalTvaNdf(ndf));
            if (ndf.dateMois < date2 && ndf.dateMois >= date1) {
                result.push(ndf);
            }
        }
        return result;
    };

    /** Renvoie le total des paiements basés sur les échéances pour une période donnée **/
    this.getChargesPeriod = function(date1, date2) {
        var d1 = date1.getTime();
        var d2 = date2.getTime();

        //console.log("looking for frais in "+d1+" to "+d2);
        var montant = 0;
        for (var echKey in db.echeances) {
            var ech = db.echeances[echKey];
            for (var idx in ech.lignes) {
                var line = ech.lignes[idx];
                var date = line.datePaiement;
                //console.log("test frais : dateMois="+new Date(ndf.dateMois)+" et date1="+date1+" montant="+calculeTotalTvaNdf(ndf));
                if (date && date < date2 && date >= date1) {
                    montant += parseFloat(line.montant, 10);
                    //console.log("found "+ech.nom+" montant="+line.montant+" at "+date+" total="+montant);
                }
            }
        }
        return montant;
    };
    this.calculeTotalTvaNdf = function(ndf) {
        var tva = 0;
        for (var i = 0;i<ndf.lignes.length;i++) {
            var l = ndf.lignes[i]
            tva += addFloat(l.tva55) * 0.055/1.055;
            tva += addFloat(l.tva10) * 0.1/1.1;
            tva += addFloat(l.tva20) * 0.2/1.2;
        }
        return tva;
    };

    this.calculeTvaAuto = function() {
        var debut = new Date(Date.UTC(2016, 0, 1) - 1000 * 60 * 60);
        var fin = new Date(Date.UTC(2016, 5, 30));
        return this.calculeTva(debut, fin);
    };

    this.calculeTva = function(debut, fin) {
        //console.log(debut+" a "+fin);
        var factures = this.getFacturesPeriod(debut, fin);
        var frais = this.getFraisPeriod(debut, fin);
        var sommeTvaFactures = 0;
        for (f in factures) {
            //console.log("facture: "+factures[f].montantTTC);
            sommeTvaFactures += factures[f].montantTTC - factures[f].montantHT;
        }
        //console.log("total tva facture="+sommeTvaFactures);
        var sommeTvaFrais = 0;
        for (n in frais) {
            //console.log("frais: "+calculeTotalTvaNdf(frais[n]));
            sommeTvaFrais += this.calculeTotalTvaNdf(frais[n]);
        }
        //console.log("total tva frais="+sommeTvaFrais);
        return sommeTvaFactures - sommeTvaFrais;
    };
});
