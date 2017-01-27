////////////////////////////
// Contrôleur d'échéances //
////////////////////////////
app.controller("echeances", function($scope, $location, $routeParams, $filter, $rootScope) {
    $scope.naturesDispo = [ 'Libre', 'TVA simplifiée'];

    init();

    $scope.$on('reinit', function (event, args) {
        init();
    });

    $scope.initEcheance = function(ech) {
        // Create a copy to keep original safe
        $scope.echeance = angular.copy(ech);
        // User real Date object
        for (var i=0;i<$scope.echeance.lignes.length;i++) {
            var ligne = $scope.echeance.lignes[i];
            if (ligne.dateLimite != null) {
                ligne.dateLimiteTime = new Date(ligne.dateLimite);
            }
            if (ligne.datePaiement != null) {
                ligne.datePaiementTime = new Date(ligne.datePaiement);
            }
        }
    };
    $scope.idEcheance = $routeParams.idEcheance;

    if ($scope.idEcheance) {
        var ech = db.echeances[$scope.idEcheance];
        $scope.initEcheance(ech);
    }

    $scope.selEcheance = function (id) {
        if (arguments.length == 0) {
            return $rootScope.selectedEcheance;
        }
        $rootScope.selectedEcheance = id;
        if (id == -1) {
            hidePopup();
        } else {
            preparePopup();
            $location.url("echeance"+id);
        }
    };


    function init() {
        $scope.factures = db.factures;
        $scope.clients = db.clients;
        $scope.company = db.company;
        $scope.echeances = db.echeances;
        if (!$scope.echeance) {
            $scope.echeance = {lignes: [], nom: '', nature: $scope.naturesDispo[0]};
        }
    }

    $scope.createEcheance = function () {
        preparePopup();
        $location.url("echeance");
    };

    $scope.ajouteLigne = function() {
        $scope.echeance.lignes.push( {
            dateLimite:"",
            montant:0,
            datePaiement:""
        });
    };

    $scope.supprimeLigne = function(numLigne) {
        $scope.echeance.lignes.splice(numLigne, 1);
    };

    // Check 'echeance' validity
    $scope.checkForm = function(echeance) {
        if (echeance.nom.trim() == "") {
            echeance.error = "error.echNoName";
            return false;
        }
        return true;
    };

    $scope.submitEcheance = function() {
        console.log("submit");
        var echeance = $scope.echeance;
        var valid = $scope.checkForm(echeance);
        if (valid) {
            // TODO: dirty to use libelle instead of code
            if (echeance.id === undefined && echeance.nature == 'TVA simplifiée') {
                // Create automatically period for simplified TVA
                var d1 = new Date(Date.UTC(2015, 0, 1));
                // Go on until 31/12/<currentYear>
                var lastDate = new Date();
                lastDate.setUTCMonth(11);
                lastDate.setUTCDate(31);
                while (d1 < lastDate) {
                    var d2 = addMonth(d1, 12);
                    var finPeriode = addDay(d2, -1);
                    var amount = calculeTva(d1, finPeriode);
                    echeance.lignes.push({
                        montant: Math.round(amount),    // No decimals in TVA forms
                        dateLimite: new Date(Date.UTC(d1.getUTCFullYear() + 1, 4, 2)),
                        datePaiment: null,
                        debutPeriode: d1,
                        finPeriode: addDay(d2, -1)

                    });
                    d1 = d2;
                }
            } else {
                // Use <date>.getTime() because JSON can't encode properly
                for (var i = 0; i < echeance.lignes.length; i++) {
                    var ligne = echeance.lignes[i];
                    ligne.dateLimite = retrieveDate(ligne.dateLimiteTime);
                    ligne.datePaiement = retrieveDate(ligne.datePaiementTime);
                }
            }
            dbEngine.persistEcheance(echeance);
            $scope.selEcheance(-1);

            init();
            $location.url("");
        }
    };

    $scope.getNext = function(ech) {
        // Determine next echeance
        for (var i=0;i<ech.lignes.length;i++) {
            var ligne = ech.lignes[i];
            if (ligne.datePaiement == null) {
                if (ligne.dateLimite > new Date().getTime()) {
                    var strDate = $filter('date')(new Date(ligne.dateLimite), 'dd/MM/yy');
                    var strAmount = $filter('currency')(ligne.montant);
                    return strDate + ": " + strAmount;
                } else {
                    return "En retard !!!";
                }
            }
        }
        return "N/A";
    };

    $scope.deleteEcheance = function(echId) {
        if (confirm("Etes vous sûr de supprimer cette échéance ?")) {
            delete $scope.echeances[echId];
            if ($rootScope.selectedEcheance == echId) {
                $location.url("");
            }
        }
    };

    // Returns a string containing "x€ / y€" where x is paid amounts, and y total amounts on the current year
    $scope.getTotalEcheances = function() {
        var amount = 0;
        var amountPaid = 0;
        for (var e in db.echeances) {
            var ech = db.echeances[e];
            for (var i=0;i<ech.lignes.length;i++) {
                var l = ech.lignes[i];
                var echAmount = parseInt(l.montant, 10);
                amount += echAmount;
                if (l.datePaiement != null) {
                    amountPaid += echAmount;
                }
            }
        }
        return $filter('currency')(amountPaid)
            + " / "
            + $filter('currency')(amount);
    };

    // Returns total amount of a given echeance
    $scope.getTotal = function(ech) {
        var amount = 0;
        for (var i=0;i<ech.lignes.length;i++) {
            var l = ech.lignes[i];
            var echAmount = parseInt(l.montant, 10);
            amount += echAmount;
        }
        return $filter('currency')(amount);
    };

    $scope.formatePeriode = function(ligne) {
        return formateDureeString(new Date(ligne.debutPeriode), new Date(ligne.finPeriode));
    };

    $scope.calculeTva= function(ligne) {
        // Take the two date and launch TVA calculation
        return calculeTva(new Date(ligne.debutPeriode), new Date(ligne.finPeriode));
    };

});
/**
 * Created by Tchegito on 05/03/2016.
 */
