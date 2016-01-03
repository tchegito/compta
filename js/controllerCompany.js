// Contrôleur de l'onglet "Données": essentiellement les attributs de l'entreprise gérée
app.controller("company", function($scope, $location, $rootScope) {

    var fields = ["nom", "adresse1", "adresse2", "adresse3", "statut", "siret", "rcs", "tvaIntra", "urlImage"];

    $scope.listFields = function() {
        return fields;
    }

    $scope.formData = [];

    init();

    $scope.submitCompany = function() {

    }

    $scope.$on('reinit', function(event, args) {
        init();
    });

    // Load a data file
    $scope.importDb = function(file) {

        console.log(file);
        var reader = new FileReader();
        reader.onload = function(e) {
            var temp = JSON.parse(e.target.result);
            if (temp.clients && temp.contacts) {
                alert('Chargement réussi pour:\n'+ Object.size(temp.clients)+ ' clients\n'
                    + Object.size(temp.contacts)+' contacts\n'+
                    Object.size(temp.factures)+' factures\n'+
                    Object.size(temp.ndfs)+' notes de frais');
                dbEngine.importDb(temp);
                // Fix ndf
                /*
                 for (var prop in db.ndfs) {
                 console.log("iterate ndf");
                 var ndf = db.ndfs[prop];
                 try {
                 for (var l = 0; l < ndf.lignes.length; l++) {
                 var dat = ndf.lignes[l].dateNoteTime;
                 var formattedDat = $filter('date')(new Date(dat), 'dd/MM/yy');
                 console.log("date=" + dat + " devient " + formattedDat);
                 ndf.lignes[l].dateNote = new Date(dat).getTime();
                 }
                 } catch (e) {
                 alert(e);
                 }
                 }*/
                // Tell all the scope to reinit
                $rootScope.$broadcast('reinit', $scope.name);
                // Refresh current form
                $scope.$apply();
            }
        };

        reader.readAsText(file);
    }

    function init() {
        console.log('reinit company controller');

        for (i in fields) {
            var fieldName = fields[i];
            $scope.formData[fieldName] = db.company[fieldName];
        }
        $scope.c = angular.copy(db.company);
    }
});