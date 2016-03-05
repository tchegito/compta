////////////////////////////
// Contrôleur d'échéances //
////////////////////////////
app.controller("echeances", function($scope, $location, $routeParams, $filter, $rootScope) {
    init();


    $scope.$on('reinit', function (event, args) {
        init();
    });
    $scope.idEcheance = $routeParams.idEcheance;

    if ($scope.idEcheance) {
        var echeance = db.echeances[$scope.idEcheance];
        // Create a copy to keep original safe
        $scope.echeance = angular.copy(echeance);
        // User real Date object
        for (var i=0;i<echeance.lignes.length;i++) {
            var ligne = echeance.lignes[i];
            if (ligne.dateLimite != null) {
                ligne.dateLimiteTime = new Date(ligne.dateLimite);
            }
            if (ligne.datePaiement != null) {
                ligne.datePaiementTime = new Date(ligne.datePaiement);
            }
        }
    }

    $scope.selectedEcheance = function () {
        return $rootScope.selectedEcheancee;
    }

    $scope.selEcheance = function (id) {
        $rootScope.selectedEcheance = id;
    }

    function init() {
        $scope.factures = db.factures;
        $scope.clients = db.clients;
        $scope.company = db.company;
        $scope.echeances = db.echeances;
    }

    $scope.resetForm = function () {
        $scope.echeance = {lignes: [], nom: '', nature: ''};
    }

    $scope.naturesDispo = [ 'Libre', 'TVA simplifiée'];

    $scope.ajouteLigne = function() {
        $scope.echeance.lignes.push( {
            dateLimite:"",
            montant:0,
            datePaiement:""
        });
    }

    $scope.supprimeLigne = function(numLigne) {
        $scope.echeance.lignes.splice(numLigne, 1);
    }

    $scope.submitEcheance = function() {
        var echeance = $scope.echeance;
        // Use <date>.getTime() because JSON can't encode properly
        for (var i=0;i<echeance.lignes.length;i++) {
            var ligne = echeance.lignes[i];
            ligne.dateLimite = retrieveDate(ligne.dateLimiteTime);
            ligne.datePaiement = retrieveDate(ligne.datePaiementTime);
        }
        dbEngine.persistEcheance(echeance);
        $scope.selEcheance(-1);

        init();
        $location.url("");
    }

    $scope.getNext = function(ech) {
        // Determine next echeance
        for (var i=0;i<ech.lignes.length;i++) {
            var ligne = ech.lignes[i];
            if (ligne.dateLimite > new Date().getTime()) {
                var strDate = $filter('date')(new Date(ligne.dateLimite), 'dd/MM/yy');
                var strAmount = $filter('currency')(ligne.montant);
                return strDate + ": "+strAmount;
            }
        }
        return "Rien trouvé";
    }

    // Returns "x€ / y€" where x is paid amounts, and y total amounts on the current year
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
    }


});
/**
 * Created by Tchegito on 05/03/2016.
 */
