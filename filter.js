// Templating engine

var moment = require('moment');
var yaml = require('js-yaml');
var UglifyJS = require('uglify-js');
var CleanCSS = require('clean-css');
var utils = require('./utils');


function filter(){
}

// https://markdown-it.github.io/
// full options list (defaults)
var md = require('markdown-it')({
  html:         true,        // Enable HTML tags in source
  xhtmlOut:     false,        // Use '/' to close single tags (<br />).
                              // This is only for full CommonMark compatibility.
  breaks:       false,        // Convert '\n' in paragraphs into <br>
  langPrefix:   'language-',  // CSS language prefix for fenced blocks. Can be
                              // useful for external highlighters.
  linkify:      true,        // Autoconvert URL-like text to links
 
  // Enable some language-neutral replacement + quotes beautification
  typographer:  true,
 
  // Double + single quotes replacement pairs, when typographer enabled,
  // and smartquotes on. Could be either a String or an Array.
  //
  // For example, you can use '«»„“' for Russian, '„“‚‘' for German,
  // and ['«\xA0', '\xA0»', '‹\xA0', '\xA0›'] for French (including nbsp).
  // quotes: '“”‘’',
 
  // Highlighter function. Should return escaped HTML,
  // or '' if the source string is not changed and should be escaped externally.
  // If result starts with <pre... internal wrapper is skipped.
  // highlight: function (/*str, lang*/) { return ''; }
  
});

// |dataType| options are 'date','str','float','int'
// Will overwrite existing
filter.registerFilter = function(dataType, filterName, filterFn) {
  
	if (!FILTERS[dataType]) {
		throw new Error('Data type `'+dataType+'` not found.')
	}
	FILTERS[dataType][filterName] = filterFn;
  
}

/*
// Param `filters` is a string without brackets of filter names separated by commas.
// If filterList is set to '' then no filters present
filter.applyFilters = function(obj, filterList){
	
	if (filterList.length == 0){
		return obj;
	}
	
	var filterArr = filterList.split(' ').join('').split(','); // Remove spaces
	
	for (var i = 0; i < filterArr.length; i++){
		var filterName = filterArr[i];
		obj = applyFilter(obj, filterName);
	}
	
	return obj;

}
*/

filter.applyFilter = function(filterName, args = []){

  var obj = args[0];

	// Any(*) type filters get precedence
	var filterFn = utils.getObjPath(FILTERS, '*.'+filterName);
	if (typeof filterFn == 'function'){
		return filterFn(obj);
	}

	var typeKey = '';

	if (Array.isArray(obj)) {
		typeKey = 'arr';
	} else if (typeof obj == 'object' && typeof obj.getMonth === 'function') {
		typeKey = 'date';
	} else if (typeof obj == 'string'){

		var filterMayBeDate = false;
		for (var p in FILTERS.date){
			if (p == filterName){
				filterMayBeDate = true;
				break;
			}
		}

		if (filterMayBeDate && moment(obj).isValid()){
			obj = moment(obj).toDate();
			typeKey = 'date';
		} else {
			typeKey = 'str'
		}
    
	} else if (typeof obj == 'number'){
    
		if (String(obj).split('.').length > 1){
			typeKey = 'float'
		} else {
			typeKey = 'int';
		}
    
	} else if (typeof obj == 'object'){
		typeKey = 'obj';
	}

	if (typeKey.length == 0){ // Type not found
		throw new Error('Filter subject type not supported `'+obj+'` ('+(typeof obj)+')');
	}
  
	var filterFn = utils.getObjPath(FILTERS, typeKey+'.'+filterName);
	if (typeof filterFn != 'function'){
		throw new Error('Filter `'+filterName+'` not found on type `'+typeKey+'`');
	}

	return filterFn.apply(this, args);

}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

// Filters
// -------

var FILTERS = {};
FILTERS['*'] = {};

FILTERS.arr = {};

FILTERS.arr.sentence = function(arr){
  var result = [];
  for (var i = 0; i < arr.length; i++){
    if (i > 0){
      result.push(i == arr.length-1 ? ' and ' : ', ');
    }
    result.push(arr[i])
  }
  return result.join('');
};

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

FILTERS.obj = {};

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

FILTERS.str = {};

