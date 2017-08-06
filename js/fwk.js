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
    // We'll increase opacity of modal, without touching to subWin opacity.
    // Both div will benefits from container opacity
    $('.modal').css('opacity', 0);
    $('.modal').css('display', 'table');
    $('#subWin').css('opacity', 1);
    $('.modal').animate({opacity: 1}, 1000);
}


/** Hide the popup smoothly **/
function hidePopup() {
    $('#subWin').animate({opacity: 0}, 150, function () {
        $('.modal').animate({opacity: 0}, 150, function () {
            $('.modal').hide();
        });
    });
}

console.log("riri");
$('#subWin').keydown(function(event) {
    console.log("press key "+event.keyCode);
});

function messageBottom(mess) {
    // Search for existing messages (used at the end of the function)
    var elems = $('.messageBottom');

    // Create a new box
    var elem = jQuery('<div/>', {
        class:'messageBottom'
    });
    $('body').append(elem);
    elem.html(mess);
    var realHeight = elem.css('height');
    // Count padding/margin with outerHeight() on Y-axis to get the real height
    var height = elem.outerHeight(); //realHeight + padTop + padBottom;
    elem.css('top', '+='+height);
    elem.css('height', realHeight);
    elem.animate( { top : "-="+height}, 1000);
    setTimeout(function() {
        // Diminush opacity, then remove completely element after a given time
        elem.animate( { opacity : 0}, 3000, function() {
            elem.remove();
        });
    }, 5000);

    // Shift all existing box upside with new box height
    if (elems.length > 0) {
        elems.each(function(idx, e) {
            $(e).animate( { "top" : "-="+height }, 1000);
        })

    }
}

function fixTableRows(elementId) {
    // Find header to fix: exclude the one already fixed by floatThead plugin
    var elements = $('table.roundTable:not(.floatThead-table)');

    elements.each(function() {
        if ($(this).prop('class').indexOf('floatThead') == -1) {
            $(this).floatThead(
                {
                    scrollContainer: function ($table) {
                        return $table.closest('.clientTab');
                    }
                }
            );
        }
    });
}

function addCommas(nStr)
{
    nStr += '';
    x = nStr.split('.');
    x1 = x[0];
    x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + ' ' + '$2');
    }
    return x1 + x2;
}

$(document).ready(function() {
    messageBottom('Tigernoma vous souhaite la bienvenue dans ComptaClient !');
});