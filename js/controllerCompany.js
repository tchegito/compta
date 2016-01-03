// Contrôleur de l'onglet "Données": essentiellement les attributs de l'entreprise gérée
app.controller("company", function($scope, $location, $routeParams, $rootScope) {

    var fields = ["nom", "adresse1", "adresse2", "adresse3", "statut", "siret", "rcs", "tvaIntra", "urlImage"];

    console.log("youhou");

    $scope.c = angular.copy(db.company);

    $scope.c.nom="Youpi";

    $scope.listFields = function() {
        return fields;
    }

    $scope.formData = [];

    init();

    $scope.submitCompany = function() {

    }

    function init() {
        for (i in fields) {
            console.log(i);
            var fieldName = fields[i];
            $scope.formData[fieldName] = db.company[fieldName];
        }
        console.log($scope.formData);
    }
});