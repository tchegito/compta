app.controller("clients", function($scope, $location, $routeParams, $rootScope, $filter) {

	// Get back idClient from URL parameters
	$scope.idClient = $routeParams.idClient;

	$scope.selClient = function(id) {
		if (arguments.length == 0) {
			return $rootScope.selectedClient;
		}
		$rootScope.selectedClient = id;
	}

	$scope.updateContacts = function(idClient) {
		var listeContacts = [];
		var dbContacts = db.clients[idClient].contacts;
		for (var i=0;i<dbContacts.length;i++) {
			listeContacts.push(db.contacts[dbContacts[i]]);
		}
		$scope.contacts = listeContacts;
	}

	if ($scope.idClient) {
		console.log("Initialisation du formulaire, id="+$scope.idClient);
		var client = db.clients[$scope.idClient];
		// Create a copy ot keep original safe
		$scope.client = angular.copy(client);
		if (client) {
			$scope.contact = {};
			$scope.updateContacts($scope.idClient);
			$scope.idContact = -1;
			//$scope.idContact = $scope.contact.id;
		}
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
		$scope.contact = {};
		$scope.idContact = undefined;
		console.log($scope.idContact);
	};

	$scope.submitClient = function() {
		var client = $scope.client;
		dbEngine.persistClient(client);
		console.log('On vient de créer '+client);

		// Now, we have to quit this page, and go back to main menu
		$scope.selClient(-1);
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
		// Hide contact edition
		$scope.idContact = -1;
	};
	$scope.resetForm = function() {
		console.log("on reset");
		$scope.client ={};
	};

	$scope.deleteClient = function(idClient) {
		// Consistent checked
		var consistent = true;
		for (var i=0;i<Object.size(db.factures);i++) {
			if (db.factures[i].idClient == idClient) {
				consistent = false;
			}
		}
		if (!consistent) {
			alert('Impossible de supprimer ce client, car une facture le concerne.');
		} else {
			if (confirm("Etes vous sûr de supprimer ce client ?")) {
				dbEngine.removeClient(idClient);
				if ($scope.selectedClient == idClient) {
					$location.url("");
				}
			}
		}
	};

	// Return number of "factures" and money
	$scope.getFactureDisplay = function(id) {
		var nbFac = 0;
		var money = 0;
		var factures = dbEngine.getClientFactures(id);
		factures.forEach(function (fac) {
			nbFac++;
			money += fac.montantTTC;
		});

		var result = "-";
		if (nbFac != 0) {
			result = nbFac + " ("+$filter('currency')(money)+")";
		}
		return result;
	};

	$scope.getClientPaymentDuration = function(id) {
		var factures = dbEngine.getClientFactures(id);
		var sum = 0;
		factures.forEach(function (fac) {
			if (fac.datePaie) {
				var dateRemiseFacture = new Date(fac.dateDebut);
				var dateFinMois = addDay(addMonth(firstDayOfMonth(dateRemiseFacture), 1), -1);
				var delai = ecartJours(dateFinMois, new Date(fac.datePaie));
				sum += delai;
			}
		});
		// Calculate the average
		if (factures.length == 0) {
			return "-";
		}
		var avg = parseInt(sum / factures.length, 10);
		return avg+" jours";
	};

	$scope.deleteContact = function(id) {
		if (confirm("Etes vous sûr de supprimer ce contact ?")) {
			var idClient = $scope.client.id;
			dbEngine.removeContact(idClient, id);
			$scope.updateContacts(idClient);
		}
	}

});
