////////////////////////////
// Contrôleur d'échéances //
////////////////////////////
app.controller("echeances", function($scope, $location, $routeParams, $filter, $rootScope) {
    console.log("on est dans le controller echeance");
    init();


    $scope.$on('reinit', function (event, args) {
        console.log('reinit echeance controller');
        init();
    });
    $scope.idEcheance = $routeParams.idEcheance;

    if ($scope.idEcheance) {
        console.log("Initialisation du formulaire, id=" + $scope.idEcheance);
        var echeance = db.echeances[$scope.idEcheance];
        // Create a copy to keep original safe
        $scope.echeance = angular.copy(echeance);
        // User real Date object
        /**
        $scope.facture.debutTime = new Date(facture.dateDebut);
        $scope.facture.finTime = new Date(facture.dateFin);
        if (facture.datePaie != null) {
            $scope.facture.datePaieTime = new Date(facture.datePaie);
        }
         **/
    }

    $scope.selectedEcheance = function () {
        return $rootScope.selectedEcheancee;
    }

    $scope.selEcheance = function (id) {
        $rootScope.selectedEcheance = id;
    }

    function init() {
        console.log("On a " + Object.size(db.echeance)+" échéances");
        $scope.factures = db.factures;
        $scope.clients = db.clients;
        $scope.company = db.company;
        $scope.echeances = db.echeances;
    }

    $scope.resetForm = function () {
        console.log("on reset l'échéance");
        $scope.echeance = {lignes: [], nom: '', nature: ''};
    }

    $scope.naturesDispo = [ 'Libre', 'TVA simplifiée'];

    $scope.ajouteLigne = function() {
        $scope.echeance.lignes.push( {
            dateLimite:"",
            montant:12,
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
        }
        console.log("On enregistre l'echeance, id=" + $scope.echeance.id);
        dbEngine.persistEcheance(echeance);
        $scope.selEcheance(-1);

        init();
        $location.url("");
    }
});
/**
 * Created by Tchegito on 05/03/2016.
 */
