////////////////////////////
// Contrôleur de factures //
////////////////////////////
app.controller("factures", function($scope, $location, $routeParams, $rootScope) {
	init();


	$scope.$on('reinit', function(event, args) {
		init();
	});
	$scope.idFacture = $routeParams.idFacture;

	if ($scope.idFacture) {
		console.log("Initialisation du formulaire, id=" + $scope.idFacture);
		var facture = db.factures[$scope.idFacture];
		// Create a copy to keep original safe
		$scope.facture = angular.copy(facture);
		// User real Date object
		$scope.facture.debutTime = new Date(facture.dateDebut);
		$scope.facture.finTime = new Date(facture.dateFin);
		if (facture.datePaie != null) {
			$scope.facture.datePaieTime = new Date(facture.datePaie);
		}
	}

	$scope.selectedFacture = function() {
		return $rootScope.selectedFacture;
	}

	$scope.selFacture = function(id) {
		$rootScope.selectedFacture = id;
	}

	function init() {
		$scope.factures = db.factures;
		$scope.clients = db.clients;
		$scope.company = db.company;
	}

	$scope.resetForm = function() {
		$scope.facture ={lignes:[], debutTime:0, finTime:0};
	}

	$scope.getNomClient = function(idClient) {
		return db.clients[idClient].nom;
	}

	$scope.getCurrentClient = function() {
		return db.clients[$scope.facture.idClient];
	}

	$scope.getNumeroFacture = function() {
		// Format number with 3 digit
		var numFacture = formatNumber($scope.facture.id + 1, 3);
		var d = $scope.facture.debutTime;
		if (d == 0 || d == null || d === undefined) {
			d = new Date();
		}
		return (1900 + d.getYear()) + numFacture;
	}

	$scope.ajouteLigne = function() {
		var idClient = $scope.facture.idClient;
		var tjm = $scope.facture.tjm;
		if (tjm === undefined) {
			tjm = 0;	// We don't want any null TJM
		}
		// Calculate quantity
		var nbJours = 1;
		var dateDebut = $scope.facture.debutTime;
		var dateFin = $scope.facture.finTime;
		if (dateDebut && dateFin) {
			nbJours = ecartJoursOuvres(dateDebut, dateFin);
		}
		if (idClient === undefined) {
			alert("Il faut d'abord renseigner le client.");
			return;
		}
		$scope.facture.lignes.push( {
			descriptif:"Mission "+this.getNomClient(idClient),
			qte:nbJours,
			pu:tjm,
			montantHT:0
		});
	}

	$scope.supprimeLigne = function(numLigne) {
		$scope.facture.lignes.splice(numLigne, 1);
	}

	// Calculate, store and return
	$scope.calculLigneMontantHT = function(ligne) {
		ligne.montantHT = ligne.qte * ligne.pu;
		return ligne.montantHT;
	}

	$scope.getFactureTotalHT = function() {
		var total = 0;
		if ($scope.facture) {
			var lignes = $scope.facture.lignes;
			if (lignes) {
				for (var i = 0; i < lignes.length; i++) {
					total += lignes[i].montantHT;
				}
			}
		}
		return total;
	}

	$scope.getFactureTotalTTC = function() {
		return $scope.getFactureTotalHT() * 1.20;
	}

	$scope.syncDates = function() {
		// If end date isn't filled, automatically update with start date
		if ($scope.facture.finTime == 0 && $scope.facture.debutTime != 0) {
			$scope.facture.fin = $scope.facture.debut;
		}
	}

	$scope.submitFacture = function() {
		// Update calculated fields
		var facture = $scope.facture;
		if (facture.idClient === undefined) {
			alert("Impossible d'enregistrer une facture sans client !");
		} else {
			facture.montantHT = $scope.getFactureTotalHT();
			facture.TVA = 0.2 * facture.montantHT;
			facture.montantTTC = $scope.getFactureTotalTTC();
			// Use <date>.getTime() because JSON can't encode properly
			facture.dateDebut = retrieveDate(facture.debutTime);
			facture.dateFin = retrieveDate(facture.finTime);
			facture.datePaie = retrieveDate(facture.datePaieTime);
			console.log("On enregistre la facture, id=" + $scope.facture.id);
			dbEngine.persistFacture(facture);
			$scope.selFacture(-1);

			init();
			$location.url("");

		}
	}

	$scope.exportPDF = function() {
		console.log("export PDF");
		var fileName = this.getNomClient($scope.facture.idClient);
		fileName += '_' + $scope.facture.debut;
		filename = 'facture_'+fileName+'.pdf';
		exportPdf('modeleFacture', filename);
	}

	$scope.getTotalFactures = function() {
		var total = 0;
		angular.forEach($scope.factures, function(fac) {
			total += fac.montantTTC;
		})
		return total;
	}

	$scope.getNbJours = function(fac) {
		var nbJours = 0;
		var lignes = fac.lignes;
		if (lignes) {
			for (var i = 0; i < lignes.length; i++) {
				nbJours += parseInt(lignes[i].qte, 10);
			}
		}
		return nbJours;
	}

	$scope.formateDureeFacture = function(facture) {
		return formateDureeString(new Date(facture.dateDebut), new Date(facture.dateFin));
	}

	$scope.deleteFacture = function(id) {
		console.log("vue sur "+$scope.selectedFacture());
		if (confirm("Etes vous sûr de supprimer cette facture ?")) {
			delete $scope.factures[id];
			if ($scope.selectedFacture() == id) {
				$location.url("");
			}
		}
	}
});
