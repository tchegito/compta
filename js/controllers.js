var DB_NAME = 'ComptaClient';

var app = angular.module("comptaClient", ['ngRoute']);

// Initialisation des routes
app.config( function($routeProvider) {
	$routeProvider
	// Si l'idClient est renseigné, on est en édition. Sinon création.
	.when("/client:idClient?",{
		templateUrl:"./templates/client.html",
		controller:"main"
	})
	.when("/facture:idFacture?", {
		templateUrl: "./templates/facture.html",
		controller: "factures"
	})
	.when("/ndf:idNdf?",{
		templateUrl:"./templates/ndf.html",
		controller:"ndfs"
		/*
	}).when("/contact",{
		templateUrl:"./templates/contact.html",
		controller:"main"*/
	}).otherwise( {
		redirectTo:"/"
		});
});

app.run(function($location) {
	console.log("init");
	$location.url("");
});

// Controleurs
app.controller("main", function($scope, $location, $rootScope, $routeParams) {
	function init() {
		$scope.clients = db.clients;
	}
	init();

	$scope.$on('reinit', function(event, args) {
		console.log('reinit main controller');
		init();
	});

	// Get back idClient from URL parameters
	$scope.idClient = $routeParams.idClient;
	// Stores route for each tab
	$scope.savedRoute = [];

	console.log("controller");
	// Init tabs
	$scope.tab = 1;

	// Init form
	console.log("idclient="+$scope.idClient);
	$scope.contact = {};

	$scope.selectedTab = function() {
		return $scope.tab;
	}

	$scope.selectTab = function(givenTab) {
		$scope.savedRoute[$scope.tab] = $location.url();
		$scope.idClient = undefined;
		$scope.tab = givenTab;
		// Restore previous route (if exists)
		var previousRoute = $scope.savedRoute[$scope.tab]
		if (previousRoute) {
			console.log("on a trouve "+previousRoute);
			$location.url(previousRoute);
		} else {
			$location.url("");
		}
	}
	if ($scope.idClient) {
		console.log("Initialisation du formulaire, id="+$scope.idClient);
		var client = db.clients[$scope.idClient];
		// Create a copy ot keep original safe
		$scope.client = angular.copy(client);
		if (client) {
			console.log(client);
			$scope.contact = {};
			$scope.updateContacts($scope.idClient);
			$scope.idContact = -1;
			//$scope.idContact = $scope.contact.id;
		}
	}

	$scope.updateContacts = function(idClient) {
		var listeContacts = [];
		var dbContacts = db.clients[idClient].contacts;
		console.log("idClient="+idClient+" trouve="+dbContacts);
		for (var i=0;i<dbContacts.length;i++) {
			listeContacts.push(db.contacts[dbContacts[i]]);
		}
		$scope.contacts = listeContacts;
	}

	$scope.isVisibleContact = function() {
		return $scope.idContact != -1;
	}

	$scope.openContact = function(idContact) {
		$scope.contact = angular.copy(db.contacts[idContact]);
		$scope.idContact = idContact;
		console.log(idContact);
	};

	$scope.creerContact = function() {
		$scope.contact = {}
		$scope.idContact = undefined;
		console.log($scope.idContact);
	};

	$scope.submitClient = function() {
		var client = $scope.client;
		dbEngine.persistClient(client);
		console.log('On vient de créer '+client);

		// Now, we have to quit this page, and go back to main menu
		$location.url("");
	};

	$scope.submitContact = function() {
		var contact = $scope.contact;
		var idClient = $scope.idClient;
		console.log(contact);
		if (contact.id !== undefined) {
			// Contact already exist : we just update it
			dbEngine.persistContact(contact);
			console.log('Mise a jour de '+contact);
		} else {
			dbEngine.addContact(db.clients[idClient], contact);
			console.log('On vient de créer '+contact);
		}
		$scope.updateContacts(idClient);
	};
	$scope.resetForm = function() {
		console.log("on reset");
		$scope.client ={};
	}

	// Load a data file
	$scope.importDb = function(file) {

		console.log(file);
		var reader = new FileReader();
		reader.onload = function(e) {
			var temp = JSON.parse(e.target.result);
			if (temp.clients && temp.contacts) {
				alert('Chargement réussi pour:\n'+ Object.size(temp.clients)+ ' clients\n'
				+ Object.size(temp.contacts)+' contacts\n'+Object.size(temp.factures)+' factures');
				dbEngine.importDb(temp);
				// Tell all the scope to reinit
				$rootScope.$broadcast('reinit', $scope.name);
			}
		};

	    reader.readAsText(file);
	}
});

