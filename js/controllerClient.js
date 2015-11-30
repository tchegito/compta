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
		console.log("idClient="+idClient+" trouve="+dbContacts);
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
			console.log(client);
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
		$scope.contact = {}
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
			}
		};

	    reader.readAsText(file);
	}

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
	}

});
