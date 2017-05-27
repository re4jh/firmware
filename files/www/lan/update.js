
function init() {
	send("/cgi-bin/upgrade", { func : 'details' }, function(data) {
		var obj = fromUCI(data).misc.data;
		for (var key in obj) {
			var value = obj[key];

			if (key == 'stype') {
				continue;
			}

			setText(key, value);
		}
	});
}

function restore_firmware() {
	if(!confirm("Sollen alle Einstellungen zur\xFCckgesetzt werden?")){
		return;
	}
	send("/cgi-bin/upgrade", { func : 'restore_firmware' }, function(text) {
		setText('msg', text);
	});
}

function lookup_upgrade() {
	setText('msg', 'Versuche Updateserver zu erreichen. Bitte warten ...');
	send("/cgi-bin/upgrade", { func : 'lookup_upgrade' }, function(text) {
		setText('msg', text);
	});
}

function lookup_and_apply_upgrade() {
	if(!confirm("Soll ein Update durchgef\xFChrt werden?")){
		return;
	}
	setText('msg', 'Versuche Updateserver zu erreichen. Bitte warten ...');
	send("/cgi-bin/upgrade", { func : 'lookup_and_apply_upgrade' }, function(text) {
		setText('msg', text);
	});
}
