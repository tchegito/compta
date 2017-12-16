/**
 * Created by Tchegito on 29/10/2017.
 */
// Contrôleur de l'onglet "Bilan": évaluation des charges en pourcentage par périodes
app.controller("bilan", function($scope, $location, $filter, frais) {/**
 * Created by Tchegito on 29/10/2017.
 */
    $scope.bilan = {
        "periode": 1    // Trimestre
    };

    $scope.periodeRefs = [
        { "val" : 1 , "text" : "Trimestre"},
        { "val" : 2 , "text" : "Mois"},
        { "val" : 3 , "text" : "Année"}
    ];

    // Retrieve the date of the oldest bill we have, to determine activity beginning
    $scope.beginningActivity = function() {
        var d = new Date().getTime();
        for (var f in db.factures) {
            var facture = db.factures[f];
            d = Math.min(d, facture.dateDebut);
        }
        return new Date(d);
    };

    function finPeriode(date) {
        switch ($scope.bilan.periode) {
            case 1: // Trimestre
                return lastDayOfMonth(addMonth(firstDayOfTrimester(date), 2));
            case 2: // Mois
                return lastDayOfMonth(date);
            case 3: // Année
                return addDay(addMonth(firstDayOfYear(date), 11), -1);
        }
    }
    function displayDatePeriode(date) {
        if (!date) alert('date='+date);
        switch ($scope.bilan.periode) {
            case 1: // Trimestre
                return "T"+Math.floor(1+date.getUTCMonth() / 3)+" "+date.getUTCFullYear();
            case 2: // Mois
                return $filter('date')(date, "MMMM yyyy");
            case 3: // Année
                return $filter('date')(date, "yyyy");
        }

    }

    function makeLine(date, credit, debit) {
        return {
            "date": typeof date === "string" ? date : displayDatePeriode(date),
            "credit": credit,
            "debit": debit,
            "percent": credit != 0 ? Math.floor(100 * (debit / credit)) : 0
        };
    }
    $scope.getLines = function() {
        var beginning = $scope.beginningActivity();

        var cdate = beginning;
        cdate = firstDayOfMonth(cdate);
        var now = new Date();
        var lines = [];
        var totalCredit = 0;
        var totalDebit = 0;
        // 1) on va chercher toutes les factures sur la période ==> crédit
        // 2) on va chercher toutes les dépenses dans les échéances ==> débit
        while (cdate < now) {
            cdate.setUTCHours(0, 0, 0, 0);
            var dateFinPeriode = finPeriode(cdate); //lastDayOfMonth(cdate);
            dateFinPeriode.setUTCHours(23, 59, 0, 0);
            //console.log("d1="+cdate+" to d2="+dateFinPeriode);
            var montantCharges = frais.getChargesPeriod(cdate, dateFinPeriode);
            var montantCreditTTC = frais.getCreditsTTCPeriod(cdate, dateFinPeriode);
            var line = makeLine(cdate, montantCharges, montantCreditTTC);

            lines.push(makeLine(cdate, montantCreditTTC, montantCharges));
            totalCredit += montantCreditTTC;
            totalDebit += montantCharges;

            cdate = addDay(dateFinPeriode, 1);
        }

        // Add total
        lines.push( makeLine("total", totalCredit, totalDebit));

        return lines;
    };

    $scope.updateTable = function() {
        $scope.lines = $scope.getLines();
    };

    $scope.updateTable();
});