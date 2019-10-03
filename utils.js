// Templating engine

function utils(){
}

module.exports = utils;


utils.getObjPath = function(obj, path){

	var ref = obj;
	var pathParts = path.split('.');

	for (var i = 0; i < pathParts.length; i++){

		var path = pathParts[i]

		if (ref[path] == undefined) {

			// Return object length
			if (path == 'length' && isNonArrObj(ref)) {
				var k = 0;
				for (var p in ref){
					k++;
				}
				return k;
			}

			// Return array by [index]
			if (path.charAt(path.length-1) == ']' && path.split('[').length == 2){
				var parts = path.split('[');
				var index = parts[1].substr(0, parts[1].length-1);
				if (index >= 0 && ref[parts[0]] != undefined && Array.isArray(ref[parts[0]]) && ref[parts[0]].length > index) {
					return ref[parts[0]][index];
				}
			}

			return undefined;

		}
		ref = ref[path];

		if (i == pathParts.length - 1){

			return ref; // Made it to end
		}
	}

	return undefined;

}

