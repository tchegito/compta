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

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function preparePopup() {
    $('.modal').css('opacity', 0);
    $('.modal').css('display', 'table');
    $('.modal').animate({opacity: 1}, 1000);
}
function displayPopup() {
    $(document).ready(function () {
        var value = 1;
        $('#subWin').css('opacity', 0);
        $('#subWin').animate({opacity: value}, 100);
    });
}

function hidePopup() {
    $('#subWin').animate({opacity: 0}, 100, function () {
        $('.modal').animate({opacity: 0}, 100, function () {
            $('.modal').hide();
        });
    });
}

function messageBottom(mess) {
    var elem = jQuery('<div/>', {
        class:'messageBottom'
    });
    $('body').append(elem);
    elem.html(mess);
    var height = elem.css('height');
    elem.css('top', '+='+height);
    elem.css('height', height);
    elem.animate( { "top" : "-="+height}, 1000);
    setTimeout(function() {
        elem.animate( { opacity : 0}, 3000, function() {
            elem.remove();
        });
    }, 5000);
}

$(document).ready(function() {
    messageBottom('Tigernoma vous souhaite la bienvenue dans ComptaClient !');
});