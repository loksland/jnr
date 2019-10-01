#! /usr/bin/env node

// Junior
// ======

// Templating engine

var fs = require('fs');
var path = require('path');
var moment = require('moment');
var yaml = require('js-yaml');
var safeEval = require('safe-eval')



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

var TPL_TAG_OPEN = TPL_TAG_OPEN_DEFAULT = '{{'; // Can be the same char
var TPL_TAG_CLOSE = TPL_TAG_CLOSE_DEFAULT = '}}'; // Can be the same char

var TPL_TAG_OPEN_REGSAFE = escapeRegex(TPL_TAG_OPEN);
var TPL_TAG_CLOSE_REGSAFE = escapeRegex(TPL_TAG_CLOSE);

function Jnr(){
}

// - `returnAlteredData` if set to true, instead of returning rendered object will return obj and the data
// {rendered:obj, data:obj}
Jnr.render = Jnr.apply = function(obj, data, options = {}){
  
  var _data = dupe(data); // Create a duplicate data to work with
  
  var rendered = renderTemplate(obj, _data);
  
  if (options.returnAlteredData){ // This can be used to access the result of `set` calls.
    return {rendered:rendered, data:_data};
  }
	return rendered;
}

// Can be the same char
// Set to null to reset to default
Jnr.setTags = function(tagOpen, tagClose){

	TPL_TAG_OPEN = (typeof tagOpen === 'string' && tagOpen.length > 0) ? tagOpen : TPL_TAG_OPEN_DEFAULT;
	TPL_TAG_CLOSE = (typeof tagClose === 'string' && tagClose.length > 0) ? tagClose : TPL_TAG_CLOSE_DEFAULT;
	TPL_TAG_OPEN_REGSAFE = escapeRegex(TPL_TAG_OPEN);
	TPL_TAG_CLOSE_REGSAFE = escapeRegex(TPL_TAG_CLOSE);

}

// ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱

// Template
// --------
function renderTemplate(obj, data){

	// Apply recursively looking for string data

	if (isNonArrObj(obj)){

		obj = dupe(obj); // Duplicate the template to keep original
		for (var p in obj){
			obj[p] = renderTemplate(obj[p], data);
		}

	} else if (Array.isArray(obj)){

		obj = dupe(obj); // Duplicate the template to keep original
		for (var i = 0 ; i < obj.length; i++){
			obj[i] = renderTemplate(obj[i], data);
		}

	} else if (typeof obj !== 'string'){

    throw new Error('Unkown object.');
		//return obj;

	}

	// String

	var keepLooping = true;
	var str = obj;
	
	while (keepLooping){
		var strPreApply = str;
		str = renderTemplateString(strPreApply, data);
		keepLooping = str != strPreApply;
	}
  
  if (typeof data._logic_blocks !== 'undefined'){
		delete data._logic_blocks;
	}
  
  //if (returnAlteredData){
  //  return {result:str, data:obj}
  //}
	return str;

}

var LOGIC_BLOCK_TYPE_LOOP = 'loop';
var LOGIC_BLOCK_TYPE_CONDITIONAL = 'cond';
var LOGIC_BLOCK_TYPE_SET_CAPTURE = 'set';

