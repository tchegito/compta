// Contrôleur des notes de frais
app.controller("ndfs", function($scope, $location, $routeParams, $rootScope, $filter) {

	init();

	$scope.selectedNdf = function() {
		return $rootScope.selectedNdf;
	};

	$scope.selNdf = function(id) {
		$rootScope.selectedNdf = id;
	};

	$scope.$on('reinit', function(event, args) {
		init();
	});
	$scope.idNdf = $routeParams.idNdf;

    var countEvtRefreshModele;

    function init() {
		$scope.ndfs = db.ndfs;
		// Access to company for print PDF
        $scope.company = db.company;
	}

    $scope.initNdf = function(f, forPrint) {
        console.log('initNdf');
        // Create a copy ot keep original safe
        $scope.ndf = angular.copy(f);
        // User real Date object
        $scope.ndf.dateMoisTime = new Date($scope.ndf.dateMois);
        for (var i=0;i<$scope.ndf.lignes.length;i++) {
            var ligne = $scope.ndf.lignes[i];
            if (ligne.dateNote != null) {
            	// In edition mode (from button in the list of 'ndf') datePicker hasn't filtered date
				// So we must do it ourselves here
                if (forPrint) {
                    ligne.dateNote = $filter('date')(ligne.dateNote, "dd/MM/yy");
                } else {
                	ligne.dateNoteTime = new Date(ligne.dateNote);
                }
            }
        }
    };

	if ($scope.idNdf) {
		console.log("Initialisation du formulaire, id="+$scope.idNdf);
        var ndf = db.ndfs[$scope.idNdf];
        $scope.initNdf(ndf);
	}

	$scope.resetForm = function() {
		$scope.ndf ={lignes:[], dateMoisTime:0};
	};

	$scope.ajouteLigne = function() {
		// Calculate quantity
		$scope.ndf.lignes.push( {
			dateNote: '',
			descriptif:"",
			tva55:0,
			tva10:0,
			tva20:0
		});
	};

	$scope.submitNdf = function() {
		// Update calculated fields
		//console.log("On enregistre la note de frais, id="+$scope.ndf.id);
		var ndf = $scope.ndf;
		var valid = $scope.checkForm(ndf);
		if (valid) {
			// Use <date>.getTime() because JSON can't encode date properly
			ndf.dateMois = retrieveDate(ndf.dateMoisTime);
			ndf.montantTTC = $scope.getNdfTotal();
			for (var i = 0; i < ndf.lignes.length; i++) {
				var ligne = ndf.lignes[i];
				//console.log("ligne "+i+" lieu="+ligne.descriptif+" dateNoteTime="+ligne.dateNoteTime+" date="+retrieveDate(ligne.dateNoteTime));
				ligne.dateNote = retrieveDate(ligne.dateNoteTime);
				delete ligne.error;
			}
			dbEngine.persistNdf(ndf);
			init();
			$scope.selNdf(-1);
			$location.url("");
		}
	};

	$scope.checkForm = function(ndf) {
		var valid = true;
		var month = $filter('date')(ndf.dateMoisTime, 'MM');
		for (var i = 0; i < ndf.lignes.length; i++) {
			var ligne = ndf.lignes[i];
			// Check positive value on each amount field
			var empty = true;
			['tva55', 'tva10', 'tva20', 'ttc'].forEach(function (val) {
				var amount = parseFloat(ligne[val], 10);
				if (!isNaN(amount) && amount != 0) {
					empty = false;
				}
				if (amount < 0) {
					ligne.error = 'error.amountNegative';
					valid = false;
				}
			});
			// Check empty line
			if (empty) {
				ligne.error = 'error.emptyLine';
				valid = false;
			}
			// Check date inside month (note that a null date is allowed)
			if (ligne.dateNoteTime != null) {
				var lineMonth = $filter('date')(ligne.dateNoteTime, 'MM');
				if (lineMonth != month) {
					ligne.error = 'error.lineOutsideMonth';
					valid = false;
				}
			}
			if (valid && ligne.error) {
				delete ligne.error;
			}
		}
		return valid;
	};

	$scope.getNdfTotal = function(field) {
		var ndf = $scope.ndf;
		var total = 0;
		for (var i = 0;i<ndf.lignes.length;i++) {
			var l = ndf.lignes[i];
			if (field !== undefined) {
				// If particular field is provided, only calculate on it
				total = addFloat(total, l[field]);
			} else {
				total += $scope.calculeTotalLigne(l);
			}
		}
		return total;
	};

	// Calculate sum of TVA for each NDF
	// Maybe a cache will be necessary one day for big data
	$scope.getTvaTotal = function(ndf) {
		return calculeTotalTvaNdf(ndf);
	};

	// Calculate sum for a line of note
	$scope.calculeTotalLigne = function(l) {
		return addFloat(l.tva55, l.tva10, l.tva20, l.ttc);
	};

	$scope.getListTotalTTC = function() {
		var totalTTC = 0;
		angular.forEach($scope.ndfs, function(ndf) {
			totalTTC += addFloat(ndf.montantTTC);
		});
		return totalTTC;
	};

	$scope.getListTotalTVA = function() {
		var totalTVA = 0;
		angular.forEach($scope.ndfs, function(ndf) {
			totalTVA += $scope.getTvaTotal(ndf);
		});
		return totalTVA;
	};

	$scope.supprimeLigne = function(numLigne) {
		$scope.ndf.lignes.splice(numLigne, 1);
	};

	$scope.deleteNdf = function(id) {
		if (confirm("Etes vous sûr de supprimer cette note de frais ?")) {
			delete $scope.ndfs[id];
			if ($scope.selectedNdf == id) {
				$location.url("");
			}
		}
	};

    $scope.exportPDF = function(name) {
        console.log("export PDF");
        var fileName = '_' + $scope.ndf.dateMois;
        filename = 'noteDeFrais_'+fileName+'.pdf';
        exportPdf(name, filename);
    };

    $scope.contentLoaded = function(c) {
        if (++countEvtRefreshModele == 2) {
            // First time: div is compiled. Second time: image is loaded.
            $scope.exportPDF('modeleNoteDeFraisListe');
        }
    };

    $scope.printNdf = function(ndfId) {
        var ndf = db.ndfs[ndfId];
        $scope.initNdf(ndf, true);
        countEvtRefreshModele = 0;
    };
});
