// Contrôleur des notes de frais
app.controller("ndfs", function($scope, $location, $routeParams, $rootScope, $filter, $interval, frais) {

    init();

	$scope.selNdf = function(id) {
        if (arguments.length == 0) {
            return $rootScope.selectedNdf;
        }
		$rootScope.selectedNdf = id;
		if (id == -1) {
            hidePopup();
		} else {
			preparePopup();
        	$location.url("ndf"+id);
        }
	};

	$scope.$on('reinit', function(event, args) {
		init();
	});

    $scope.initNdf = function(f, forPrint) {
        // Create a copy to keep original safe
        $scope.ndf = angular.copy(f);
        // User real Date object
        var dateNdf = $scope.ndf.dateMois;
        if (!dateNdf) {
            $scope.ndf.template = true;
        } else {
        	$scope.ndf.dateMoisTime = new Date(dateNdf);
		}
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

    $scope.idNdf = $routeParams.idNdf;

	if ($scope.idNdf) {
		var ndf = db.ndfs[$scope.idNdf];
		$scope.initNdf(ndf);
	} else {
        var f = db.frais;
        if (!f) {
        	f = { "salaire": 2600 };
		}
		$scope.frais = angular.copy(f);
	}

    var countEvtRefreshModele;

    function init() {
		$scope.ndfs = db.ndfs;
		// Access to company for print PDF
        $scope.company = db.company;
        if (!$scope.ndf) {
            $scope.ndf ={lignes:[], dateMoisTime:new Date()};
        }
	}


	$scope.createNdf = function() {
        preparePopup();
		$location.url("ndf");
	};

    // Find the template, if one exists
    $scope.getTemplate = function() {
		for (var key in db.ndfs) {
            var ndf = db.ndfs[key];
            if (!ndf.dateMois)
                return ndf;
        }
		return null;
	};

	$scope.ajouteLigne = function() {
		// Add at the beginning
		$scope.ndf.lignes.unshift( {
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
		if ($scope.ndf.template) {
			ndf.dateMoisTime = 0;
		}
		var valid = $scope.checkForm(ndf);
		if (valid) {
			if (!ndf.id) {
                // Is there a template defined ?
                var templateNote = $scope.getTemplate();
                if (templateNote) {
                    // Add default charges
                    for (var j=0;j<templateNote.lignes.length;j++) {
                    	var ligne = templateNote.lignes[j];
                        ndf.lignes.push(ligne);
                    }
                }
            }

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
		return frais.calculeTotalTvaNdf(ndf);
	};

	// Calculate sum for a line of note
	$scope.calculeTotalLigne = function(l) {
		return addFloat(l.tva55, l.tva10, l.tva20, l.ttc);
	};

	$scope.getListTotalTTC = function() {
		var totalTTC = 0;
		angular.forEach($scope.ndfs, function(ndf) {
			if (ndf.dateMois) {	// Doesn't count template notes
                totalTTC += addFloat(ndf.montantTTC);
            }
		});
		return totalTTC;
	};

	$scope.getListTotalTVA = function() {
		var totalTVA = 0;
		angular.forEach($scope.ndfs, function(ndf) {
            if (ndf.dateMois) {	// Doesn't count template notes
                totalTVA += $scope.getTvaTotal(ndf);
            }
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

            // Schedule because if we update scope data here, no rendering will be done
            $interval(function() {
                if ($scope.ndfsToPrint && $scope.ndfsToPrint.length > 0) {
                    var ndfId = $scope.ndfsToPrint.pop();
                    $scope.printNdf(ndfId);
                }
            }, 100, 1);
        }
    };

    $scope.printNdf = function(ndfId) {
        var ndf = db.ndfs[ndfId];
        $scope.initNdf(ndf, true);
        countEvtRefreshModele = 0;
    };

    $scope.printNdfs = function() {
        var ids = [];
        angular.forEach($scope.ndfs, function (ndf) {
            if (ndf.checked) {
                ids.push(ndf.id);
            }
        });
        if (ids.length == 0) {
            alert($filter('i18n')("error.printNoNdf"));
        } else {
            // Store all IDs to print
            $scope.ndfsToPrint = ids;
            console.log(ids);
            // Launch the first one (remaining will be targeted in 'contentLoaded')
            $scope.printNdf(ids.pop());
        }
    };

    $scope.toggleCheckAll = function(val) {
        angular.forEach($scope.ndfs, function(ndf) {
            ndf.checked = val;
        });
    };
});