function renderTemplateString(str, data){
	
	if (data._logic_blocks == undefined){
		data._logic_blocks = [];
	}

	var preStr = str;
	
	// Comment blocks
	// --------------
	
	var regex = new RegExp(TPL_TAG_OPEN_REGSAFE + '\/\\*' + '(.|\s|\r|\n)*?' + '\\*\/' + TPL_TAG_CLOSE_REGSAFE, 'gim');
	
	var origStr = str;
	var m;
	var indexOffset = 0;
	while ((m = regex.exec(origStr)) !== null) {

			if (m.index === regex.lastIndex) {
					regex.lastIndex++;
			}

			var val = '';
			str = str.substr(0, m.index+indexOffset) + String(val) + str.substr(m.index+indexOffset + m[0].length);
			indexOffset += String(val).length - m[0].length;
			
	}
	
	// Simple set 
	// ----------
	
  var regexStr = TPL_TAG_OPEN_REGSAFE + 'set ([^'+TPL_TAG_OPEN_REGSAFE+TPL_TAG_CLOSE_REGSAFE+']+)\\=(?:(?!\\.\\.\\.))(.*?)(\\([^'+TPL_TAG_OPEN_REGSAFE+TPL_TAG_CLOSE_REGSAFE+' \\)]*\\))?'+TPL_TAG_CLOSE_REGSAFE;
	var regex = new RegExp(regexStr, 'gim');
  
	var origStr = str;
	var m;
	var indexOffset = 0;
	while ((m = regex.exec(origStr)) !== null) {

			if (m.index === regex.lastIndex) {
					regex.lastIndex++;
			}

			var block = {};
			
			block.type = LOGIC_BLOCK_TYPE_SET_CAPTURE;
			block.setVarPath = m[1];
			block.captureContents = false;
      block.expressionContents = m[2] + (m[3] ? m[3] : ''); // m[3] is the filter including brackets
			block.captureFilterListStr = false; // Remove brackets
			block.output = false;
			
			block.index = data._logic_blocks.length;
			data._logic_blocks.push(block);

			// str = str.split(m[0]).join(TPL_TAG_OPEN + '_logic_blocks.'+ String(block.index)+TPL_TAG_CLOSE)
			var val = TPL_TAG_OPEN + '_logic_blocks.'+ String(block.index)+TPL_TAG_CLOSE;
			str = str.substr(0, m.index+indexOffset) + String(val) + str.substr(m.index+indexOffset + m[0].length);
			indexOffset += String(val).length - m[0].length;
			
	}
	
	// Filter block
	// ------------
	// Just like a set capture block though is outputted immediately
	var regex = new RegExp(TPL_TAG_OPEN_REGSAFE + 'filter(\\([^'+TPL_TAG_OPEN_REGSAFE+TPL_TAG_CLOSE_REGSAFE+' \\)]*\\))?'+TPL_TAG_CLOSE_REGSAFE+'((?:(?!'+TPL_TAG_OPEN_REGSAFE+'each)(?!'+TPL_TAG_OPEN_REGSAFE+'if)(?!'+TPL_TAG_OPEN_REGSAFE+'set)(?!'+TPL_TAG_OPEN_REGSAFE+'filter).|[\r\n])*?)'+TPL_TAG_OPEN_REGSAFE+'\/filter'+TPL_TAG_CLOSE_REGSAFE, 'gim');
	
	var origStr = str;
	var m;
	var indexOffset=0;
	while ((m = regex.exec(origStr)) !== null) {

			if (m.index === regex.lastIndex) {
					regex.lastIndex++;
			}

			var block = {};
			
			block.type = LOGIC_BLOCK_TYPE_SET_CAPTURE;
			block.setVarPath = false;
			block.captureFilterListStr = (!m[1] || m[1].trim() == '()') ? '' : m[1].substr(1, m[1].length-2); // Remove brackets
			block.captureContents = m[2];
      block.expressionContents = false;
			block.output = true;
			
			block.index = data._logic_blocks.length;
			data._logic_blocks.push(block);

			// str = str.split(m[0]).join(TPL_TAG_OPEN + '_logic_blocks.'+ String(block.index)+TPL_TAG_CLOSE)
			var val = TPL_TAG_OPEN + '_logic_blocks.'+ String(block.index)+TPL_TAG_CLOSE;
			str = str.substr(0, m.index+indexOffset) + String(val) + str.substr(m.index+indexOffset + m[0].length);
			indexOffset += String(val).length - m[0].length;
			
	}
	
	// Set capture block
	// -----------------

	var regex = new RegExp(TPL_TAG_OPEN_REGSAFE + 'set ([^'+TPL_TAG_OPEN_REGSAFE+TPL_TAG_CLOSE_REGSAFE+']+)\\=\\.\\.\\.(\\([^'+TPL_TAG_OPEN_REGSAFE+TPL_TAG_CLOSE_REGSAFE+' \\)]*\\))?'+TPL_TAG_CLOSE_REGSAFE+'((?:(?!'+TPL_TAG_OPEN_REGSAFE+'each)(?!'+TPL_TAG_OPEN_REGSAFE+'if)(?!'+TPL_TAG_OPEN_REGSAFE+'set)(?!'+TPL_TAG_OPEN_REGSAFE+'filter).|[\r\n])*?)'+TPL_TAG_OPEN_REGSAFE+'\/set'+TPL_TAG_CLOSE_REGSAFE, 'gim');
	
	var origStr = str;
	var m;
	var indexOffset=0;
	while ((m = regex.exec(origStr)) !== null) {

			if (m.index === regex.lastIndex) {
					regex.lastIndex++;
			}

			var block = {};
			
			block.type = LOGIC_BLOCK_TYPE_SET_CAPTURE;
			block.setVarPath = m[1];
			block.captureFilterListStr = (!m[2] || m[2].trim() == '()') ? '' : m[2].substr(1, m[2].length-2); // Remove brackets
			block.captureContents = m[3];
      block.expressionContents = false;
			block.output = false;
			
			block.index = data._logic_blocks.length;
			data._logic_blocks.push(block);

			// str = str.split(m[0]).join(TPL_TAG_OPEN + '_logic_blocks.'+ String(block.index)+TPL_TAG_CLOSE)
			var val = TPL_TAG_OPEN + '_logic_blocks.'+ String(block.index)+TPL_TAG_CLOSE;
			str = str.substr(0, m.index+indexOffset) + String(val) + str.substr(m.index+indexOffset + m[0].length);
			indexOffset += String(val).length - m[0].length;
			
	}

	// Each loops
	// ----------

	var regex = new RegExp(TPL_TAG_OPEN_REGSAFE + 'each ([^'+TPL_TAG_OPEN_REGSAFE+TPL_TAG_CLOSE_REGSAFE+']+) as ([^'+TPL_TAG_OPEN_REGSAFE+TPL_TAG_CLOSE_REGSAFE+' ]*)'+TPL_TAG_CLOSE_REGSAFE+'((?:(?!'+TPL_TAG_OPEN_REGSAFE+'each)(?!'+TPL_TAG_OPEN_REGSAFE+'if)(?!'+TPL_TAG_OPEN_REGSAFE+'set)(?!'+TPL_TAG_OPEN_REGSAFE+'filter).|[\r\n])*?)'+TPL_TAG_OPEN_REGSAFE+'\/each'+TPL_TAG_CLOSE_REGSAFE, 'gim');

	var origStr = str;
	var m;
	var indexOffset=0;
	while ((m = regex.exec(origStr)) !== null) {

			if (m.index === regex.lastIndex) {
					regex.lastIndex++;
			}

			var block = {};
			block.type = LOGIC_BLOCK_TYPE_LOOP;

			block.loopSubject = m[1];
			var aliasInfoParts = m[2].split(',');

			if (aliasInfoParts.length == 1){
				block.loopPropValAlias = aliasInfoParts[0];
			} else if (aliasInfoParts.length == 2){
				block.loopPropKeyAlias = aliasInfoParts[0];
				block.loopPropValAlias = aliasInfoParts[1];
			} else if (aliasInfoParts.length == 3){
				block.loopPropObjIndexAlias = aliasInfoParts[0]; // Numerical index: used for counting in object iteration
				block.loopPropKeyAlias = aliasInfoParts[1];
				block.loopPropValAlias = aliasInfoParts[2];
			}	else {
				throw new Error('Invalid loop alias info found on `'+m[2]+'`');
			}

			block.loopContent = m[3];

			block.index = data._logic_blocks.length;
			data._logic_blocks.push(block);

			// str = str.split(m[0]).join(TPL_TAG_OPEN + '_logic_blocks.'+ String(block.index)+TPL_TAG_CLOSE)			
			var val = TPL_TAG_OPEN + '_logic_blocks.'+ String(block.index)+TPL_TAG_CLOSE;
			str = str.substr(0, m.index+indexOffset) + String(val) + str.substr(m.index+indexOffset + m[0].length);
			indexOffset += String(val).length - m[0].length;
			
	}
	
	// If else conditionals
	// --------------------
	
	var origStr = str;
	var regex = new RegExp(TPL_TAG_OPEN_REGSAFE + 'if ([^'+TPL_TAG_OPEN_REGSAFE+TPL_TAG_CLOSE_REGSAFE+']+)'+TPL_TAG_CLOSE_REGSAFE+'((?:(?!'+TPL_TAG_OPEN_REGSAFE+'each)(?!'+TPL_TAG_OPEN_REGSAFE+'if)(?!'+TPL_TAG_OPEN_REGSAFE+'set)(?!'+TPL_TAG_OPEN_REGSAFE+'filter).|[\r\n])*?)(?:'+TPL_TAG_OPEN_REGSAFE+'else'+TPL_TAG_CLOSE_REGSAFE+'((?:(?!'+TPL_TAG_OPEN_REGSAFE+'each)(?!'+TPL_TAG_OPEN_REGSAFE+'if)(?!'+TPL_TAG_OPEN_REGSAFE+'set)(?!'+TPL_TAG_OPEN_REGSAFE+'filter).|[\r\n])*?))*'+TPL_TAG_OPEN_REGSAFE+'\/if'+TPL_TAG_CLOSE_REGSAFE, 'gim');
	
	var m;
	var indexOffset = 0;
	while ((m = regex.exec(origStr)) !== null) {

			if (m.index === regex.lastIndex) {
					regex.lastIndex++;
			}

			var block = {};
			block.type = LOGIC_BLOCK_TYPE_CONDITIONAL;

			block.condExps = [m[1]]; // First if () conditional
			block.condContents = [m[2]]; // The rest, inc `elseif`, parsed below
			block.condContentElse = m[3]; // else () contents

			// `elseif` parsing

			// Look for elseif in m[2]
			if (m[2].toLowerCase().split('elseif').length > 1) {

				block.condContents = [];

				var elseIfRegex = /(.+?){{elseif ([^{{}}]+)}}/gmi;
				var mm;

				var lastIndex = 0;
				while ((mm = elseIfRegex.exec(m[2])) !== null) {

				    if (mm.index === regex.lastIndex) {
				        elseIfRegex.lastIndex++;
				    }

						lastIndex = mm.index + mm[0].length;
						block.condContents.push(mm[1]) // Last cond's content
						block.condExps.push(mm[2]) // Next cond expression
				}

				block.condContents.push(m[2].substr(lastIndex, m[2].length-lastIndex)) // Last cond's content is the remainder
				
			}

			block.index = data._logic_blocks.length;
			data._logic_blocks.push(block);

			// str = str.split(m[0]).join(TPL_TAG_OPEN + '_logic_blocks.'+ String(block.index)+TPL_TAG_CLOSE)			
			var val = TPL_TAG_OPEN + '_logic_blocks.'+ String(block.index)+TPL_TAG_CLOSE;
			str = str.substr(0, m.index+indexOffset) + String(val) + str.substr(m.index+indexOffset + m[0].length);
			indexOffset += String(val).length - m[0].length;
			
	}
	
	// Keep processing until all logic blocks are resolved
	if (str != preStr){
		return renderTemplateString(str, data);
	}

	// Process simple tags and logic blocks
	// ------------------------------------
	
	var result = str;
	var regexStr = TPL_TAG_OPEN_REGSAFE+'(?!else)([^/][^'+TPL_TAG_OPEN_REGSAFE+TPL_TAG_CLOSE_REGSAFE+']+)'+TPL_TAG_CLOSE_REGSAFE;
	var regex = new RegExp(regexStr, 'gim');
	
	// - Don't match expressions with a / at the start to avoid matiching /if /each 
	// - Don't match if the expression = `else`
	
	var m;
	var indexOffset = 0;
	while ((m = regex.exec(str)) !== null) {

			if (m.index === regex.lastIndex) {
					regex.lastIndex++;
			}
			
			var exp = m[1];
			var val = parseTemplateExpression(exp, data);
			
			if (exp.length > 14 && exp.substr(0,14) == '_logic_blocks.'){

				var block = val;
				
				if (block.type == LOGIC_BLOCK_TYPE_SET_CAPTURE){
					
          var _val;
          if (block.expressionContents !== false){ // One line set call, parse expression to retain data type of results
            _val = parseTemplateExpression(block.expressionContents, data);
          } else if (block.captureContents !== false){ // Capture block, result will always be a string
            _val = applyFilters(renderTemplateString(block.captureContents, data), block.captureFilterListStr);	
          } else {
            throw new Error('Invalid set encountered.')
          }
          
					if (block.setVarPath !== false){
						data = setObjPathVal(data, block.setVarPath, _val);					
					}					
					val = block.output ? _val : '';
					
				} else if (block.type == LOGIC_BLOCK_TYPE_CONDITIONAL){
					
					// Output if/else block results
						
					var conditionalExp = false
					for (var i = 0; i < block.condExps.length; i++){ // Look for first true conditional expression
						var conditionalResult = parseTemplateExpression(block.condExps[i], data, true); // resolveOptionalsToBoolean = true
						if (conditionalResult === true){
							conditionalExp = block.condContents[i]; // Found
							break;
						} else if (conditionalResult !== false){
							throw new Error('Conditional subject must resolve to a bool, exp `' + block.condExp+'` resolved to `'+conditionalResult+'`, (type:'+typeof conditionalResult+')');
						}
					}
					
					if (conditionalExp === false) { // No true conditions found
						conditionalExp = (block.condContentElse == null) ? '' : block.condContentElse
					}

					val = renderTemplateString(conditionalExp, data);
					
				} else if (block.type == LOGIC_BLOCK_TYPE_LOOP){
					
					// Output each block results

					var saveExistingloopPropValAlias;
					var saveExistingloopPropKeyAlias;
					var saveExistingloopPropObjIndexAlias

					if (getObjPath(data, block.loopPropValAlias) != undefined){
						// Save existing prop, overwrite and restore later
						saveExistingloopPropValAlias = getObjPath(data, block.loopPropValAlias);
					}

					var keyAliasSet = block.loopPropKeyAlias != undefined;
					if (keyAliasSet && getObjPath(data, block.loopPropKeyAlias) != undefined){
						// Save existing prop, overwrite and restore later
						saveExistingloopPropKeyAlias = getObjPath(data, block.loopPropKeyAlias);
					}

					var objIndexSet = block.loopPropObjIndexAlias != undefined;
					if (objIndexSet && getObjPath(data, block.loopPropObjIndexAlias) != undefined){
						// Save existing prop, overwrite and restore later
						saveExistingloopPropObjIndexAlias = getObjPath(data, block.loopPropObjIndexAlias);
					}

					var loopSubject = parseTemplateExpression(block.loopSubject, data)

					val = '';

					if (Array.isArray(loopSubject)){

						for (var i = 0; i < loopSubject.length; i++){

							data[block.loopPropValAlias] = loopSubject[i];
							if (keyAliasSet){
								data[block.loopPropKeyAlias] = i;
							}
							val += renderTemplateString(block.loopContent, data);

							delete data[block.loopPropValAlias];

						}

					} else if (isNonArrObj(loopSubject)){

						var propIndex = -1;
						for (var p in loopSubject){

							propIndex++;

							data[block.loopPropValAlias] = loopSubject[p];

							if (keyAliasSet){
								data[block.loopPropKeyAlias] = p;
							}

							if (objIndexSet){
								data[block.loopPropObjIndexAlias] = propIndex;
							}

							val += renderTemplateString(block.loopContent, data);

							delete data[block.loopPropValAlias];

							if (objIndexSet){
								delete 	data[block.loopPropKeyAlias]
							}
						}
					}

					if (saveExistingloopPropValAlias != undefined){
						data[block.loopPropValAlias] = saveExistingloopPropValAlias;
					}

					if (keyAliasSet && saveExistingloopPropKeyAlias != undefined){
						data[block.loopPropKeyAlias] = saveExistingloopPropKeyAlias;
					}

					if (objIndexSet && saveExistingloopPropObjIndexAlias != undefined){
						data[block.loopPropObjIndexAlias] = saveExistingloopPropObjIndexAlias;
					}

				} else {
					throw new Error('Logic block `'+exp+'` not found');
				}
			}
			
			// Due to `set` calls, order is now important. 
			result = result.substr(0, m.index+indexOffset) + String(val) + result.substr(m.index+indexOffset + m[0].length);
			indexOffset += String(val).length - m[0].length;
			//result = result.split(m[0]).join(val);
			
	}

	return result;

}

