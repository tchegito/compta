localStorage.removeItem('ComptaClient');

var client = new dataClient('Tigernoma', '12 rue de la république\n69002 Bellecour', 'Pas signé encore!')
dbEngine.persistClient(client);
dbEngine.persistClient(new dataClient('JRA Company', "Somewhere in Sidney", 'En attente de mission'));

dbEngine.addContact(client, new dataContact('JRA', 'Himself', '0123456789', 'j.ragnagna@company.fr', 'Nice, saw once.'));
dbEngine.addContact(client, new dataContact('Popeye', 'Muscle', '0123456789', 'pop@ye.fr', 'Strong'));

dbEngine.persistFacture(new dataFacture(client.id, 450, 20, 540, new Date(),[
 {pu:45, qte:3, totalHT:135, descriptif:'Ligne de test'}
]));

dbEngine.persistNdf(new dataNdf(new Date(), 12, [
 {dateNote:new Date(), descriptif:"Meal", tva55:0, tva10:0, tva20:12}
]));

db.company = {
 nom:"AUSTRALOPITECHNOPHILE",
 adresse1:"9 rue des boucaniers",
 adresse2:"69007 Lyon",
 adresse3:"",
 statut:"SARL au capital de 50 euros",
 siret:"123 456 789 00010",
 rcs:"Lyon",
 tvaIntra:"FR 77 123 456 789",
 urlImage:"http://www.grapheine.com/wp-content/uploads/2013/01/tourism_australia_2012.jpg"
};

persistDb();