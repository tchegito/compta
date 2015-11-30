// Contrôleur des notes de frais
app.controller("ndfs", function($scope, $location, $routeParams, $rootScope) {

	console.log("on est dans le controller ndf");
	init();

	$scope.selectedNdf = function() {
		return $rootScope.selectedNdf;
	}

	$scope.selNdf = function(id) {
		$rootScope.selectedNdf = id;
	}

	$scope.$on('reinit', function(event, args) {
		console.log('reinit ndfs controller');
		init();
	});
	$scope.idNdf = $routeParams.idNdf;

	function init() {
		$scope.ndfs = db.ndfs;
	}

	if ($scope.idNdf) {
		console.log("Initialisation du formulaire, id="+$scope.idNdf);
		var ndf = db.ndfs[$scope.idNdf];
		// Create a copy ot keep original safe
		$scope.ndf = angular.copy(ndf);
		// User real Date object
		$scope.ndf.dateMoisTime = new Date($scope.ndf.dateMois);
		for (var i=0;i<ndf.lignes.length;i++) {
			var ligne = ndf.lignes[i];
			ligne.dateNoteTime = new Date(ligne.dateNote);
		}
	}

	$scope.resetForm = function() {
		console.log("on reset la note de frais");
		$scope.ndf ={lignes:[], dateMoisTime:0};
	}

	$scope.ajouteLigne = function() {
		// Calculate quantity
		$scope.ndf.lignes.push( {
			dateNote: '',
			descriptif:"",
			tva55:0,
			tva10:0,
			tva20:0
		});
	}

	$scope.submitNdf = function() {
		// Update calculated fields
		console.log("On enregistre la note de frais, id="+$scope.ndf.id);
		var ndf = $scope.ndf;
		// Use <date>.getTime() because JSON can't encode date properly
		ndf.dateMois = retrieveDate(ndf.dateMoisTime);
		ndf.montantTTC = $scope.getNdfTotal();
		for (var i=0;i<ndf.lignes.length;i++) {
			var ligne = ndf.lignes[i];
			console.log("ligne "+i+" lieu="+ligne.descriptif+" dateNoteTime="+ligne.dateNoteTime+" date="+retrieveDate(ligne.dateNoteTime));
			ligne.dateNote = retrieveDate(ligne.dateNoteTime);
		}
		dbEngine.persistNdf(ndf);
		init();
		$scope.selNdf(-1);
		$location.url("");
	}

	$scope.getNdfTotal = function(field) {
		ndf = $scope.ndf;
		var total = 0;
		for (var i = 0;i<ndf.lignes.length;i++) {
			var l = ndf.lignes[i];
			if (field !== undefined) {
				// If particular field is provided, only calculate on it
				total = addFloat(total, l[field]);
			} else {
			total += addFloat(l.tva55, l.tva10, l.tva20);
			}
		}
		return total;
	}

	$scope.supprimeLigne = function(numLigne) {
		$scope.ndf.lignes.splice(numLigne, 1);
	}

	$scope.deleteNdf = function(id) {
		console.log($scope.ndfs);
		console.log($scope.ndfs[0]);
		if (confirm("Etes vous sûr de supprimer cette note de frais ?")) {
			delete $scope.ndfs[id];
			if ($scope.selectedNdf == id) {
				$location.url("");
			}
		}
	}
});