
var db = {
	clients: {},
	contacts: {},
	factures: {},
	ndfs: {},
	company: {},	// Unique
	echeances: {},
	idClient: 0,
	idContact: 0,
	idFacture: 0,
	idNdf: 0,
	idEcheance: 0
};

var dbEngine = {
	persistClient: function(client) {	// On récupère un client tout bien renseigné, il ne manque plus que l'ID
		var c;
		if (client.id === undefined) {
			c = new dataClient(client.nom, client.adresse, client.recitXP);
			c.id = db.idClient++;
			client.id = c.id;
		} else {
			c = client;
		}
		db.clients[c.id] = c;
	},
	persistContact: function(contact) {
		var c;
		if (contact.id === undefined) {
			c = new dataContact(contact.nom, contact.prenom, contact.tel, contact.mail, contact.info);
			c.id = db.idContact++;
			contact.id = c.id;
		} else {
			c = contact;
		}
		db.contacts[c.id] = c;
	},
	addContact: function (client, contact) {
		//obj.fkClient = this;
		this.persistContact(contact);
		client.contacts.push(contact.id);
		db.contacts[contact.id] = contact;
	},
	removeContact: function(clientId, contactId) {
		console.log('suppression du contact '+clientId+' du client '+clientId);
		var contacts = db.clients[clientId].contacts;
		console.log("avant="+contacts);
		var idx = contacts.indexOf(contactId);
		contacts.splice(idx, 1);
		delete db.contacts[contactId];
	},
	persistFacture: function (facture) {
		var f = facture;
		if (facture.id === undefined) {
			f = new dataFacture(facture.idClient, facture.montantHT, facture.tva, facture.montantTTC,
				facture.dateDebut, facture.dateFin, facture.paye, facture.datePaie);
			f.id = db.idFacture++;
		}
		f.lignes = facture.lignes;
		db.factures[f.id] = f;
	},
	// Replace current DB by given one, and update counters
	persistNdf: function (ndf) {
		var n = ndf;
		if (ndf.id === undefined) {
			n = new dataNdf(ndf.dateMois, ndf.montantTTC);
			n.id = db.idNdf++;
		}
		n.lignes = ndf.lignes;
		db.ndfs[n.id] = n;
	},
	persistEcheance: function (echeance) {
		var e = echeance;
		if (echeance.id === undefined) {
			e = new dataEcheance(echeance.nom, echeance.nature);
			e.id = db.idEcheance++;
		}
		e.lignes = echeance.lignes;
		db.echeances[e.id] = e;
	},
	// Replace current DB by given one, and update counters
	importDb: function (loadedDb) {
		db = loadedDb;
		/* Legacy code
		if (confirm("on deduit les id ?")) {
			db.idClient = Object.size(db.clients);
			db.idContact = Object.size(db.contacts);
			db.idFacture = Object.size(db.factures);
			db.idNdf = Object.size(db.ndfs);
		}
		if (db.ndfs === undefined) {
			db.ndfs = {};
		}*/
		// Be sure that every data is in an object, and not an array
		db.clients = sanitizeObj(db.clients);
		db.factures = sanitizeObj(db.factures);
		db.ndfs = sanitizeObj(db.ndfs);
		db.contacts = sanitizeObj(db.contacts);
		db.echeances = sanitizeObj(db.echeances);
		sanitizeIds();
		sanitizeContacts();
	},
	removeNdf: function (id) {
		delete db.ndfs[id];
	},
	removeFacture: function (id) {
		delete db.factures[id];
	},
	removeClient: function (id) {
		delete db.clients[id];
	},
	persistCompany: function (company) {
		db.company = new company(company);
	}
};

// Check if IDs are well assigned. These IDs indicates the next PK for each category of saved data.
function sanitizeIds() {
	setIds(db.clients, "idClient");
	setIds(db.factures, "idFacture");
	setIds(db.ndfs, "idNdf");
	setIds(db.contacts, "idContact");
	setIds(db.echeances, "idEcheance");

	function setIds(collection, idName) {
		if (db[idName] === undefined || db[idName] == null) {
			db[idName] = findMax(collection)+1;
		}
	}
}

