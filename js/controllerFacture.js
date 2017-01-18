////////////////////////////
// Contrôleur de factures //
////////////////////////////
app.controller("factures", function($scope, $location, $routeParams, $rootScope, $filter) {
	init();

	$scope.$on('reinit', function(event, args) {
		init();
	});
	$scope.idFacture = $routeParams.idFacture;



	$scope.initFacture = function(f) {
		// Create a copy to keep original safe
		$scope.facture = angular.copy(f);
		// User real Date object
		$scope.facture.debutTime = new Date(f.dateDebut);
		$scope.facture.finTime = new Date(f.dateFin);
		if (f.datePaie != null) {
			$scope.facture.datePaieTime = new Date(f.datePaie);
		}
	};

	if ($scope.idFacture) {
		var facture = db.factures[$scope.idFacture];
		$scope.initFacture(facture);
	}

	$scope.selectedFacture = function() {
		return $rootScope.selectedFacture;
	};

	$scope.selFacture = function(id) {
		$rootScope.selectedFacture = id;
        if (id == -1) {
        	hidePopup();
        } else {
        	preparePopup();
        	$location.url("facture"+id);
		}
	};


	function init() {
		$scope.factures = db.factures;
		$scope.clients = db.clients;
		$scope.company = db.company;
	}

	$scope.createFacture = function() {
		$scope.facture ={lignes:[], debutTime:0, finTime:0};
		preparePopup();
		$location.url("facture");
	};

	$scope.getNomClient = function(idClient) {
		return db.clients[idClient].nom;
	};

	$scope.getCurrentClient = function() {
		return db.clients[$scope.facture.idClient];
	};

	$scope.getNumeroFacture = function(facture) {
		// Format number with 3 digit
		var numFacture = formatNumber(facture.id + 1, 3);
		var d = facture.debutTime;
		if (d == 0 || d == null || d === undefined) {
			d = new Date();
		}
		return (1900 + d.getYear()) + numFacture;
	};

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
			alert($filter('i18n')("error.facSansClient"));
			return;
		}
		if (dateFin < dateDebut) {
			alert($filter('i18n')("error.datesIncoher"));
		}
		$scope.facture.lignes.push( {
			descriptif:"Mission "+this.getNomClient(idClient),
			qte:nbJours,
			pu:tjm,
			montantHT:0
		});
	};

	$scope.supprimeLigne = function(numLigne) {
		$scope.facture.lignes.splice(numLigne, 1);
	};

	// Calculate, store and return
	$scope.calculLigneMontantHT = function(ligne) {
		ligne.montantHT = ligne.qte * ligne.pu;
		return ligne.montantHT;
	};

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
	};

	$scope.getFactureTotalTTC = function() {
		return $scope.getFactureTotalHT() * 1.20;
	};

	$scope.syncDates = function() {
		// If end date isn't filled, automatically update with start date
		if ($scope.facture.finTime == 0 && $scope.facture.debutTime != 0) {
			$scope.facture.fin = $scope.facture.debut;
		}
	};

	// Called when user changes 'pay date' field ==> automatically check 'paid' field
    $scope.syncPaidCheck = function() {
    	if ($scope.facture.datePaie != null) {
    		$scope.facture.payee = true;
		}
	};

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
	};

	// Parameter is the name of 'div' element containing HTML to print
	// Actually, we have 1 div to print from the list, and another one to print from 1 bill

	// TODO: maybe we could only use HTML in string without using DOM ?
	// With following code:
	//var htmlcontent = $('#modeleFacture');

	//htmlcontent.load('templates/modeleFacture.html', function() {
	//	$compile(htmlcontent.contents())($scope);
	//	alert('compile ok');
	//	$scope.exportPDF();
	//});
	$scope.exportPDF = function(name) {
		console.log("export PDF");
		var fileName = this.getNomClient($scope.facture.idClient);
		fileName += '_' + $scope.facture.debut;
		filename = 'facture_'+fileName+'.pdf';
		exportPdf(name, filename);
	};

	var countEvtRefreshModele;

	$scope.contentLoaded = function(c) {
		if (++countEvtRefreshModele == 2) {
			// First time: div is compiled. Second time: image is loaded.
			$scope.exportPDF('modeleFactureListe');
		}
	};

	$scope.printFacture = function(factureId) {
        var facture = db.factures[factureId];
        $scope.initFacture(facture);
        countEvtRefreshModele = 0;
    };


	$scope.getTotalFactures = function() {
		var total = 0;
		var totalPaid = 0;
		angular.forEach($scope.factures, function(fac) {
			total += fac.montantTTC;
			if (fac.datePaie != null) {
				totalPaid += fac.montantTTC;
			}
		});
		return $filter('currency')(totalPaid)
			+ " / "
			+ $filter('currency')(total);
	};

	$scope.getNbJours = function(fac) {
		var nbJours = 0;
		var lignes = fac.lignes;
		if (lignes) {
			for (var i = 0; i < lignes.length; i++) {
				nbJours += parseFloat(lignes[i].qte, 10);
			}
		}
		return nbJours;
	};

	$scope.formateDureeFacture = function(facture) {
		return formateDureeString(new Date(facture.dateDebut), new Date(facture.dateFin));
	};

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
