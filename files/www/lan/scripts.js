/* New Ones */

function initialShow() {
	var mysection = 'home';
	if (location.hash != '') {
		mysection = location.hash.replace(/^(#section_)/,"");;
	}
	section_toggle(mysection);
	setTitle();
	hide(document.querySelector('#msg'));
}

function section_toggle(section_selector) {
	hide(document.querySelector('pre#msg'));
	const allSections = document.querySelectorAll('main section');
	for (let i = 0; i < allSections.length; i++) {
		hide(allSections[i]);
	}

	show(document.querySelector('section#' + section_selector));

	switch (section_selector) {
		case 'home':
			init_home();
			break;
		case 'network':
			init_network();
			break;
		case 'wifiscanner':
			init_wifiscan();
			break;
		case 'settings':
			init_settings();
			break;
			/*
		case 'upgrade':
			break;
			*/
		case 'password':
			init_password();
			break;
	}
	window.scrollTo({
		top: 0,
	});
}

/* imported from shared.js */
function $(id) {
	return document.querySelector(id);
}

function show(e) {
	if (e.style === 'undefined' || e.style.display === 'undefined') {
		e.setAttribute("style", "display: block;");
	} else {
		e.style.display = 'block';
	}
}

function hide(e) {
	if (e.style === 'undefined' || e.style.display === 'undefined') {
		e.setAttribute("style", "display: none;");
	} else {
		e.style.display = 'none';
	}
}

function addClass(e, c) {
	e.classList.add(c);
}

function removeClass(e, c) {
	e.classList.remove(c);
}

function setText(id, txt) {
	$('#' + id).innerHTML = txt;
	if(id === 'msg' && txt !=='')
	{
		show($('#msg'));
	}
}

function inArray(item, array) {
	return array.indexOf(item) !== -1;
}

function split(str) {
	if (typeof str !== 'string') {
		return [];
	}
	var a = str.match(/[^\s]+/g);
	return (a ? a : []);
}

function uniq(arr) {
	var obj = {};
	for (let i in arr) obj[arr[i]] = 0;
	return Object.keys(obj);
}

//remove an item from a string list
function removeItem(str, item) {
	var array = split(str);
	for (let i in array) {
		if (array[i] === item) {
			array.splice(i, 1);
		}
	}
	return array.join(' ');
}

function addItem(str, item) {
	var array = split(str);
	for (let i in array) {
		if (array[i] === item) {
			return str;
		}
	}
	array.push(item);
	return array.sort().join(' ');
}

function replaceItem(str, old_item, new_item) {
	var array = split(str);
	for (let i in array) {
		if (array[i] === old_item) {
			array[i] = new_item;
		}
	}
	return array.join(' ');
}

function addHelpText(elem, text) {
	var help = $("#help");

	if (help) {
		elem.onmouseover = function (e) {
			help.style.top = (e.clientY - 20) + "px";
			help.style.left = (e.clientX + 80) + "px";
			help.innerHTML = text;
			show(help);
		};

		elem.onmouseout = function () {
			help.innerHTML = "";
			hide(help);
		};
	}
}

//to config file syntax
function toUCI(pkg_obj) {
	var str = "\n";
	for (let sid in pkg_obj) {
		if (sid === "pchanged") {
			continue;
		}

		var options = pkg_obj[sid];
		var sname = (sid.substring(0, 3) !== "cfg") ? (" '" + sid + "'") : "";
		str += "config " + options.stype + sname + "\n";
		for (let oname in options) {
			if (oname === "stype") {
				continue;
			}
			var value = options[oname];
			if (typeof value === 'object') {
				for (let i in value)
					str += "	list " + oname + " '" + value[i] + "'\n";
			} else
				str += "	option " + oname + " '" + value + "'\n";
		}
		str += "\n";
	}
	return str;
}

// parses output from one or multiple
// calls like "uci -qn export foo"
function fromUCI(pkgs_str) {
	var pkg_objs = {};
	var pkg;
	var cfg;

	var lines = pkgs_str.split("\n");
	for (let i = 0; i < lines.length; ++i) {
		var line = lines[i];
		var items = split(line);

		if (items.length < 2) {
			continue;
		}

		switch (items[0]) {
			case 'package':
				pkg = {
					pchanged: false
				};
				pkg_objs[items[1]] = pkg;
				break;
			case 'config':
				var val = (items.length === 3) ? line.match(/'(.*)'/)[1] : ("cfg" + (++gid));
				cfg = {
					stype: items[1]
				};
				pkg[val] = cfg;
				break;
			case 'option':
				var val = line.match(/'(.*)'/)[1];
				cfg[items[1]] = val;
				break;
			case 'list':
				var val = line.match(/'(.*)'/)[1];
				if (!(items[1] in cfg)) cfg[items[1]] = [];
				cfg[items[1]].push(val);
				break;
		}
	}
	return pkg_objs;
}

function firstSectionID(obj, stype) {
	for (let id in obj) {
		if (obj[id].stype === stype) {
			return id;
		}
	}
}

function config_foreach(objs, stype, func) {
	for (let key in objs) {
		var obj = objs[key];
		if ((obj["stype"] === stype || stype === "*") && func(key, obj)) {
			return true;
		}
	}
	return false;
}

function config_find(objs, mobj) {
	for (let key in objs) {
		var obj = objs[key];
		var found = true;
		for (mkey in mobj) {
			if (obj[mkey] !== mobj[mkey]) {
				found = false;
				break;
			}
		}
		if (found)
			return obj;
	}
	return null;
}

function params(obj) {
	var str = "";
	for (let key in obj) {
		if (str.length) str += "&";
		else str += "?";
		str += encodeURIComponent(key) + "=" + encodeURIComponent(obj[key]);
	}
	return str.replace(/%20/g, "+");
}

function send(url, obj, func) {
	url += params(obj);
	jx.load(url, func, 'text');
}

function onDesc(e, tag, func) {
	for (let i = 0; i < e.childNodes.length; ++i) {
		var c = e.childNodes[i];
		if (c.tagName === tag && func(c) === false) return;
		onDesc(c, tag, func);
	}
}

function onChilds(e, tag, func) {
	for (let i = 0; i < e.childNodes.length; ++i) {
		var c = e.childNodes[i];
		if (c.tagName === tag && func(c) === false) return;
	}
}

function onParents(e, tag, func) {
	while (e !== document) {
		e = e.parentNode;
		if (e.tagName === tag && func(e) === false) return;
	}
}

function removeChilds(p) {
	while (p.hasChildNodes())
		p.removeChild(p.firstChild);
}

function show_error(data) {
	var is_error = (data.includes("Fehler") || data.includes("Error"));
	if (is_error)
		setText('msg', data);
	return is_error;
}

function checkName(name) {
	if (/[\w_]{2,12}/.test(name))
		return true;
	alert("Name '" + name + "' ist ung\xfcltig.");
	return false;
}

//prepend input check
function addInputCheck(input, regex, msg) {
	var prev_value = input.value;
	var prev_onchange = input.onchange;
	input.onchange = function (e) {
		if (regex.test(input.value)) {
			if (prev_onchange)
				prev_onchange(e);
			return;
		}
		alert(msg);
		input.value = prev_value;
		e.stopPropagation();
	};
}

function collect_inputs(p, obj) {
	if (p.tagName === "SELECT")
		obj[p.name] = p.value;
	if (p.tagName === "INPUT")
		if (p.type === "text" || p.type === "password" || (p.type === "radio" && p.checked))
			obj[p.name] = p.value
		else if (p.type === "checkbox" && p.checked) {
			var v = obj[p.name];
			v = (typeof v === "undefined") ? (p.data || p.value) : (v + " " + (p.data || p.value));
			obj[p.name] = v;
		}

	for (let i = 0; i < p.childNodes.length; ++i)
		collect_inputs(p.childNodes[i], obj);
}

function append(parent, tag, id) {
	var e = document.createElement(tag);
	if (id) e.id = id;
	parent.appendChild(e);
	return e;
}

function append_section(parent, title, id) {
	var fs = append(parent, "fieldset");
	var lg = append(fs, "legend");
	lg.innerHTML = title;
	if (id) fs.id = id;
	return fs;
}

function append_button(parent, text, onclick) {
	var button = append(parent, 'button');
	button.type = 'button';
	button.innerHTML = text;
	button.onclick = onclick;
	return button;
}

function append_label(parent, title, value) {
	var div = append(parent, 'div');
	append(div, 'label').innerHTML = title + ":";
	append(div, 'span').innerHTML = value;
	return div;
}

/*
 <select><option></option>... </select>
*/
function append_options(parent, name, selected, choices) {
	var select = append(parent, 'select');
	select.style.minWidth = "5em";
	select.name = name;
	for (let i in choices) {
		var s = (typeof choices[i] !== 'object');
		var choice_text = " " + (s ? choices[i] : choices[i][0]);
		var choice_value = "" + (s ? choices[i] : choices[i][1]);

		var option = append(select, 'option');
		option.value = choice_value;
		option.selected = (choice_value === selected) ? "selected" : "";
		option.innerHTML = choice_text;
	}
	return select;
}

function append_selection(parent, title, name, selected, choices) {
	var p = append(parent, 'div');
	var label = append(p, 'label');

	p.className = "select_option";
	label.innerHTML = title + ":";

	append_options(p, name, selected, choices);
	return p;
}

// Append an input field.
// E.g. append_input(parent, "Name", "name_string", "MyName")
function append_input(parent, title, name, value) {
	var div = append(parent, 'div');
	var label = append(div, 'label');
	var input = append(div, 'input');

	label.innerHTML = title + ":";
	input.value = (typeof value === "undefined") ? "" : value;
	input.name = name;
	input.type = "text";

	return div;
}

// Append a radio field.
// E.g. append_radio(parent, "Enabled", "enabled", 0, [["Yes", 1], ["No", 0])
function append_radio(parent, title, name, selected, choices) {
	return _selection("radio", parent, title, name, [selected], choices);
}

// Append a checkbox field.
// E.g. append_check(parent, "Enabled", "enabled", ["grass"], [["Grass", "grass"], ["Butter", "butter"]])
function append_check(parent, title, name, selected, choices) {
	return _selection("checkbox", parent, title, name, selected, choices);
}

function _selection(type, parent, title, name, selected, choices) {
	var p = append(parent, 'div');
	var label = append(p, 'label');
	var span = append(p, 'span');

	p.className = "radio_option";
	label.innerHTML = title + ":";

	for (let i in choices) {
		var s = (typeof choices[i] === 'string');
		var choice_text = "" + (s ? choices[i] : choices[i][0]);
		var choice_value = "" + (s ? choices[i] : choices[i][1]);
		var choice_help = s ? undefined : choices[i][2];

		var div = append(span, 'div');
		var input = append(div, 'input');
		var label = append(div, 'label');

		input.name = name;
		input.value = choice_value;
		input.data = choice_value; //for IE :-(
		input.type = type;

		if (inArray(choice_value, selected)) {
			input.checked = "checked"
		}

		label.innerHTML = " " + choice_text;

		if (choice_text === "_") {
			hide(div);
		}

		if (choice_help) {
			addHelpText(label, choice_help);
		}
	}
	return p;
}

//from jx_compressed.js
jx = {
	getHTTPObject: function () {
		var A = false;
		if (typeof ActiveXObject !== "undefined") {
			try {
				A = new ActiveXObject("Msxml2.XMLHTTP")
			} catch (C) {
				try {
					A = new ActiveXObject("Microsoft.XMLHTTP")
				} catch (B) {
					A = false
				}
			}
		} else {
			if (window.XMLHttpRequest) {
				try {
					A = new XMLHttpRequest()
				} catch (C) {
					A = false
				}
			}
		}
		return A
	},
	load: function (url, callback, format) {
		var http = this.init();
		if (!http || !url) {
			return
		}
		if (http.overrideMimeType) {
			http.overrideMimeType("text/xml")
		}
		if (!format) {
			var format = "text"
		}
		format = format.toLowerCase();
		var now = "uid=" + new Date().getTime();
		url += (url.indexOf("?") + 1) ? "&" : "?";
		url += now;
		http.open("GET", url, true);
		http.onreadystatechange = function() {
			if (http.readyState === 4) {
				if (http.status === 200) {
					var result = "";
					if (http.responseText) {
						result = http.responseText
					}
					if (format.charAt(0) === "j") {
						result = result.replace(/[\n\r]/g, "");
						result = eval("(" + result + ")")
					}
					if (callback) {
						callback(result)
					}
				} else {
					if (typeof error !== 'undefined' && error) {
						error(http.status)
					}
				}
			}
		};
		http.send(null)
	},
	init: function () {
		return this.getHTTPObject()
	}
}

/* impoted from index.js */
var html_cache = {};
var js_cache = {};
var adv_mode = false;

function adv_apply() {
	var inputs = document.getElementsByClassName('adv_disable');
	var elems = document.getElementsByClassName('adv_hide');

	for (let i = 0; i < inputs.length; i++)
		inputs[i].disabled = adv_mode ? "" : "disabled";
	for (let i = 0; i < elems.length; i++)
		elems[i].style.display = adv_mode ? "block" : "none";
}

function adv_toggle(e) {
	adv_mode = !adv_mode;
	e.innerHTML = adv_mode ? "Erweitert: An" : "Erweitert: Aus";
	adv_apply();
}

function nav_onclick() {
	setText('msg', "");
	var url = this.getAttribute("href");
	if (url === '#') return false;

	var id = url.substring(0, url.lastIndexOf('.'));

	var process_html = function (data) {
		var b = $("body");
		removeChilds(b);
		var pattern = /<body[^>]*>((.|[\n\r])*)<\/body>/im;
		b.innerHTML = pattern.exec(data)[1];
		html_cache[id] = data;
	};

	var process_js = function (data) {
		(window.execScript || function (data) {
			window["eval"].call(window, data);
			window["eval"].call(window, "init();");
		})(data);
		js_cache[id] = data;
	};

	//load html file
	if (id in html_cache) {
		process_html(html_cache[id]);
	} else {
		jx.load(url, process_html, 'text');
	}

	//load javascript file
	if (id in js_cache) {
		process_js(js_cache[id]);
	} else {
		jx.load(url.replace(".html", ".js"), process_js, 'text');
	}

	onDesc($("#globalnav"), 'UL', function (n) {
		hide(n);
	});
	onParents(this, 'UL', function (n) {
		show(n);
	});
	onChilds(this.parentNode, 'UL', function (n) {
		show(n);
	});

	onDesc($("#globalnav"), 'A', function (n) {
		removeClass(n, "here");
	});
	onParents(this, 'LI', function (n) {
		addClass(n.firstChild, "here");
	});

	return false;
}

function preselect() {
	onDesc($("#globalnav"), 'UL', function (n) {
		hide(n);
	});
	onDesc($("#globalnav"), 'A', function (n) {
		if (n.getAttribute("href") !== '#')
			n.onclick = nav_onclick;
	});
}

function reboot() {
	if (!confirm("Neustart durchf\xFChren?")) return;
	send("/cgi-bin/misc", {
		func: "reboot"
	}, function (data) {
		setText('msg', data);
	});
}

function setTitle() {
	send("/cgi-bin/misc", {
		func: "name"
	}, function (name) {
		if (name.length) {
			$("title").textContent += " - " + name;
		}
	});
}

function logout() {
	window.location = "https://none@" + window.location.host;
}

/* imported from home.js */

function formatSize(bytes) {
	if (typeof bytes === "undefined" || bytes === "") {
		return "-";
	} else if (bytes < 1000) {
		return bytes + "  B";
	} else if (bytes < 1000 * 1000) {
		return (bytes / 1000.0).toFixed(0) + " K";
	} else if (bytes < 1000 * 1000 * 1000) {
		return (bytes / 1000.0 / 1000.0).toFixed(1) + " M";
	} else {
		return (bytes / 1000.0 / 1000.0 / 1000.0).toFixed(2) + " G";
	}
}

function formatSpeed(bytes) {
	var fmt = formatSize(bytes);
	return (fmt === "-") ? "-" : (fmt + "/s");
}

function init_home() {
	send("/cgi-bin/home", {}, function(data) {
		var obj = fromUCI(data).misc.data;
		for (let key in obj) {
			var value = obj[key];

			if (key === 'stype') {
				continue;
			}

			// for data volume
			if (key.endsWith("_data")) {
				value = formatSize(value);
			}

			// for transfer speed
			if (key.endsWith("_speed")) {
				value = formatSpeed(value);
			}

			//for addresses
			if (typeof(value) === 'object') {
				value = "<ul><li>" + value.join("</li><li>") + "</li></ul>"
			}

			setText(key, value);
		}
	});

	addHelpText($("#system"), "Eine \xdcbersicht \xfcber den Router.");
	addHelpText($("#freifunk"), "Das \xf6ffentliche Freifunknetz..");
	addHelpText($("#lan"), "Das private Netz bzw. LAN.");
	addHelpText($("#wan"), "Das Netz \xfcber dass das Internet erreicht wird.");
	addHelpText($("#software"), "Einige installierte Softwareversionen.");
	addHelpText($("#freifunk_user_count"), "Die Anzahl der Nutzer an diesem Router in den letzten zwei Stunden.");
	addHelpText($("#lan_user_count"), "Die Anzahl der Nutzer an diesem Router in den letzten zwei Stunden.");
	addHelpText($("#vpn_server"), "Der VPN-Server im Internet, mit dem der Knoten verbunden ist.");
}

/* imported from settings.js */
/*
All required uci packages are stored variable uci.
The GUI code displayes and manipulated this variable.
*/
var uci = {};
var gid = 0;


function init_settings() {
	send("/cgi-bin/settings", {
		func: "get_settings"
	}, function(data) {
		uci = fromUCI(data);
		rebuild_general();
		adv_apply();
	});
}

function appendSetting(p, path, value, mode) {
	var id = path.join('#');
	var b;
	var cfg = path[0]
	var name = path[path.length - 1];
	switch (name) {
		case "latitude":
			b = append_input(p, "Breitengrad", id, value);
			b.lastChild.placeholder = "52.xxx";
			addInputCheck(b.lastChild, /^$|^[1-9]\d{0,2}\.\d{1,8}$/, "Ung\xfcltige Eingabe. Bitte nur maximal 8 Nachkommastellen, keine Kommas und f\xfchrende Nullen verwenden.");
			addHelpText(b, "Der Breitengrad (als Dezimalzahl) dieses Knotens auf der Freifunk-Karte.");
			break;
		case "longitude":
			b = append_input(p, "L\xe4ngengrad", id, value);
			b.lastChild.placeholder = "8.xxx";
			addInputCheck(b.lastChild, /^$|^[1-9]\d{0,2}\.\d{1,8}$/, "Ung\xfcltige Eingabe. Bitte nur maximal 8 Nachkommastellen, keine Kommas und f\xfchrende Nullen verwenden.");
			addHelpText(b, "Der L\xe4ngengrad (als Dezimalzahl) dieses Knotens auf der Freifunk-Karte.");
			break;
		case "name":
			b = append_input(p, "Knotenname", id, value);
			b.lastChild.placeholder = "MeinFreifunkRouter";
			addInputCheck(b.lastChild, /^$|^[\-\^'\w\.\:\[\]\(\)\/ &@\+\u0080-\u00FF]{0,32}$/, "Ung\xfcltige Eingabe.");
			addHelpText(b, "Der Name dieses Knotens auf der Freifunk-Karte.");
			break;
		case "contact":
			b = append_input(p, "Kontaktdaten", id, value);
			b.lastChild.placeholder = "kontakt@example.com";
			addInputCheck(b.lastChild, /^$|^[\-\^'\w\.\:\[\]\(\)\/ &@\+\u0080-\u00FF]{0,50}$/, "Ung\xfcltige Eingabe.");
			addHelpText(b, "Kontaktdaten f\xfcr die \xf6ffentliche Freifunk-Karte und Statusseite. Falls ihr euch von anderen Leuten kontaktieren lassen wollt (z.B. \"info@example.com\").");
			break;
		case "community_url":
			b = append_input(p, "Community-Webseite", id, value);
			b.lastChild.placeholder = "http://muster.de";
			addClass(b, "adv_hide");
			addInputCheck(b.lastChild, /^$|^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)$/, "Ung\xfcltige URL.");
			addHelpText(b, "Webseite der Community, zu der dieser Knoten geh\xf6rt.");
			break;
		case "enabled":
			if (cfg === "autoupdater") {
				b = append_radio(p, "Autoupdater", id, value, [
					["An", "1"],
					["Aus", "0"]
				]);
				addHelpText(b, "Der Auto-Updater aktualisiert die Firmware automatisch auf die neuste Version. Dabei bleibt die Konfiguration, die \xfcber die Weboberfl\xe4che gemacht wurde, erhalten. Spezifische Anpassungen \xfcber SSH k\xf9nnten eventuell \xfcberschrieben werden!");
			}
			if (cfg === "simple-tc") {
				b = append_radio(p, "Bandbreitenkontrolle", id, value, [
					["An", "1"],
					["Aus", "0"]
				]);
				addHelpText(b, "Bandbreitenkontrolle f\xfcr den Upload-/Download \xfcber das Freifunknetz \xfcber den eigenen Internetanschluss.");
			}
			if (cfg === "fastd") {
				b = append_radio(p, "Fastd VPN", id, value, [
					["An", "1"],
					["Aus", "0"]
				]);
				addHelpText(b, "Eine VPN-Verbindung zum Server \xfcber deinen Internetanschluss (WAN-Anschluss im Freifunk Router) aufbauen (per FastD).");
				addClass(b, "adv_hide");
			}
			break;
		case "ipv6_only":
			b = append_radio(p, "IP Protokoll VPN", id, value, [
				["Dual Stack", "both"],
				["IPv6", "ipv6"],
				["IPv4 (legacy)", "legacy"]
			]);
			addHelpText(b, "Welche Version des IP-Protokolls soll f\xfcr den Verbindungsaufbau zum Gateway verwendet werden? (Dual Stack (empfohlen): Alle verfügbaren, IPv6: Nur IPv6 verwenden, IPv4: Nur IPv4 verwenden!)");
			addClass(b, "adv_hide");
			break;
		case "publish_map":
			b = append_radio(p, "Zur Karte beitragen", id, value, [
				["Nichts", "none"],
				["Wenig", "basic"],
				["Mehr", "more"],
				["Alles", "all"]
			]);
			addHelpText(b, "Mit wievielen Daten soll dieser Knoten zur Knotenkarte beitragen? (Wenig: Name/Version/Modell/Position/Kontakt, Mehr: +Uptime/+CPU-Auslastung, Alles: +Speicherauslastung/+IP-Adressen des Routers im Freifunk-Netz)");
			break;
		case "limit_egress":
			b = append_input(p, "Freifunk Upload", id, value);
			addInputCheck(b.lastChild, /^\d+$/, "Upload ist ung\xfcltig.");
			addHelpText(b, "Maximaler Upload in KBit/s f\xfcr die Bandbreitenkontrolle.");
			break;
		case "limit_ingress":
			b = append_input(p, "Freifunk Download", id, value);
			addInputCheck(b.lastChild, /^\d+$/, "Download ist ung\xfcltig.");
			addHelpText(b, "Maximaler Download in KBit/s f\xfcr die Bandbreitenkontrolle.");
			break;
		case "allow_access_from":
			b = append_check(p, "SSH/HTTPS Zugriff", id, split(value), [
				["WAN", "wan"],
				["LAN", "lan"],
				["Freifunk", "freifunk"]
			]);
			addHelpText(b, "Zugang zur Konfiguration \xfcber verschiedene Anschl\xfcsse/Netzwerke erm\xf6glichen.")
			break;
		case "service_link":
			var ula_prefix = uci['network']['globals']['ula_prefix'];
			var addr_prefix = ula_prefix.replace(/:\/[0-9]+$/, ""); //cut off ':/64'
			var regexp = new RegExp("^$|((?=.*" + addr_prefix + "|.*\.ff[a-z]{0,3})(?=^.{0,128}$))");

			b = append_input(p, "Service Link", id, value);
			b.lastChild.placeholder = "http://[" + addr_prefix + ":1]/index.html";
			addInputCheck(b.lastChild, regexp, "Ung\xfcltige Eingabe.");
			addHelpText(b, "Ein Verweis auf eine _interne_ Netzwerkresource. Z.B. \"http://[" + addr_prefix + ":1]/index.html\".");
			break;
		case "service_label":
			b = append_input(p, "Service Name", id, value);
			b.lastChild.placeholder = "MeineWebseite";
			addInputCheck(b.lastChild, /^$|^[\[\]\(\) \w&\/.:\u0080-\u00FF]{0,32}$/, "Ung\xfcltige Eingabe.");
			addHelpText(b, "Ein Name der angegebenen Netzwerkresource. Z.B. \"Meine Webseite\".");
			break;
		case "service_display_max":
			b = append_input(p, "Max.-Eintr\xe4ge", id, value);
			addInputCheck(b.lastChild, /^\d+$/, "Ung\xfcltige Zahl.");
			addHelpText(b, "Maximale Anzahl der auf der eigenen Statusseite angezeigten Eintr\xe4ge.");
			break;
		case "community":
			b = append_input(p, "Community", id, value);
			addClass(b, "adv_hide");
			addInputCheck(b.lastChild, /^[a-z0-9_\-]{3,30}$/, "Ung\xfcltiger Bezeichner.");
			addHelpText(b, "Der Bezeichner der Community, zu der dieser Knoten geh\xf6rt.");
			break;
		default:
			return;
	}

	b.id = id; //needed for updateFrom
	b.onchange = function () {
		updateFrom(b);
	};

	return b;
}

function rebuild_general() {
	var gfs = $("#general");
	var rfs = $("#resource");
	var tfs = $("#traffic");

	removeChilds(gfs);
	removeChilds(rfs);
	removeChilds(tfs);

	if ('freifunk' in uci) {
		var f = uci.freifunk;
		var i = firstSectionID(f, "settings");
		appendSetting(gfs, ['freifunk', i, "name"], f[i]["name"]);
		appendSetting(gfs, ['freifunk', i, "latitude"], f[i]["latitude"]);
		appendSetting(gfs, ['freifunk', i, "longitude"], f[i]["longitude"]);
		appendSetting(gfs, ['freifunk', i, "contact"], f[i]["contact"]);
		appendSetting(rfs, ['freifunk', i, "community_url"], f[i]["community_url"]);
		appendSetting(rfs, ['freifunk', i, "community"], f[i]["community"]);
		appendSetting(gfs, ['freifunk', i, "ipv6_only"], f[i]["ipv6_only"]);
		appendSetting(gfs, ['freifunk', i, "publish_map"], f[i]["publish_map"]);
		appendSetting(gfs, ['freifunk', i, "allow_access_from"], f[i]["allow_access_from"]);
		appendSetting(rfs, ['freifunk', i, "service_label"], f[i]["service_label"]);
		appendSetting(rfs, ['freifunk', i, "service_link"], f[i]["service_link"]);
		appendSetting(rfs, ['freifunk', i, "service_display_max"], f[i]["service_display_max"]);
	}

	if ('autoupdater' in uci) {
		var a = uci.autoupdater;
		var i = firstSectionID(a, "autoupdater");
		appendSetting(gfs, ['autoupdater', i, "enabled"], a[i]["enabled"]);
	}

	if ('simple-tc' in uci) {
		var t = uci['simple-tc'];
		var i = firstSectionID(t, "interface");
		appendSetting(tfs, ['simple-tc', i, "enabled"], t[i]["enabled"]);
		appendSetting(tfs, ['simple-tc', i, "limit_ingress"], t[i]["limit_ingress"]);
		appendSetting(tfs, ['simple-tc', i, "limit_egress"], t[i]["limit_egress"]);
	}

	if ('fastd' in uci) {
		var a = uci.fastd;
		var i = firstSectionID(a, "fastd");
		appendSetting(gfs, ['fastd', i, "enabled"], a[i]["enabled"]);
	}
}

function save_data_settings() {
	for (let name in uci) {
		var obj = uci[name];
		if (!obj.pchanged)
			continue;
		var data = toUCI(obj);
		send("/cgi-bin/misc", {
				func: "set_config_file",
				name: name,
				data: data
			},
			function (data) {
				$('msg').innerHTML = data;
				$('msg').focus();
				init();
			}
		);
	}
}

/* imported from network.js */

/*
 * All required uci packages are stored variable uci.
 * The GUI code displayes and manipulated this variable.
 */
var uci = {};
var wifi_status = {};

var gid = 0;
var net_options = [
	["LAN", "lan"],
	["Freifunk", "freifunk"],
	["Mesh", "mesh"],
	["WAN", "wan"],
	["None", "none"],
	["ExtraSSID", "extrassid"]
];
var txpower_choices = [
	["20 dBm (100 mW)", "20"],
	["19 dBm (79 mW)", "19"],
	["18 dBm (63 mW)", "18"],
	["17 dBm (50 mW)", "17"],
	["16 dBm (39 mW)", "16"],
	["15 dBm (31 mW)", "15"],
	["14 dBm (25 mW)", "14"],
	["13 dBm (19 mW)", "13"],
	["12 dBm (15 mW)", "12"],
	["11 dBm (12 mW)", "11"],
	["10 dBm (10 mW)", "10"],
	["9 dBm (7 mW)", "9"],
	["8 dBm (6 mW)", "8"],
	["6 dBm (5 mW)", "6"],
	["5 dBm (3 mW)", "5"],
	["4 dBm (2 mW)", "4"],
	["0 dBm (1 mW)", "0"],
	["auto", "auto"]
];

function init_network() {
	send("/cgi-bin/misc", {
		func: "wifi_status"
	}, function(data) {
		wifi_status = JSON.parse(data);
		send("/cgi-bin/network", {
			func: "get_settings"
		}, function(data) {
			uci = fromUCI(data);
			rebuild_other();
			rebuild_assignment();
			rebuild_wifi();
			rebuild_switches();
			adv_apply();
		});
	});
}

function updateFrom(src) {
	var obj = {};
	collect_inputs(src, obj);
	for (let name in obj) {
		var value = obj[name];
		var path = name.split('#');

		var pkg = path[0];
		var sec = path[1];
		var opt = path[2];

		uci[pkg].pchanged = true;
		uci[pkg][sec][opt] = value
	}
}

function getChangeModeAction(ifname) {
	return function (e) {
		var src = (e.target || e.srcElement);
		var mode = (src.data || src.value);
		delNetSection(ifname);
		addNetSection(ifname, mode);
	};
}

function appendNetworkSetting(p, path, value, mode) {
	var id = path.join('#');
	var b;
	var cfg = path[0]
	var name = path[path.length - 1];
	switch (name) {
		case "country":
			b = append_input(p, "Land", id, value);
			addClass(b.lastChild, "adv_disable");
			break;
		case "channel":
			var channels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
			if (value > 35) channels = [36, 40, 44, 48, 52, 56, 60, 64, 100, 104, 108, 112, 116, 120, 124, 128, 132, 136, 140];
			b = append_selection(p, "Kanal", id, value, channels);
			addClass(b.lastChild, "adv_disable");
			addHelpText(b, "Der Kanal auf dem die WLAN-Karte sendet. Bitte denk daran, dass sich Router nicht sehen k\xf6nnen wenn beide Seiten auf unterschiedlichen Kan\xe4len funken. Der erste Kanal ist daher zu empfehlen.");
			break;
		case "txpower":
			value = value ? value : 'undefined';
			b = append_selection(p, "Sendeleistung", id, value, txpower_choices);
			addHelpText(b, "Die Sendeleistung in dBm. Strahlungsleistung = Sendeleistung - Kabeld\xe4mpfung + Antennengewinn.\nAndere Werte m\xfcssen manuell eingetragen werden. Achtung! Beim Tausch der Antennen muss die Sendeleistung entsprechend angepasst werden!");
			addClass(b, "adv_hide");
			break;
		case "mode":
			if (!inArray(mode, ["wan", "none"]))
				return;
			b = append_selection(p, "Modus", id, value, [
				["Client", "sta"],
				["AccessPoint", "ap"]
			]);
			addHelpText(b, "In einem anderen Netz anmelden (Client) oder das Anmelden anderer Ger\xe4te zulassen (AccessPoint).");
			break;
		case "encryption":
			if (!inArray(mode, ["wan", "lan", "none"]))
				return;
			b = append_selection(p, "Verschl\xfcsselung", id, value, [
				["Keine", "none"],
				["WPA", "psk"],
				["WPA2", "psk2"]
			]);
			break;
		case "key":
			if (!inArray(mode, ["wan", "lan", "none"]))
				return;
			b = append_input(p, "Passwort", id, value);
			addInputCheck(b.lastChild, /^[\S]{8,32}$/, "Bitte nur ein Passwort aus mindestens acht sichbaren Zeichen verwenden.");
			break;
		case "hwmode":
			if (value === "11g") {
				value = "802.11g (2.4 GHz)";
			} else if (value === "11a") {
				value = "802.11a (5 GHz)";
			} else {
				value = "802." + value;
			}
			b = append_label(p, "Modus", value);
			break;
		case "mesh_id":
			b = append_input(p, "Mesh ID", id, value);
			if (!inArray(mode, ["wan", "lan", "none"]))
				addClass(b.lastChild, "adv_disable");
			addInputCheck(b.lastChild, /^[^\x00-\x1F\x80-\x9F]{3,30}$/, "Mesh ID ist ung\xfcltig.");
			break;
		case "ssid":
			if (value === "Freifunk") {
				b = append_label(p, "SSID", "Freifunk");
			} else {

				b = append_input(p, "SSID", id, value);
			}
			if (!inArray(mode, ["wan", "lan", "none"]))
				addClass(b.lastChild);
			addInputCheck(b.lastChild, /^[^\x00-\x1F\x80-\x9F]{3,30}$/, "SSID ist ung\xfcltig.");
			break;
		/*
			case "macaddr":
				if (path[1] !== "freifunk") return;
				b = append_input(p, "MAC-Adresse", id, value);
				addInputCheck(b.lastChild,/^((([0-9a-f]{2}:){5}([0-9a-f]{2}))|)$/, "Ung\xfcltige MAC-Adresse.");
				addHelpText(b, "Die MAC-Adresse identifiziert den Knoten. Bei einem leeren Wert w\xe4hlt der Router selber einen aus.");
				break;
		*/
		case "mesh_on_wan":
			b = append_radio(p, "Mesh-On-WAN", id, value, [
				["Ja", "1"],
				["Nein", "0"]
			]);
			onDesc(b, "INPUT", function (e) {
				e.onclick = function (e) {
					var src = (e.target || e.srcElement);
					var val = (src.data || src.value);
					if (val !== value) {
						if (val === "1") {
							uci.network['wan_mesh'] = {
								stype: 'interface',
								ifname: '@wan',
								proto: 'batadv_hardif',
								master: 'bat0'
							};
						} else {
							delete uci.network['wan_mesh'];
						}
						uci.network.pchanged = true;
					}
				}
			});
			addHelpText(b, "Diese Funktion schickt die Mesh-Pakete auf das Netz am WAN-Anschluss. Bitte beachten, dass diese Broadcast-Pakete im WAN-Netz befindliche WLAN APs negativ beeinflusst.");
			break;
		case "disabled":
			b = append_radio(p, "Deaktiviert", id, value, [
				["Ja", "1"],
				["Nein", "0"]
			]);
			break;
		default:
			return;
	}

	b.id = id; // Needed for updateFrom.
	b.onchange = function () {
		updateFrom(b);
	};

	return b;
}

function getInterfaceMode(ifname) {
	var n = uci.network;

	if (inArray(ifname, split(n.freifunk.ifname)))
		return "freifunk";

	if (inArray(ifname, split(n.lan.ifname)))
		return "lan";

	if (inArray(ifname, split(n.wan.ifname)))
		return "wan";

	if (config_find(n, {
		'ifname': ifname,
		'proto': 'batadv_hardif'
	}))
		return "mesh";

	return "none";
}

function getWifiMode(id) {
	var obj = uci.wireless[id];

	if (obj.network === "freifunk") return "freifunk";
	if (obj.network === "lan") return "lan";
	if (obj.network === "wan") return "wan";
	if (obj.mode === "mesh") return "mesh";

	return "none";
}

function rebuild_other() {
	var root = $("#other");
	removeChilds(root);
	hide(root);

	var fs = append_section(root, "Sonstiges");

	if ('network' in uci) {
		var n = uci['network'];
		appendNetworkSetting(fs, ['network', 'freifunk', "macaddr"], n['freifunk']["macaddr"]);
	}

	if ('freifunk' in uci) {
		var f = uci.freifunk;
		var i = firstSectionID(f, "settings");
		appendNetworkSetting(fs, ['wireless', 'freifunk', "macaddr"], n['freifunk']["macaddr"]);
		appendNetworkSetting(fs, ['freifunk', i, "mesh_on_wan"], f[i]["mesh_on_wan"]);
	}

	addClass(root, "adv_hide");
}

function rebuild_assignment() {
	var root = $("#assignment");
	removeChilds(root);
	hide(root);

	var fs = append_section(root, "Anschl\xfcsse");
	addHelpText(fs, "Einzelne Anschl\xfcsse des Router die nicht als Teil des Switches oder WLANS zu identifizieren sind.");

	var ignore = ["local-node", "fastd_mesh", "bat0", "lo"];
	var ifnames = [];

	// remove dummy-interface
	switch (uci.misc.data.model) {
		case 'tp-link-tl-wr941n-nd-v1':
		case 'tp-link-tl-wr941n-nd-v2':
		case 'tp-link-tl-wr941n-nd-v3':
			ignore.push("eth0");
	}

	// Collect all interfaces.
	config_foreach(uci.network, "interface", function(sid, sobj) {
		if (sobj.ifname) ifnames = ifnames.concat(split(sobj.ifname));
	});

	// Ignore switch interfaces.
	config_foreach(uci.network, "switch", function(sid, sobj) {
		var swinfo = collect_switch_info(sobj.name);
		config_foreach(uci.network, "switch_vlan", function(vid, vobj) {
			ignore.push(getInterfaceName(vid, swinfo));
		});
	});

	// Ignore wlan interfaces.
	config_foreach(uci.wireless, "wifi-iface", function(sid, sobj) {
		if (sobj.ifname) ignore.push(sobj.ifname);
	});

	ifnames = uniq(ifnames);
	ifnames.sort();
	for (let i in ifnames) {
		var ifname = ifnames[i];
		if ((ifname.length === 0) || inArray(ifname, ignore) || ifname[0] === "@") {
			continue;
		}
		var mode = getInterfaceMode(ifname);
		var entry = append_selection(fs, ifname, "set_mode_" + ifname, mode, net_options);
		entry.onchange = getChangeModeAction(ifname);
		show(root);
	}
}

function collect_wifi_info(device) {
	var modes = [];
	config_foreach(uci.wireless, "wifi-iface", function (id, obj) {
		if (device === obj.device)
			modes.push(getWifiMode(id));
	});
	return {
		"modes": modes
	};
}

function modeName(mode) {
	for (let i in net_options) {
		if (net_options[i][1] === mode) {
			return net_options[i][0];
		}
	}
	return mode;
}

function addNetSection(ifname, mode) {
	var n = uci.network;

	switch (mode) {
		case "wan":
			n.wan.ifname = addItem(n.wan.ifname, ifname);
			break;
		case "lan":
			n.lan.ifname = addItem(n.lan.ifname, ifname);
			break;
		case "freifunk":
			n.freifunk.ifname = addItem(n.freifunk.ifname, ifname);
			break;
		case "mesh":
			var net = ifname.replace(".", "_");
			n[net] = {
				stype: 'interface',
				ifname: ifname,
				mtu: '1406',
				proto: 'batadv_hardif',
				master: 'bat0'
			};
			break;
		case "none":
			var net = ifname.replace(".", "_");
			n[net] = {
				"stype": "interface",
				"ifname": ifname,
				"proto": "none"
			};
			break;
		default:
			return;
	}

	n.pchanged = true;
}

function delNetSection(ifname) {
	var n = uci.network;

	config_foreach(n, "interface", function (id, obj) {
		if (obj.ifname === ifname && !inArray(id, ['wan', 'lan', 'freifunk']))
			delete n[id];
	});

	n.wan.ifname = removeItem(n.wan.ifname, ifname);
	n.lan.ifname = removeItem(n.lan.ifname, ifname);
	n.freifunk.ifname = removeItem(n.freifunk.ifname, ifname);

	n.pchanged = true;
}

function randomString(length) {
	var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
	var str = '';
	for (let i = 0; i < length; i++) {
		var rnum = Math.floor(Math.random() * chars.length);
		str += chars.substring(rnum, rnum + 1);
	}
	return str;
}

function addWifiSection(device, mode) {
	var w = uci.wireless;
	var n = uci.network;
	var s = config_find(uci.freifunk, {
		"stype": "settings"
	});
	var ifname = device + "_" + mode;

	// Add section to /etc/config/wireless
	switch (mode) {
		case "wan":
			// Only works if interface is not in a bridge!
			w[ifname] = {
				"device": device,
				"stype": "wifi-iface",
				"mode": "sta",
				"ssid": "OtherNetwork",
				"key": "password_for_OtherNetwork",
				"encryption": "psk2",
				"network": "wan"
			};
			break;
		case "mesh":
			var net = ifname.replace(".", "_");
			// 802.11s
			w[ifname] = {
				"device": device,
				"stype": "wifi-iface",
				"mode": "mesh",
				"mesh_id": s.default_mesh_id,
				"mesh_fwding": 0,
				"network": net
			};
			// Connected via option network
			n[net] = {stype: 'interface', mtu: '1532', proto: 'batadv_hardif', master: 'bat0'};
			n.pchanged = true;
			break;
		case "freifunk":
			w[ifname] = {"device": device, "stype": "wifi-iface", "mode": "ap", "ssid": ("Freifunk"), "network": "freifunk"};
			break;
		case "extrassid":
			w[ifname] = {
				"device": device,
				"stype": "wifi-iface",
				"mode": "ap",
				"ssid": ("bodensee.freifunk.net"),
				"network": "freifunk"
			};
			break;
		case "lan":
			w[ifname] = {
				"device": device,
				"stype": "wifi-iface",
				"mode": "ap",
				"ssid": "MyNetwork",
				"key": randomString(10),
				"encryption": "psk2",
				"network": "lan"
			};
			break;
		default:
			return alert("mode error '" + mode + "' " + device);
	}

	w.pchanged = true;
}

function delWifiSection(dev, mode) {
	var w = uci.wireless;
	var n = uci.network;

	config_foreach(w, "wifi-iface", function(id, obj) {
		if (obj.device === dev && getWifiMode(id) === mode) {
			if (mode === "mesh") {
				delete n[obj.network];
				n.pchanged = true;
			}
			delete w[id];
			w.pchanged = true;
		}
	});
}

function getWifiInterfaceState(dev, wid) {
	var obj = wifi_status[dev];

	if (!obj.up) {
		return "Inaktiv";
	}

	var interfaces = obj['interfaces'];
	for (let i = 0; interfaces && i < interfaces.length; i++) {
		var e = interfaces[i];
		if (e.section === wid) {
			return ('ifname' in e) ? "Aktiv" : "Fehler";
		}
	}
	return "Unbekannt";
}

function countWifi(mode, wmode) {
	var n = 0;
	config_foreach(uci.wireless, "wifi-iface", function(wid, wobj) {
		if (wmode && wobj['mode'] !== wmode) {
			return;
		}
		if (getWifiMode(wid) === mode) n++;
	});
	return n;
}

function countOther(mode) {
	return split(uci['network'][mode]['ifname']).length;
}

// Make sure we use only one interface for WAN
// when using WAN of Wifi. Otherwise it won't work.
function setWanMode(mode) {
	var changed = (uci['network']['wan']['mode'] === mode);
	if (mode === 'static' || mode === 'bridge') {
		uci['network']['wan']['mode'] = mode;
		uci['network'].pchanged = changed;
	}
}

function rebuild_wifi() {
	var root = $("#wireless");
	removeChilds(root);

	// Print wireless sections.
	config_foreach(uci.wireless, "wifi-device", function (dev, obj) {
		var fs = append_section(root, "Wireless '" + dev + "'", dev);
		var info = collect_wifi_info(dev);

		for (let sid in obj)
			appendNetworkSetting(fs, ['wireless', dev, sid], obj[sid]);

		var lan_help = "<b>LAN</b>: Aktiviert ein privates, passwortgesch\xfctztes WLAN-Netz mit Zugang zum eigenen Internetanschluss.";
		var freifunk_help = "<b>Freifunk</b>: Der WLAN-Zugang zum Freifunk-Netz.";
		var mesh_help = "<b>Mesh</b>: Das WLAN-Netz \xfcber das die Router untereinander kommunizieren.";
		var wan_help = "<b>WAN</b>: Erm\xf6glicht den Internetzugang eines anderen, herk\xf6mmlichen Routers zu nutzen (nutzt WDS).";
		var extrassid_help = "<b>ExtraSSID</b>: Diese Option bietet eine weitere SSID, die ebenfalls das Freifunknetz ausstrahlt. Es kann sein, dass nicht jeder sieht ob dieser Knopf geklickt wurde. Zum Deaktivieren der zweiten SSID das Freifunk WLAN komplett deaktivieren und dann nur Freifunk (ohne extra SSID) wieder aktivieren";
		var mode_checks = append_check(fs, "Modus", dev + "_mode", info.modes, [
			["LAN", "lan", lan_help],
			["Freifunk", "freifunk", freifunk_help],
			["Mesh", "mesh", mesh_help],
			["WAN", "wan", wan_help],
			["ExtraSSID", "extrassid", extrassid_help]
		]);
		var parent = append(fs, "div");

		// Print wireless interfaces.
		config_foreach(uci.wireless, "wifi-iface", function (wid, wobj) {
			if (wobj.device !== dev) return;

			var mode = getWifiMode(wid);
			var title = (mode === "none") ? "'" + wobj.network + "'" : modeName(mode);
			var entry = append_section(parent, title, "wireless_" + dev + "_" + mode);

			for (let opt in wobj)
				appendNetworkSetting(entry, ["wireless", wid, opt], wobj[opt], mode);

			var state = getWifiInterfaceState(dev, wid);
			var b = append_label(entry, "Status", state);
			addHelpText(b, "Funktioniert das Interface? Manche WLAN-Treiber k\xf6nnen z.B kein AccessPoint und Mesh gleichzeitig.");

			if (mode === "none") {
				append_button(entry, "L\xf6schen", function() {
					delWifiSection(dev, mode);
					rebuild_wifi();
					adv_apply();
				});
			}
		});

		// Add or remove a wifi interface.
		onDesc(mode_checks, "INPUT", function(e) {
			e.onclick = function(e) {
				var src = (e.target || e.srcElement);
				var mode = (src.data || src.value);

				if (src.checked) {
					if (obj.type !== "mac80211")
						alert("Diese Betriebsweise wird von diesem Chipsatz nicht unterst\xfctzt!");
					addWifiSection(dev, mode);
				} else {
					delWifiSection(dev, mode);
				}
				rebuild_wifi();
				adv_apply();
			};
		});
	});
}

function collect_switch_info(device) {
	var obj = {
		device: device
	};

	// Portmap is a mapping of label to internal port number.
	// Label starting with eth are not displayed and treated as physical interfaces.
	switch (uci.misc.data.model) {
		case 'tp-link-tl-wdr3600-v1':
		case 'tp-link-tl-wdr4300-v1':
			obj.map = [
				['eth0', 0],
				['WAN', 1],
				['LAN1', 2],
				['LAN2', 3],
				['LAN3', 4],
				['LAN4', 5]
			];
			break;
		case 'tp-link-tl-wr1043n-nd-v1':
			obj.map = [
				['eth0', 5],
				['WAN', 0],
				['LAN1', 1],
				['LAN2', 2],
				['LAN3', 3],
				['LAN4', 4]
			];
			break;
		case 'tp-link-tl-wr1043n-nd-v2':
		case 'tp-link-tl-wr1043n-nd-v3':
			obj.map = [
				['eth1', 0],
				['WAN', 5],
				['LAN1', 4],
				['LAN2', 3],
				['LAN3', 2],
				['LAN4', 1]
			];
			break;
		case 'tp-link-tl-wr1043n-nd-v4':
			obj.map = [
				['eth0', 0],
				['WAN', 5],
				['LAN1', 4],
				['LAN2', 3],
				['LAN3', 2],
				['LAN4', 1]
			];
			break;
		case 'tp-link-tl-wr1043n-v5':
			obj.map = [
				['eth1', 0],
				['WAN', 5],
				['LAN1', 4],
				['LAN2', 3],
				['LAN3', 2],
				['LAN4', 1]
			];
			break;
		case 'tp-link-tl-wdr3500-v1':
		case 'tp-link-tl-wr741n-nd-v4':
		case 'tp-link-tl-wr841n-nd-v3':
		case 'tp-link-tl-wr841n-nd-v5':
			obj.map = [
				['eth0', 0],
				['LAN1', 2],
				['LAN2', 3],
				['LAN3', 4],
				['LAN4', 1]
			];
			break;
		case 'tp-link-tl-wr841n-nd-v8':
		case 'tp-link-tl-mr3420-v2':
			obj.map = [
				['eth1', 0],
				['LAN1', 2],
				['LAN2', 3],
				['LAN3', 4],
				['LAN4', 1]
			];
			break;
		case 'tp-link-tl-wr941n-nd-v5':
		case 'tp-link-tl-wr941n-nd-v6':
			obj.map = [
				['eth1', 0],
				['LAN1', 4],
				['LAN2', 3],
				['LAN3', 2],
				['LAN4', 1]
			];
			break;
		case 'tp-link-tl-wr841n-nd-v9':
		case 'tp-link-tl-wr841n-nd-v10':
		case 'tp-link-tl-wr841n-nd-v11':
			obj.map = [
				['eth0', 0],
				['LAN1', 4],
				['LAN2', 3],
				['LAN3', 2],
				['LAN4', 1]
			];
			break;
		case 'tp-link-tl-wr842n-nd-v1':
		case 'tp-link-tl-wr842n-nd-v2':
			obj.map = [
				['eth1', 0],
				['LAN1', 2],
				['LAN2', 3],
				['LAN3', 4],
				['LAN4', 1]
			];
			break;
		case 'tp-link-tl-wr842n-nd-v3':
			obj.map = [
				['eth0', 0],
				['LAN1', 4],
				['LAN2', 3],
				['LAN3', 2],
				['LAN4', 1]
			];
			break;
		case 'tp-link-tl-wr841n-nd-v7':
		case 'tp-link-tl-mr3420-v1':
			obj.map = [
				['eth0', 0],
				['LAN1', 1],
				['LAN2', 2],
				['LAN3', 3],
				['LAN4', 4]
			];
			break;
		case 'tp-link-cpe210-v1-0':
		case 'tp-link-cpe210-v1-1':
		case 'tp-link-cpe220-v1-0':
		case 'tp-link-cpe510-v1-0':
		case 'tp-link-cpe510-v1-1':
		case 'tp-link-cpe520-v1-0':
			obj.map = [
				['eth0', 0],
				['LAN0', 5],
				['LAN1', 4]
			];
			break;
		case 'tp-link-archer-c5-v1':
		case 'tp-link-archer-c7-v2':
			obj.map = [
				['eth1', 0],
				['LAN1', 2],
				['LAN2', 3],
				['LAN3', 4],
				['LAN4', 5],
				['eth0', 6],
				['WAN', 1]
			];
			break;
		case 'd-link-dir-615-d':
		case 'd-link-dir-615-h1':
		case 'd-link-dir-615-h2':
			obj.map = [
				['eth0', 6],
				['LAN1', 3],
				['LAN2', 2],
				['LAN3', 1],
				['LAN4', 0],
				['Internet', 4]
			];
			break;
		case 'd-link-dir-860l-b1':
			obj.map = [
				['eth0', 6],
				['LAN1', 1],
				['LAN2', 2],
				['LAN3', 3],
				['LAN4', 4],
				['WAN', 0]
			];
			break;
	}

	return obj;
}

function getSwitchVid(port, swinfo) {
	var found_vid;
	config_foreach(uci.network, "switch_vlan", function (vid, vobj) {
		if (vobj.device === swinfo.device && vobj.ports.indexOf(port) !== -1) {
			found_vid = vid;
			return false;
		}
	});
	return found_vid;
}

function countPortUse(port, swinfo) {
	var count = 0;
	config_foreach(uci.network, "switch_vlan", function (vid, vobj) {
		if (vobj.device === swinfo.device) {
			count += (vobj.ports.indexOf(port) !== -1);
		}
	});
	return count;
}

function renameInterface(old_ifname, new_ifname) {
	for (let i in uci.network) {
		var ifname = split(uci.network[i].ifname);
		var index = ifname.indexOf(old_ifname);
		if (index !== -1) {
			ifname[index] = new_ifname;
			uci.network[i].ifname = ifname.join(' ');
		}
	}
}

function replaceSwitchPort(fromPort, toPort, swinfo) {
	var vid = getSwitchVid(fromPort, swinfo);
	if (vid) {
		var vobj = uci.network[vid];
		var fromIfname = getInterfaceName(vid, swinfo);
		vobj.ports = replaceItem(vobj.ports, fromPort, toPort);
		var toIfname = getInterfaceName(vid, swinfo);
		renameInterface(fromIfname, toIfname);
	}
}

function fixPortTag(swinfo) {
	for (let i in swinfo.map) {
		var v = swinfo.map[i];
		if (v[0].startsWith("eth")) {
			var bport = v[1];
			if (countPortUse(bport, swinfo) > 1) {
				replacePort(bport, bport + "t", swinfo);
			} else {
				replacePort(bport + "t", bport, swinfo);
			}
		}
	}
}

function getInterfaceName(vid, swinfo) {
	var vobj = uci.network[vid];
	for (let i in swinfo.map) {
		var v = swinfo.map[i];
		if (v[0].startsWith("eth")) {
			if (vobj.ports.indexOf("" + v[1] + "t") !== -1) {
				return v[0] + "." + vobj.vlan;
			} else if (vobj.ports.indexOf(v[1]) !== -1) {
				return v[0];
			}
		}
	}
}

// Get base port.
function getBasePort(port, swinfo) {
	var bport;
	var found = false;
	var map = swinfo.map;
	for (let i in map) {
		var v = map[i];
		if (v[0].startsWith("eth")) {
			bport = v[1];
		}
		if (v[1] === port) {
			return bport;
		}
	}
	// A default port must exist.
}

function removePort(port, mode, swinfo) {
	var vid = getSwitchVid(port, swinfo);
	var bport = getBasePort(port, swinfo);
	var ifname = getInterfaceName(vid, swinfo);
	var vobj = uci.network[vid];

	vobj.ports = removeItem(vobj.ports, port);
	// Only the base port or no port at all is left => remove section.
	if (split(vobj.ports).length < 2) {
		delNetSection(ifname);
		delete uci.network[vid];
	}

	if (countPortUse(bport, swinfo) < 2) {
		// Untag base port.
		replaceSwitchPort(bport + "t", bport, swinfo);
	}

	uci.network.pchanged = true;
}

function addPort(port, mode, swinfo) {
	var bport = getBasePort(port, swinfo);

	var vlans = [];
	var added = config_foreach(uci.network, "switch_vlan", function (vid, vobj) {
		vlans.push(parseInt(vobj.vlan));
		if (vobj.device === swinfo.device && vobj.ports.indexOf(bport) !== -1) {
			var ifname = getInterfaceName(vid, swinfo);
			if (getInterfaceMode(ifname) === mode) {
				vobj.ports = addItem(vobj.ports, port);
				return true;
			}
		}
	});

	if (!added) {
		// Get smallest unused vlan number > 0.
		var vlan = vlans.sort(function (a, b) {
			return a - b
		}).reduce(function (r, v, i) {
			return (r < vlans.length) ? r : ((i + 1 !== v) ? i + 1 : r);
		}, vlans.length + 1);

		var ports = "" + bport;
		if (countPortUse(bport, swinfo) > 0) {
			// Tag base port.
			replaceSwitchPort(bport, bport + "t", swinfo);
			ports += "t " + port;
		} else {
			ports += " " + port;
		}

		var vid = "cfg" + (++gid);
		uci.network[vid] = {
			"stype": "switch_vlan",
			"device": swinfo.device,
			"vlan": "" + vlan,
			"ports": ports
		};

		var ifname = getInterfaceName(vid, swinfo);
		addNetSection(ifname, mode);
	}

	uci.network.pchanged = true;
}

function getChangeHandler(port, mode, swinfo) {
	return function (e) {
		var src = (e.target || e.srcElement);
		var mode = (src.data || src.value);

		removePort(port, mode, swinfo);
		addPort(port, mode, swinfo);

		rebuild_switches();
	};
}

function rebuild_switches() {
	var root = $("#switches");
	removeChilds(root);
	addHelpText(root, "Konfiguration der Anschl\xfcsse/Ports am Router. Bitte darauf achten, dass der Zugang auf diese Seite normalerweise nur \xfcber auf 'LAN' gestellte Anschl\xfcsse m\xf6glich ist.");

	config_foreach(uci.network, "switch", function (sid, sobj) {
		var swinfo = collect_switch_info(sobj.name);
		var sfs = append_section(root, "Switch '" + swinfo.device + "'");

		if (!swinfo.map) {
			var p = append(sfs, 'div');
			var label = append(p, "label");
			label.innerHTML = "Keine Port-Konfiguration m\xf6glich.";
		} else for (let i in swinfo.map) {
			var name = swinfo.map[i][0];
			var port = swinfo.map[i][1];
			if (name.startsWith("eth")) {
				continue;
			}
			var vid = getSwitchVid(port, swinfo);
			var ifname = getInterfaceName(vid, swinfo);
			var mode = getInterfaceMode(ifname);
			var bport = getBasePort(port, swinfo);

			var p = append(sfs, 'div');
			var label = append(p, "label");
			label.innerHTML = name + ":";

			var select = append_options(p, "port_" + port, mode, net_options);
			select.onchange = getChangeHandler(port, mode, swinfo);
		}
	});
}

/*
 * WAN over wifi works only if the wifi interface
 * is not in a bridge. Switch to static in this case.
 * Also check if there are other WAN interfaces
 *since only a bridge would support that.
 */
function checkWifiWan() {
	var pre_mode = uci.network.wan.type;
	var new_mode = 'bridge';

	if (countWifi('wan', 'sta')) {
		if ((countWifi('wan') + countOther('wan')) > 1) {
			return false;
		}
		new_mode = 'static';
	}

	if (pre_mode !== new_mode) {
		uci.network.wan.type = new_mode;
		uci.network.pchanged = true;
	}

	return true;
}

function save_data_network() {
	if (!checkWifiWan()) {
		alert("WAN \xfcber WLAN funktioniert nur wenn dieser als einziger Anschluss f\xfcr WAN verwendet wird! Bitte korrigieren.");
		return;
	}

	for (let name in uci) {
		var obj = uci[name];
		if (!obj.pchanged)
			continue;

		var data = toUCI(obj);
		send("/cgi-bin/misc", {
				func: "set_config_file",
				name: name,
				data: data
			},
			function(data) {
				$('msg').innerHTML = data;
				$('msg').focus();
				init();
			}
		);
	}
}


/* imported from wifiscan.js */

function fetch(regex, data) {
	var result = data.match(regex);
	return result ? result[1] : "";
}

function append_td(tr, value) {
	append(tr, 'td').innerHTML = value ? value : "?";
}

function signalToQuality(signal) {
	var dBm = parseFloat(signal);
	if (dBm <= -100) {
		return 0;
	} else if (dBm >= -50) {
		return 100;
	} else {
		return (2 * (dBm + 100));
	}
}

function wifi_scan() {
	var s = $('#wifiscan_selection');
	var device = s.options[s.selectedIndex].value;

	send("/cgi-bin/misc", {
		func: 'wifiscan',
		device: device
	}, function (data) {
		var tbody = $("#wifiscan_tbody");
		removeChilds(tbody);

		data = data.replace(/BSS /g, "|BSS ");
		var items = data.split("|").filter(Boolean);
		for (let i = 0; i < items.length; ++i) {
			var item = items[i];
			var ssid = fetch(/SSID: (.*)\n/, item);
			var bss = fetch(/BSS (..:..:..:..:..:..).*\n/, item);
			var channel = fetch(/channel: (.*)\n/, item);
			var signal = fetch(/signal: (.*)\n/, item);
			var capability = fetch(/capability: (.*)\n/, item);
			var mesh_id = fetch(/MESH ID: (.*)\n/, item);

			var tr = append(tbody, 'tr');
			append_td(tr, mesh_id ? mesh_id : ssid);
			append_td(tr, bss);
			append_td(tr, channel);
			append_td(tr, signal + " (" + signalToQuality(signal) + "%)");

			//determine the wifi mode
			if (mesh_id) {
				append_td(tr, "  802.11s");
			} else if (/IBSS/.test(capability)) {
				append_td(tr, "  AdHoc");
			} else if (/ESS/.test(capability)) {
				append_td(tr, "  AccessPoint");
			} else {
				append_td(tr, "  ???");
			}
		}

		var table = $('#wifiscan_table');
		show(table);
	});
}

function add_list_entry(device, ifname) {
	var list = $('#wifiscan_selection');
	var o = append(list, 'option');
	o.style.paddingRight = "1em";
	o.innerHTML = device;
	o.value = ifname;
}

/*
 * Create a selection of wireless devices
 */
function init_wifiscan() {
	send("/cgi-bin/misc", {
		func: 'wifi_status'
	}, function(data) {
		var data = JSON.parse(data);
		for (let device in data) {
			var interfaces = data[device].interfaces;
			if (interfaces.length === 0) {
				continue;
			}
			for (let interface in interfaces) {
				var ifname = interfaces[interface].ifname;
				if (typeof(ifname) === 'string') {
					add_list_entry(device, ifname);
				}
			}
		}
	});
}

/* imported from password.js */

function init_password() {
	$("#p1").focus();
}

function apply() {
	p1 = $('#p1').value;
	p2 = $('#p2').value;
	s1 = $('#s1').value;

	$('#p1').value = "";
	$('#p2').value = "";
	$('#s1').value = "";

	if (p1 !== p2) {
		setText('msg', "(E) Die Passw&ouml;rter sind nicht identisch.");
		return;
	} else {
		if (p1 === "") {
			setText('msg', "Keine Passwort&auml;nderung.");
		} else {
			setText('msg', "(I) Das Passwort wird ge&auml;ndert. Bitte die Seite neu laden.");
			send("/cgi-bin/password", {
				func: "set_password",
				pass1: p1,
				pass2: p2
			}, function(data) {
				setText('msg', data);
			});
		}
	}

	if (s1 === "") {
		setText('msg', "");
	} else {
		send("/cgi-bin/sshpubkey", {
			func: "set_sshpubkey",
			sshpubkey: s1
		}, function(data) {
			setText('msg', data);
		});
	}
}