function sanitizeContacts() {
	// Get every contact' ID
	var arrIdContacts = [];
	for (co in db.contacts) {
		arrIdContacts.push(db.contacts[co].id);
	}
	// Remove every contact gathered in clients from this array
	for (cl in db.clients) {
		var client = db.clients[cl];
		for (co in client.contacts) {
			var idContact = client.contacts[co];
			arrIdContacts.splice( arrIdContacts.indexOf(idContact), 1);
		}
	}
	console.log("remove "+arrIdContacts.length+" unused contacts");
	arrIdContacts.forEach(function(unusedId) {
		delete db.contacts[unusedId];
	});
}

function findMax(collection) {
	var max = 0;
	for (var key in collection) {
		max = Math.max(collection[key].id, max);
	}
	return max;
}

var company = function(c) {
	this.nom = c.nom;
	this.adresse1 = c.adresse1;
	this.adresse2 = c.adresse2;
	this.adresse3 = c.adresse3;	// Optional
	this.statut = c.statut; // SARL au capital de xxx euros
	this.siret = c.siret;
	this.rcs = c.rcs;
	this.tvaIntra = c.tvaIntra;
	this.urlImage = c.urlImage;
};

var dataClient = function(nom, adresse, recitXP) {
	this.nom = nom;
	this.adresse = adresse;
	this.recitXP = recitXP;
	this.contacts = [];
};


var dataContact = function(nom, prenom, tel, mail, info) {
	this.nom = nom;
	this.prenom = prenom;
	this.tel = tel;
	this.mail = mail;
	this.info = info;
};

var dataFacture = function(idClient, montantHT, tva, montantTTC, dateDebut, dateFin, paye, datePaiement, lignes) {
	this.idClient = idClient;
	this.montantHT = montantHT;
	this.tva = tva;
	this.paye = paye;
	this.datePaie = datePaiement;
	this.montantTTC = montantTTC;
	// These fields are a <date>.getTime() result (=ms since 1970). Because JSON can't encode/decode Date correctly
	this.dateDebut = dateDebut;
	this.dateFin = dateFin;
	if (lignes === undefined) {
		this.lignes = [];
	}else {
		this.lignes = lignes;
	}
	this.addLigne = function(ligne) {
		this.lignes.push(ligne);
	};
};

var dataLigneFacture = function(fkFacture, prixUnitaire, quantite, totalHT, descriptif) {
	this.fkFacture = fkFacture;
	this.pu = prixUnitaire;
	this.qte = quantite;
	this.totalHT = totalHT;
	this.descriptif = descriptif;
};


// Note de frais
var dataNdf = function(dateMois, montantTTC, lignes) {
	this.dateMois = dateMois;
	this.montantTTC = montantTTC;
	if (lignes === undefined) {
		this.lignes = [];
	}else {
		this.lignes = lignes;
	}
};

var dataLigneNdf = function(fkNdf, dateNote, descriptif, tva55, tva10, tva20, ttc) {
	this.fkNdf = fkNdf;
	this.dateNote = dateNote;
	this.descriptif = descriptif;
	this.ttc = ttc;
	this.tva55 = tva55;
	this.tva10 = tva10;
	this.tva20 = tva10;
};

// Echéances
var dataEcheance = function(nom, nature, lignes) {
	this.nom = nom;
	this.nature = nature;
	if (lignes === undefined) {
		this.lignes = [];
	} else {
		this.lignes = lignes;
	}
};

var dataLigneEcheance = function(dateLimite, montant, datePaiement, debutPeriode, finPeriode) {
	this.dateLimite = dateLimite;
	this.montant = montant;
	this.datePaiement = datePaiement;
	this.debutPeriode = debutPeriode;
	this.finPeriode = finPeriode;

};