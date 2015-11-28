/**
 * Created by Tchegito on 27/09/2015.
 */

Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

function exportPdf(divId, fileName) {
    var content =[];

    var source = $('#'+divId).prop('outerHTML');
    //var fixedContent = source.innerHTML.replace(/\n/g, '');

    ParseHtml(content, source);
    //alert(JSON.stringify(content));
    pdfMake.fonts =
    {
        times_new_roman: {
            normal: 'times.ttf',
            bold: 'timesbd.ttf',
            italics: 'timesi.ttf',
            bolditalics: 'timesbi.ttf'
        }
    };
    pdfMake.createPdf({
        content: content,
        defaultStyle: {
            font: "times_new_roman"
        }}).download(fileName);
}

function openFile(mimeType, object, filename) {
    // Opens a file containing all DB informations
    var a         = document.createElement('a');
    a.href        = 'data:'+mimeType+',' + JSON.stringify(object);
    a.target      = '_blank';
    a.download    = filename;

    document.body.appendChild(a);
    a.click();
}

/** Smart method to format with number of digit.
 * Seen here: http://stackoverflow.com/questions/8043026/javascript-format-number-to-have-2-digit
 * @param value
 * @param numberDigit
 * @returns {string}
 */
function formatNumber(value, numberDigit) {
    return ("00" + value).slice(-numberDigit);
}

// Check that a given object is not an array. In this case, transforms it into a JS object
function sanitizeObj(container) {
    if (container.splice != undefined) {
        // This is an array => tranforms it to an object
        var obj = {};
        var length = container.length;
        for (var i=0;i<length;i++) {
            var element = container[i];
            obj[element.id] = element;
        }
        return obj;
    } else {
        return container;
    }
}

// Add every parsed float given as parameters. That means it could be either string or numeric
function addFloat() {
    var total=0;
    for (var a=0;a<arguments.length;a++) {
        total += parseFloat(arguments[a], 10);
    }
    return total;
}