// Contrôleur de l'onglet "Activité": statistiques sur les données
app.controller("activite", function($scope, $location, $rootScope) {/**
 * Created by Tchegito on 15/11/2016.
 */

    $scope.calculeConges = function() {
        // Date de début de prise en compte
        var dateDebut = new Date($scope.rech.dateDebutTime); //createDate(2015, 9 - 1, 15);
        var dateFin = new Date($scope.rech.dateFinTime);
        // On itère sur toutes les factures et on somme les jours travaillés
        var joursParMois = {};
        var joursOuvresParMois = {};
        var nbJoursOuvres;
        for (key in db.factures) {
            var fac = db.factures[key];
            var d1 = new Date(fac.dateDebut);
            var d2 = new Date(fac.dateFin);
            if (d2 < dateDebut || d1 > dateFin) {
                continue;
            }
            var idMois = dateMoisToStringShort(d2);
            var nbJours = joursParMois[idMois];
            if (!nbJours) {
                nbJours = 0;
            }
            // On somme les jours de chaque ligne de facture
            fac.lignes.forEach(function (l) {
                nbJours += parseFloat(l.qte, 10);
            });
            joursParMois[idMois] = nbJours;

            // Jours ouvrés (si non encore calculé)
            if (!joursOuvresParMois[idMois]) {
                var debutMois = firstDayOfMonth(d2);
                var finMois = lastDayOfMonth(d2);
                nbJoursOuvres = ecartJoursOuvres(debutMois, finMois);
                //console.log("mois "+dateToStringShort(debutMois) + " � "+dateToStringShort(finMois)+ " pour "+
                //    idMois+" ==> "+nbJoursOuvres);
                joursOuvresParMois[idMois] = nbJoursOuvres;
            }
        }
        // On calcule le nombre de jours ouvrés pour chaque mois au passage
        var nbConges = 0;
        for (key in joursParMois) {
            nbConges += joursOuvresParMois[key] - joursParMois[key];
            //console.log(key + " ==> " + joursParMois[key] + " / " + joursOuvresParMois[key]);
        }

        console.log("conges="+nbConges+" jours");
        return nbConges;
    };

    $scope.calculeFeries = function() {
        // On compte les jours fériés entre les 2 dates
        var d1 = new Date($scope.rech.dateDebutTime);
        var d2 = new Date($scope.rech.dateFinTime);
        var nbFeries = 0;
        while (d1 < d2) {
            if (isFerie(d1)) {
                // Check if day is not a saturday/sunday
                var day = d1.getUTCDay();
                if (day > 0 && day < 6) {
                    nbFeries++;
                    console.log("Ferie:" + d1);
                }
            }
            d1 = addDay(d1, 1);
        }

        return nbFeries;
    };

    // On récupère les champs de recherche s'ils ont déjà été modifiés
    if (!$rootScope.rech) {
        $rootScope.rech = {
            dateDebut: createDate(2015, 9 - 1, 15),
            dateFin: new Date()
        }
    }
    $scope.rech = $rootScope.rech;
});