FILTERS.str.md = function(str){
	
	return str.split('\n').length == 1 ? md.renderInline(str) : md.render(str);
	
}

FILTERS.str.concat = function(){
  var result = '';
  for (var i=0; i < arguments.length; i++) {
      result += arguments[i];
  }
  return result;  
}

FILTERS.str.yaml = function(str){
  
  try {
    return yaml.safeLoad(str);
  } catch (e) {
    throw e;
  }
  
  return null;
  
}

FILTERS.str.stripWhitespace = function(str){
  
  // - Remove any tab indents that remained throughout.
  // - Remove white space immediately before line break or end of string
  // - Replace more than 1 tab or space with a single.
  str = str.replace(/(?:^\s*)|(?:\s*(\n))|(?:\s*$)|(?:([ \t]){2,})/gim, '$1$2');
  str = str.replace(/(?:\s$)/i, ''); // Remove any whitespace before end of string
  
  return str;
  
}

// Lowercase, replace spacing with hyphens.
FILTERS.str.slugify = function(str){
	return str.toLowerCase().replace(new RegExp(/\s+/igm), '-');
}
//Eg. `0412 123 123` to `+6412123123`
FILTERS.str.phoneAuHref = function(str){
	str = str.replace(new RegExp(/\s+/igm), '');
	if (str.length == 0 || str.charAt(0) != '0'){
		throw new Error('Filter `phoneAuHref` encountered invalid phone number `'+str+'`');
	}
	return '+6' + str.substr(1);
}

FILTERS.str.nbsp = function(str){
	return str.replace(new RegExp(/\s+/igm), '&nbsp;');
}

FILTERS.str.uppercase = function(str){
	return str.toUpperCase();
}

FILTERS.str.lowercase = function(str){
	return str.toLowerCase();
}

FILTERS.str.hyphenate = function(str){
	return str.replace(new RegExp(/\s+/igm), '-');
}
FILTERS.str.jsmin = function(str, options){
  options = typeof options !== 'undefined' ? options : {}
  // Options: https://www.npmjs.com/package/uglify-js
  var result = UglifyJS.minify(str, options);
  if (result.error){
    throw error;
  } 
	return result.code;
}
 
FILTERS.str.cssmin = function(str, options){
  
  options = typeof options !== 'undefined' ? options : {level: 2}
  
  // Options: https://www.npmjs.com/package/clean-css
  var result = new CleanCSS(options).minify(str);
  
  if (result.errors.length > 0){
    throw result.errors[0];
  } 
	return result.styles;
  
}




// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

FILTERS.int = {};
FILTERS.int.currency = function(cents){

	var str = String(cents);

	while(str.length < 3){
		str = '0' + str;
	}

	var cents = str.substr(-2);
	var dollars = str.substr(0, str.length-2);

	var thousandChunks = [];
	var chunk = '';
	for (var i = dollars.length-1; i >=0; i--){
		chunk+=dollars.charAt(i);
		if (chunk.length == 3 || (i == 0 && chunk.length > 0)){
			thousandChunks.push(chunk.split('').reverse().join(''));
			chunk = '';
		}
	}

	return thousandChunks.reverse().join(',') + '.' + cents;

}

// Like currency though for dollar
FILTERS.int.currencyx100 = function(dollars){

	return FILTERS.int.currency(Math.round(dollars*100));

}
FILTERS.int.$currency = function(cents){

	return '$' + FILTERS.int.currency(cents);

}
FILTERS.int.minsToHrs = function(mins){

	var hrs = Math.round((mins/60)*100)/100;
	var parts = String(hrs).split('.');

	var hrsStr = parts[0];
	if (parts.length > 1){
		var minsStr = parts[1];
		if (minsStr.length > 2){
			minsStr = minsStr.substr(0,2);
		}
		hrsStr += '.' + minsStr;
	}

	var isPlural = mins==60;
	return hrsStr + 'hr' + (isPlural ? '' : 's');

	return hrsStr;

}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

FILTERS.date = {};
// 'YYYY-MM-DD'
FILTERS.date.format = function(date, formatString = 'MMMM Do YYYY, h:mm:ssa'){
  return moment(date).format(formatString);
}

FILTERS.date.readable = function(date){
	return moment(date).format('MMMM Do YYYY, h:mm:ssa');
}

module.exports = filter;
