/**
 * Created by Tchegito on 27/09/2015.
 */
function ParseContainer(cnt, e, p, styles) {
    var elements = [];
    var children = e.childNodes;
    if (children.length != 0) {
		// On duplique les styles pour que les enfants n'héritent pas des cousins (!)
		if (!styles) styles = [];
        for (var i = 0; i < children.length; i++) p = ParseElement(elements, children[i], p, styles.slice());
    }
    if (elements.length != 0) {
        for (var i = 0; i < elements.length; i++) cnt.push(elements[i]);
    }
    return p;
}

// Met à jour l'objet 'o' en fonction des styles données
function ComputeStyle(o, styles) {
    for (var i = 0; i < styles.length; i++) {
        var st = styles[i].trim().toLowerCase().split(":");
        if (st.length == 2) {
            switch (st[0]) {
                case "font-size":{
                    o.fontSize = parseInt(st[1]);
                    break;
                }
                case "text-align": {
                    switch (st[1]) {
                        case "right": o.alignment = 'right'; break;
                        case "center": o.alignment = 'center'; break;
                    }
                    break;
                }
                case "font-weight": {
                    switch (st[1]) {
                        case "bold": o.bold = true; break;
                    }
                    break;
                }
                case "text-decoration": {
                    switch (st[1]) {
                        case "underline": o.decoration = "underline"; break;
                    }
                    break;
                }
                case "white-space": {

                    if (st[1] == "pre-wrap") {
                        console.log("white space");
                        o.pre = true;
                    }
                    break;
                }
                case "font-style": {
                    switch (st[1]) {
                        case "italic": o.italics = true; break;
                    }
                    break;
                }
                case "width": {
                    o.width = st[1];
                    break;
                }
            }
        }
    }
}

function ParseElement(cnt, e, p, styles) {
    if (!styles) styles = [];
    if (e.getAttribute) {
        var nodeStyle = e.getAttribute("style");
        if (nodeStyle) {
            var ns = nodeStyle.split(";");
            for (var k = 0; k < ns.length; k++) styles.push(ns[k]);
        }
    }

	// On duplique les styles pour que les balises suivantes n'héritent pas des filles
	styles = styles.slice();

    switch (e.nodeName.toLowerCase()) {
        case "#text": {
            var t = { text: e.textContent /*.replace(/\n/g, "")*/ };
            if (styles && styles != '') {
                ComputeStyle(t, styles);
            }
            if (!t.pre) {
                t.text = t.text.replace(/\n/g, "");
            }
            if (p.text) {
                p.text.push(t);
            }
            break;
        }
        case "b":case "strong": {
        //styles.push("font-weight:bold");
        ParseContainer(cnt, e, p, styles.concat(["font-weight:bold"]));
        break;
    }
        case "u": {
            //styles.push("text-decoration:underline");
            ParseContainer(cnt, e, p, styles.concat(["text-decoration:underline"]));
            break;
        }
        case "i": {
            styles.push("font-style:italic");
            ParseContainer(cnt, e, p, styles.concat(["font-style:italic"]));
            //styles.pop();
            break;
            //cnt.push({ text: e.innerText, bold: false });
        }
        case "span": {
            ParseContainer(cnt, e, p, styles);
            break;
        }
        case "br": {
            p = {text:['\n']};
            cnt.push(p);
            break;
        }
        case "img": {
			// Do an ajax query to retrieve BASE64 encoded image
			// TODO: move this (quickly) to another section, because that's a shame to do this each time
			// we need to export PDF. But that's part of a POC, so it's ok for now.
            var url = e.getAttribute("src");
            var query = "http://tigernoma.fr/encode64.php?imageUrl="+url;
            $.ajax({
                url: query,
                async:false,
                success: function (data) {
                    p = {image:data, width:50};
                    cnt.push(p);
                }
            });
            break;
        }
        case "table":
        {
            var t = {
                table: {
                    widths: [],
                    body: []
                }
            }
            var border = e.getAttribute("border");
            var isBorder = (border && parseInt(border) == 1);
            if (!isBorder) t.layout = 'noBorders';
            ParseContainer(t.table.body, e, p, styles);

            var widths = e.getAttribute("widths");
            if (!widths) {
                if (t.table.body.length != 0) {
                    if (t.table.body[0].length != 0) for (var k = 0; k < t.table.body[0].length; k++) t.table.widths.push("*");
                }
            } else {
                var w = widths.split(",");
                for (var k = 0; k < w.length; k++) t.table.widths.push(w[k]);
            }
            cnt.push(t);
            break;
        }

        case "thead": {
            ParseContainer(cnt, e, p, styles);
            break;
        }
        case "tbody": {
            ParseContainer(cnt, e, p, styles);
            //p = CreateParagraph();
            break;
        }
        case "tr": {
            var row = [];
            ParseContainer(row, e, p, styles);
            cnt.push(row);
            break;
        }
        case "td": case "th": {
            p = CreateParagraph();
            var st = {stack: []}
            st.stack.push(p);

            var rspan = e.getAttribute("rowspan");
            if (rspan) st.rowSpan = parseInt(rspan);
            var cspan = e.getAttribute("colspan");
            if (cspan) st.colSpan = parseInt(cspan);

            ParseContainer(st.stack, e, p, styles);
            cnt.push(st);
            break;
        }
        case "div":case "p": {
        p = CreateParagraph();
        var st = {stack: []}
        st.stack.push(p);
		if (styles && styles != '') {
			ComputeStyle(st, styles);
		}
        if (st.pre) {
            console.log("on le tient !");
            st.stack.pre = st.pre;
        }
        ParseContainer(st.stack, e, p, styles);

        cnt.push(st);
        break;
    }
        default: {
            console.log("Parsing for node " + e.nodeName + " not found");
            break;
        }
    }
    return p;
}

function ParseHtml(cnt, htmlText) {
    var html = $(htmlText.replace(/\t/g, "")); //.replace(/\n/g, ""));
    var p = CreateParagraph();
    for (var i = 0; i < html.length; i++) ParseElement(cnt, html.get(i), p);
}

function CreateParagraph() {
    var p = {text:[]};
    return p;
}