////////////////////////////
// Contrôleur de factures //
////////////////////////////
app.controller("factures", function($scope, $location, $routeParams, $filter) {
	console.log("on est dans le controller factures");
	init();


	$scope.$on('reinit', function(event, args) {
		console.log('reinit factures controller');
		init();
	});
	$scope.idFacture = $routeParams.idFacture;

	$scope.selectedFacture = -1;

	if ($scope.idFacture) {
		console.log("Initialisation du formulaire, id="+$scope.idFacture);
		var facture = db.factures[$scope.idFacture];
		// Create a copy to keep original safe
		$scope.facture = angular.copy(facture);
		// User real Date object
		$scope.facture.debutTime = new Date($scope.facture.dateDebut);
		$scope.facture.finTime = new Date($scope.facture.dateFin);
	}

	$scope.selFacture = function(id) {
		$scope.selectedFacture = id;
	}

	function init() {
		$scope.factures = db.factures;
		$scope.clients = db.clients;
	}

	$scope.resetForm = function() {
		console.log("on reset la facture");
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
		return (1900 + $scope.facture.debutTime.getYear()) + numFacture;
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
		console.log("On enregistre la facture, id="+$scope.facture.id);
		var facture = $scope.facture;
		facture.montantHT = $scope.getFactureTotalHT();
		facture.TVA = 0.2 * facture.montantHT;
		facture.montantTTC = $scope.getFactureTotalTTC();
		// Use <date>.getTime() because JSON can't encode properly
		facture.dateDebut = retrieveDate(facture.debutTime);
		facture.dateFin = retrieveDate(facture.finTime);
		dbEngine.persistFacture(facture);
		init();
		$location.url("");
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

	$scope.formateDureeFacture = function(facture) {
		return formateDureeString(new Date(facture.dateDebut), new Date(facture.dateFin));
	}
});

// Contrôleur des notes de frais
app.controller("ndfs", function($scope, $location, $routeParams) {

	console.log("on est dans le controller ndf");
	init();

	$scope.selectedNdf = -1;

	$scope.selNdf = function(id) {
		$scope.selectedNdf = id;
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
		dbEngine.persistNdf(ndf);
		init();
		$location.url("");
	}

	$scope.getNdfTotal = function(field) {
		ndf = $scope.ndf;
		var total = 0;
		for (var i = 0;i<ndf.lignes.length;i++) {
			var l = ndf.lignes[i];
			if (field !== undefined) {
				// If particular field is provided, only calculate on it
				total += l[field];
			} else {
			total += l.tva55 + l.tva10 + l.tva20;
			}
		}
		return total;
	}

	$scope.supprimeLigne = function(numLigne) {
		$scope.ndf.lignes.splice(numLigne, 1);
	}
});

function persistDb() {
	localStorage.setItem(DB_NAME, JSON.stringify(db));
}

function restoreDb() {
	var temp= JSON.parse(localStorage.getItem(DB_NAME));
	if (temp !== undefined && temp != null) {
		dbEngine.importDb(temp);
	}
}

function exportDb() {
	openFile('text/attachment', db, 'data.txt');
}

function retrieveDate(field) {
	if (field && field.getTime()) {
		return field.getTime();
	} else {
		return undefined;
	}
}

// Intégration du datepicker de jQuery UI
// A la mise à jour, on alimente une propriété dans le même scope avec le nom
// <name>Time qui contient l'objet Date. Alors que la propriété bindée contient
// la chaîne affichée (=date formatée).
app.directive('datePicker', function($filter) {
	return {
		restrict: "A",
		require : "ngModel",
		link: function (scope, element, attrs, ngModelCtrl) {
			var ngModelName = scope.$eval(attrs.ngModel);
			var initDate = getValue(scope, attrs.ngModel+'Time');
			element.datepicker({
				dateFormat:'dd/mm/yy',
				onSelect: function (formattedDate) {
					var val = element.datepicker('getDate');
					initTimeField(val);
					ngModelCtrl.$setViewValue(formattedDate);
					console.log('on sort de onselect');
                }
			});
			function initTimeField(val) {
				var timeAtt = attrs.ngModel + 'Time';
				setValue(scope, timeAtt, val);
			}
			// Init two fields: model and view
			element.datepicker('setDate', initDate);
			ngModelCtrl.$setViewValue($filter('date')(initDate, 'dd/mm/yy'));
		}
	};
});

// JQueryUI can't parse date format without day (see this: http://bugs.jqueryui.com/ticket/8510)
// So we use an alternate plugin 'MonthPicker', which usage differs slightly about method/parameter names, but works great.
app.directive('monthPicker', function($filter) {
	return {
		restrict: "A",
		require : "ngModel",
		link: function (scope, element, attrs, ngModelCtrl) {
			var ngModelName = scope.$eval(attrs.ngModel);
			var initDate = getValue(scope, attrs.ngModel+'Time');
			element.MonthPicker({
				Button: false,
				MonthFormat:"MM yy",
				SelectedMonth:initDate, // Init date at first view
				OnAfterChooseMonth: function (date) {
					initTimeField(date);
					console.log('on sort de onselect' + date);

				}
			});
			function initTimeField(val) {
				var timeAtt = attrs.ngModel + 'Time';
				setValue(scope, timeAtt, val);
			}
			// Init two fields: model and view
			ngModelCtrl.$setViewValue($filter('date')(initDate, 'MMMM yy'));
		}
	};
});



app.directive('numeric', function () {
	return {
		restrict: 'A',
		require: 'ngModel',
		scope: {
			model: '=ngModel',
		},
		link: function (scope, element, attrs) {
			scope.$watch(attrs.ngModel, function () {
				if (!scope.model) {
					// inits with default val
					scope.model = 0;
				} else if (scope.model && typeof scope.model === 'string') {
					// console.log('value changed, new value is: ' + (typeof scope.model));
					scope.model = parseInt(scope.model);
					// console.log('value changed, new value is: ' + (typeof scope.model));
				}
			});
		}
	};
});

app.filter("toArray", function(){
	return function(obj) {
		var result = [];
		angular.forEach(obj, function(val, key) {
			result.push(val);
		});
		return result;
	};
});

function analyse(scope, expr) {
	// If attribute is nested inside other container
	if (expr.indexOf(".") != -1) {
		var objAttributes = expr.split(".");
		var lastAttribute = objAttributes.pop();
		var partialObjString = objAttributes.join(".");
		var partialObj = eval("scope." + partialObjString);

		return {scope:partialObj, idx:lastAttribute};
	} else {
		return {scope:scope, idx:expr};
	}

}
function getValue(scope, expr) {
	var an = analyse(scope, expr);
	if (an.scope === undefined) {
		return '';
	}
	return an.scope[an.idx];
}
function setValue(scope, expr, val) {
	var an = analyse(scope, expr);
	an.scope[an.idx] = val;
}