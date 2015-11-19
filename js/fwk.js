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