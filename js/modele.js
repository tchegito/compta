
var idClient = 0;
var idContact = 0;
var idFacture = 0;
var idNdf = 0;

var db = {
	clients: {},
	contacts: {},
	factures: {},
	ndfs: {}
}

var dbEngine = {
	//  A voir si on ne peut pas faire une map indexée par id (et du coup virer cette méthode)
	getClientByName: function (name) {
	 for (var idClient in db.clients) {
		 var c = db.clients[idClient];
		 if (c.nom == name) {
			 return c;
		 }
	 }
	 return;
    },
	persistClient: function(client) {	// On récupère un client tout bien renseigné, il ne manque plus que l'ID
		var c;
		if (client.id === undefined) {
			c = new dataClient(client.nom, client.adresse, client.recitXP);
			c.id = idClient++;
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
			c.id = idContact++;
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
	persistFacture: function (facture) {
		var f = facture;
		if (facture.id === undefined) {
			f = new dataFacture(facture.idClient, facture.montantHT, facture.tva, facture.montantTTC,
				facture.dateDebut, facture.dateFin);
			f.id = idFacture++;
		}
		f.lignes = facture.lignes;
		db.factures[f.id] = f;
	},
	// Replace current DB by given one, and update counters
	persistNdf: function (ndf) {
		var n = ndf;
		if (ndf.id === undefined) {
			n = new dataNdf(ndf.dateMois, ndf.montantTTC);
			n.id = idNdf++;
		}
		n.lignes = ndf.lignes;
		db.ndfs[n.id] = n;
	},
	// Replace current DB by given one, and update counters
	importDb: function (loadedDb) {
		db = loadedDb;
		idClient = Object.size(db.clients);
		idContact = Object.size(db.contacts);
		idFacture = Object.size(db.factures);
		idNdf = Object.size(db.ndfs);
		if (db.ndfs === undefined) {
			db.ndfs = {};
		}
	}
}

var dataClient = function(nom, adresse, recitXP) {
	this.nom = nom;
	this.adresse = adresse;
	this.recitXP = recitXP;
	this.contacts = [];
}


var dataContact = function(nom, prenom, tel, mail, info) {
	this.nom = nom;
	this.prenom = prenom;
	this.tel = tel;
	this.mail = mail;
	this.info = info;
}

var dataFacture = function(idClient, montantHT, tva, montantTTC, dateDebut, dateFin, lignes) {
	this.idClient = idClient;
	this.montantHT = montantHT;
	this.tva = tva;
	this.paye = false;
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
}

var dataLigneFacture = function(fkFacture, prixUnitaire, quantite, totalHT, descriptif) {
	this.fkFacture = fkFacture;
	this.pu = prixUnitaire;
	this.qte = quantite;
	this.totalHT = totalHT;
	this.descriptif = descriptif;
}


// Note de frais
var dataNdf = function(dateMois, montantTTC, lignes) {
	this.dateMois = dateMois;
	this.montantTTC = montantTTC;
	if (lignes === undefined) {
		this.lignes = [];
	}else {
		this.lignes = lignes;
	}
}

var dataLigneNdf = function(fkNdf, dateNote, descriptif, tva55, tva10, tva20) {
	this.fkNdf = fkNdf;
	this.dateNote = dateNote;
	this.descriptif = descriptif;
	this.tva55 = tva55;
	this.tva10 = tva10;
	this.tva20 = tva10;
}