var RELATIONAL_OPERATORS = ['==','!=','>=','<=','<','>']; // Order is important

function parseTemplateExpression(exp, data, resolveOptionalsToBoolean = false) {

  exp = String(exp).trim(); // May not be string?
	var origExp = exp;
  
	var props;
	var m;

	var exp = exp.split('??').join('___optionalchain___'); // Remove `??` so ternary can be interpretted

	if ((m = new RegExp(/^([^\s]+)\?{1}([^\s?]+)\:([^\s?]+)$/im).exec(exp)) !== null) {

			// Ternary logic
			var conditional = m[1].split('___optionalchain___').join('??');
			var conditionalResult = parseTemplateExpression(conditional, data, true); // Interpret as it's own expression, resolveOptionalsToBoolean

			if (conditionalResult === true){
				exp = m[2];
			} else if (conditionalResult === false){
				exp = m[3];
			} else {
				throw new Error('Ternary subject `'+conditional+'` must resolve to boolean only, got `'+conditionalResult+'` (type:'+typeof conditionalResult+')');
			}

	}

	exp = exp.split('___optionalchain___').join('??');


	// Equation

	for (var i = 0 ; i < RELATIONAL_OPERATORS.length; i++){

		var operator = RELATIONAL_OPERATORS[i];
		var eqParts = exp.split(operator);

		if (eqParts.length > 1){
      
      

			if (eqParts.length != 2){
				throw new Error('Invalid relational operator `'+exp+'`');
			}

			var partA = parseTemplateExpression(eqParts[0], data)
			var partB = parseTemplateExpression(eqParts[1], data);
      
			if (operator == '==') {
				return partA == partB;
			} else if (operator == '!=') {
				return partA != partB;
			} else if (operator == '>') {
				return partA > partB;
			} else if (operator == '<') {
				return partA < partB;
			} else if (operator == '>=') {
				return partA >= partB;
			} else if (operator == '<=') {
				return partA <= partB;
			}
		}
	}

	var isNot = false;
	if (exp.length > 0){
		if (exp.charAt(0) == '!') {
			exp=exp.substr(1);
			isNot = true;
		}
	}

	// If last char is question mark then
	// if the result is a bool of whether expression defined or undefined
	var isOptional = false;
	if (exp.length > 0){
		if (exp.charAt(exp.length-1) == '?') {
			exp=exp.substr(0,exp.length-1);
			isOptional = true;
		}
	}

	// Optional chain
	props = exp.split('??');
	
	var result;

	// Search optional props in order
	for (var i = 0; i < props.length; i++){

		var prop = props[i];
    
		// Find filters
		
		var filters = '';
		var m;
    // Match valid filter names, no spaces in trailing brackets at end of string
		if ((m = new RegExp(/\( *([a-zA-Z_$][0-9a-zA-Z_$]+ *(?:, *[a-zA-Z_$][0-9a-zA-Z_$]+)?) *\)$/i).exec(prop)) !== null) {
				prop = prop.substr(0, prop.length - m[0].length);
				filters = m[1]; //.split(',');
		}

		// Loop possible prop names in prop and inject value if found.
		
    result = getObjPath(data, prop);
    
		if (result == undefined){ // Try evaluating
      
      try {
        
        result = safeEval(prop, data); // Will throw error if invalid
      
      } catch(error) {
        
      }
      
		}

		if (result != undefined){      
			// Apply filters
			result = applyFilters(result, filters);
			break;

		}
	}

	if (isOptional){

		if (resolveOptionalsToBoolean){

			result = result != undefined; // For conditional query result,

		} else {

			result = result != undefined ? result : ''; // Default behaviour, will return empty string if not set rather than throwing error.

		}

	} else {

		if (result == undefined){
			throw new Error('Couldn\'t resolve template expression `'+origExp+'`');
		}

	}

	if (isNot){
		if (result === true || result === false){
			result = !result;
		} else {
			throw new Error('Can\'t `NOT`(!) non-boolean result `'+origExp+'` resolved to `'+result+'` (type:'+typeof result+')');
		}
	}

	// The result may have more expressions in them,
	// If any further expressions are identified in the output then keep applying the template
	
	return result;

}

// ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱

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

FILTERS.obj = {};

FILTERS.str = {};

FILTERS.str.md = function(str){
	
	return str.split('\n').length == 1 ? md.renderInline(str) : md.render(str);
	
}

FILTERS.str.yaml = function(str){
  
  try {
    return yaml.safeLoad(str);
  } catch (e) {
    throw e;
  }
  
  return null
  
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
FILTERS.date = {};
// https://momentjs.com/docs/#/displaying/
FILTERS.date.ymd = function(date){
	return moment(date).format('YYYY-MM-DD');
}
FILTERS.date.display = function(date){
	return moment(date).format('DD.MM.YYYY');
}
FILTERS.date.readable = function(date){
	return moment(date).format('MMMM Do YYYY, h:mm:ssa');
}


// |dataType| options are 'date','str','float','int'
// Will overwrite existing
Jnr.registerFilter = function(dataType, filterName, filterFn) {

	if (!FILTERS[dataType]) {
		throw new Error('Data type `'+dataType+'` not found.')
	}
	FILTERS[dataType][filterName] = filterFn;

}

// Param `filters` is a string without brackets of filter names separated by commas.
// If filterList is set to '' then no filters present
function applyFilters(obj, filterList){
	
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

function applyFilter(obj, filterName){

	// Any type filters get precedence
	var filterFn = getObjPath(FILTERS, '*.'+filterName);
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
		return obj;
	}

	var filterFn = getObjPath(FILTERS, typeKey+'.'+filterName);
	if (typeof filterFn != 'function'){
		throw new Error('Filter `'+filterName+'` not found on type `'+typeKey+'`');
	}

	return filterFn(obj);

}

// ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱

// Obj utils
// ---------

function setObjPathVal(obj, path, val){

	var ref = obj;
	var pathParts = path.split('.');
	for (var i = 0; i < pathParts.length; i++){
			
		if (i == pathParts.length - 1){
			ref[pathParts[i]] = val;
		}	else if (ref[pathParts[i]] == undefined) {
			ref[pathParts[i]] =  {};
		}	
		ref = ref[pathParts[i]];
	}
	
	return obj;

}

function getObjPath(obj, path){

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

// ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱

// Utils
// -----

Jnr.trace = function(obj, clipPaths){

	clipPaths = typeof clipPaths !== 'undefined' ? clipPaths : []; // Optional param

	var objDupe = dupe(obj);

	var clipLen = 30;

	for (var i = 0; i < clipPaths.length; i++){

		var clipPathParts = clipPaths[i].split('.');
		var ref = objDupe;
		for (var j = 0; j < clipPathParts.length; j++){

			if (isNonArrObj(ref[clipPathParts[j]])){
				ref = ref[clipPathParts[j]];

			} else if (j == clipPathParts.length-1){

				if (ref[clipPathParts[j]].length > clipLen){
					ref[clipPathParts[j]] = ref[clipPathParts[j]].substr(0, clipLen) + '...';
				}

			}
		}
	}

  
	console['log'](JSON.stringify(objDupe, null, 2));

};

function dupe(obj){
	return JSON.parse(JSON.stringify(obj));
}

function isObj(obj){
	return typeof obj == 'object';
}

function isNonArrObj(obj){
	return typeof obj == 'object' && !Array.isArray(obj)
}

function escapeRegex(str){

  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");

}

module.exports = Jnr;

Jnr.__express = function(path, options, callback) {

	fs.readFile(path, 'utf8', function read(err, data) {
	  if (err) {
	      throw err;
	  }
	  callback(null, renderTemplate(data, options));
	});
		
}
