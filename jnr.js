#! /usr/bin/env node

// Junior
// ======

// Templating engine

var fs = require('fs');
var path = require('path');
var filter = require('./filter');
var utils = require('./utils');
var safeEval = require('safe-eval');

var TPL_TAG_OPEN = TPL_TAG_OPEN_DEFAULT = '{{'; // Can be the same char
var TPL_TAG_CLOSE = TPL_TAG_CLOSE_DEFAULT = '}}'; // Can be the same char

var TPL_TAG_OPEN_REGSAFE = escapeRegex(TPL_TAG_OPEN);
var TPL_TAG_CLOSE_REGSAFE = escapeRegex(TPL_TAG_CLOSE);

function jnr(){
}

jnr.registerFilter = filter.registerFilter;

// |options| (optional object)
// - `returnData` if set to true, instead of returning rendered object will return obj and the data
//   {rendered:obj, data:obj}
// - `filter` Top level filter will be applied to the top level template.
// - `stringFilter` Global string filter string sequence will be applied to every string that is rendered.

jnr.render = function(obj, data, options = {}){
  
  var _data = dupe(data); // Create a duplicate data to work with
  
  var rendered = renderTemplate(obj, _data, options.filter, options.stringFilter);
  
  if (options.returnData){ // This can be used to access the result of `set` calls.
    return {rendered:rendered, data:_data};
  }
	return rendered;
  
}

// Can be the same char
// Set to null to reset to default
jnr.setTags = function(tagOpen, tagClose){

	TPL_TAG_OPEN = (typeof tagOpen === 'string' && tagOpen.length > 0) ? tagOpen : TPL_TAG_OPEN_DEFAULT;
	TPL_TAG_CLOSE = (typeof tagClose === 'string' && tagClose.length > 0) ? tagClose : TPL_TAG_CLOSE_DEFAULT;
	TPL_TAG_OPEN_REGSAFE = escapeRegex(TPL_TAG_OPEN);
	TPL_TAG_CLOSE_REGSAFE = escapeRegex(TPL_TAG_CLOSE);

}

// ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱

// Template
// --------
function renderTemplate(obj, data, topLevelFilter = null, globalStringFilter = null){

	// Apply recursively looking for string data
  
  
  if (data._logic_blocks == undefined){
		data._logic_blocks = [];
	}
  
  if (data._tmp_vars == undefined){
		data._tmp_vars = [];
	}
  
	if (isNonArrObj(obj)){

		obj = dupe(obj); // Duplicate the template to keep original
		for (var p in obj){
			obj[p] = renderTemplate(obj[p], data, null, globalStringFilter);
		}

	} else if (Array.isArray(obj)){

		obj = dupe(obj); // Duplicate the template to keep original
		for (var i = 0 ; i < obj.length; i++){
			obj[i] = renderTemplate(obj[i], data, null, globalStringFilter);
		}

	} else if (typeof obj !== 'string'){

    // Probably a primitive data type, leave alone
		return obj; 
    
	}

	// String
  
  if (typeof obj == 'string') {
    
  	var keepLooping = true;
  	var str = obj;
  	
  	while (keepLooping){ // Keep looping until no change in string
  		var strPreApply = str;
  		str = renderTemplateString(strPreApply, data);
  		keepLooping = str != strPreApply;
  	}
    
    if (globalStringFilter && typeof globalStringFilter == 'string'){
      if (globalStringFilter.charAt(0) != '|'){ // Ensure leading pipe
        globalStringFilter = '|' + globalStringFilter;
      }
      data._tmp_vars.push(str);
      str = parseTemplateExpression('_tmp_vars[' + String(data._tmp_vars.length-1) + ']'+ globalStringFilter, data)
    }
    
    obj = str;
    
  }
  
  if (topLevelFilter && typeof topLevelFilter == 'string'){
    if (topLevelFilter.charAt(0) != '|'){ // Ensure leading pipe
      topLevelFilter = '|' + topLevelFilter;
    }
    data._tmp_vars.push(obj);
    obj = parseTemplateExpression('_tmp_vars[' + String(data._tmp_vars.length-1) + ']'+ topLevelFilter, data)
  }
  
  delete data._logic_blocks;
	delete data._tmp_vars;
  
	return obj;

}

var LOGIC_BLOCK_TYPE_LOOP = 'loop';
var LOGIC_BLOCK_TYPE_CONDITIONAL = 'cond';
var LOGIC_BLOCK_TYPE_SET_CAPTURE = 'set';

function renderTemplateString(str, data){
	
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
	
  var regexStr = TPL_TAG_OPEN_REGSAFE + 'set ([^=]+)\\=(?:(?!\\.\\.\\.))(.*?)'+TPL_TAG_CLOSE_REGSAFE;
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
      block.expressionContents = m[2]; 
			block.captureFilterListStr = false;  // Filter is included in block.expressionContents for simple setTags
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
  var regexStr = TPL_TAG_OPEN_REGSAFE + 'filter(\\|.*?)'+TPL_TAG_CLOSE_REGSAFE+'((?:(?!'+TPL_TAG_OPEN_REGSAFE+'each)(?!'+TPL_TAG_OPEN_REGSAFE+'if)(?!'+TPL_TAG_OPEN_REGSAFE+'set)(?!'+TPL_TAG_OPEN_REGSAFE+'filter).|[\r\n])*?)'+TPL_TAG_OPEN_REGSAFE+'\/filter'+TPL_TAG_CLOSE_REGSAFE
	var regex = new RegExp(regexStr, 'gim') 
  // TPL_TAG_OPEN_REGSAFE + 'filter(\\([^'+TPL_TAG_OPEN_REGSAFE+TPL_TAG_CLOSE_REGSAFE+' \\)]*\\))?'+TPL_TAG_CLOSE_REGSAFE+'((?:(?!'+TPL_TAG_OPEN_REGSAFE+'each)(?!'+TPL_TAG_OPEN_REGSAFE+'if)(?!'+TPL_TAG_OPEN_REGSAFE+'set)(?!'+TPL_TAG_OPEN_REGSAFE+'filter).|[\r\n])*?)'+TPL_TAG_OPEN_REGSAFE+'\/filter'+TPL_TAG_CLOSE_REGSAFE, 'gim');

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
			block.captureFilterListStr = m[1] == undefined ? false : m[1] // Pipe at char 0
			block.captureContents = m[2];
      block.expressionContents = false;
			block.output = true;
			
			block.index = data._logic_blocks.length;
			data._logic_blocks.push(block);
      
			var val = TPL_TAG_OPEN + '_logic_blocks.'+ String(block.index)+TPL_TAG_CLOSE;
			str = str.substr(0, m.index+indexOffset) + String(val) + str.substr(m.index+indexOffset + m[0].length);
			indexOffset += String(val).length - m[0].length;
			
	}
  
	// Set capture block
	// -----------------
  
  var regexStr = TPL_TAG_OPEN_REGSAFE + 'set ([^=]+)\\=\\.\\.\\.(\\|.*?)'+TPL_TAG_CLOSE_REGSAFE+'((?:(?!'+TPL_TAG_OPEN_REGSAFE+'each)(?!'+TPL_TAG_OPEN_REGSAFE+'if)(?!'+TPL_TAG_OPEN_REGSAFE+'set)(?!'+TPL_TAG_OPEN_REGSAFE+'filter).|[\r\n])*?)'+TPL_TAG_OPEN_REGSAFE+'\/set'+TPL_TAG_CLOSE_REGSAFE
	var regex = new RegExp(regexStr, 'gim');

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
			block.captureFilterListStr = m[2] == undefined ? false : m[2] // Pipe at char 0
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

	var regex = new RegExp(TPL_TAG_OPEN_REGSAFE + 'each ([^ ]+) as ([^'+TPL_TAG_OPEN_REGSAFE+TPL_TAG_CLOSE_REGSAFE+' ]*)'+TPL_TAG_CLOSE_REGSAFE+'((?:(?!'+TPL_TAG_OPEN_REGSAFE+'each)(?!'+TPL_TAG_OPEN_REGSAFE+'if)(?!'+TPL_TAG_OPEN_REGSAFE+'set)(?!'+TPL_TAG_OPEN_REGSAFE+'filter).|[\r\n])*?)'+TPL_TAG_OPEN_REGSAFE+'\/each'+TPL_TAG_CLOSE_REGSAFE, 'gim');

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
	var regex = new RegExp(TPL_TAG_OPEN_REGSAFE + 'if (.+?)'+TPL_TAG_CLOSE_REGSAFE+'((?:(?!'+TPL_TAG_OPEN_REGSAFE+'each)(?!'+TPL_TAG_OPEN_REGSAFE+'if)(?!'+TPL_TAG_OPEN_REGSAFE+'set)(?!'+TPL_TAG_OPEN_REGSAFE+'filter).|[\r\n])*?)(?:'+TPL_TAG_OPEN_REGSAFE+'else'+TPL_TAG_CLOSE_REGSAFE+'((?:(?!'+TPL_TAG_OPEN_REGSAFE+'each)(?!'+TPL_TAG_OPEN_REGSAFE+'if)(?!'+TPL_TAG_OPEN_REGSAFE+'set)(?!'+TPL_TAG_OPEN_REGSAFE+'filter).|[\r\n])*?))*'+TPL_TAG_OPEN_REGSAFE+'\/if'+TPL_TAG_CLOSE_REGSAFE, 'gim');
	
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
	var regexStr = TPL_TAG_OPEN_REGSAFE+'(?!else)([^/].+?)'+TPL_TAG_CLOSE_REGSAFE;
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
            
            var _contents = renderTemplateString(block.captureContents, data)
            
            if (block.captureFilterListStr !== false){
              // Hand off to `parseTemplateExpression` to handle filter processing
              data._tmp_vars.push(_contents);
              _val = parseTemplateExpression('_tmp_vars[' + String(data._tmp_vars.length-1) + ']'+ block.captureFilterListStr, data)
            } else {
              _val = _contents;
            }
            
          } else {
            throw new Error('Invalid set tag encountered.');
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

					if (utils.getObjPath(data, block.loopPropValAlias) != undefined){
						// Save existing prop, overwrite and restore later
						saveExistingloopPropValAlias = utils.getObjPath(data, block.loopPropValAlias);
					}

					var keyAliasSet = block.loopPropKeyAlias != undefined;
					if (keyAliasSet && utils.getObjPath(data, block.loopPropKeyAlias) != undefined){
						// Save existing prop, overwrite and restore later
						saveExistingloopPropKeyAlias = utils.getObjPath(data, block.loopPropKeyAlias);
					}

					var objIndexSet = block.loopPropObjIndexAlias != undefined;
					if (objIndexSet && utils.getObjPath(data, block.loopPropObjIndexAlias) != undefined){
						// Save existing prop, overwrite and restore later
						saveExistingloopPropObjIndexAlias = utils.getObjPath(data, block.loopPropObjIndexAlias);
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

//var RELATIONAL_OPERATORS = ['==','!=','>=','<=','<','>']; // Order is important
var BRACKET_IN_ESCAPE = '__brIn'; 
var BRACKET_OUT_ESCAPE = '__brOut';
var OR_ESCAPE = '__or'
var COMMA_IN_SIMPLE_BRACKET_ESCAPE = '__brComma';

function parseTemplateExpression(exp, data, resolveOptionalsToBoolean = false) {

  exp = String(exp).trim(); 
	var origExp = exp;
  
  // 1) Filters are considered first unless wrapped in brackets
  // - Defer ternary operations to eval
  // - Defer logical operations to eval
  // - Defer ! to eval

  // 1) Replace string constants with vars, they may contain chars that break parsing
  // Supports double and single quotes as well as escaped chars
  
  if (exp.includes(`'`) || exp.includes(`"`)){ // Pre check to quickly bypass non-targeted expressions
      
    var regex = new RegExp(/("[^"\\]*(?:\\.[^"\\]*)*")|(\'[^\'\\]*(?:\\.[^\'\\]*)*\')/gi);
    
    var startingExp = exp;
    var m;
    var indexOffset = 0;
    while ((m = regex.exec(startingExp)) !== null) {

        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        }
        
        var isDoubleQuote = m[1] != undefined;
        var strContent = isDoubleQuote ? m[1] : m[2];        
        var content = strContent.substr(1,strContent.length-2);
        
        // Escape sequences can be safely removed now.
        if (isDoubleQuote){
          content = content.split('\\"').join('"')
        } else {
          content = content.split("\\'").join("'")
        }
        data._tmp_vars.push(content);
        
        var val = '_tmp_vars[' + String(data._tmp_vars.length-1) + ']' // Use square brackets as result will be evaled
        exp = exp.substr(0, m.index+indexOffset) + val + exp.substr(m.index+indexOffset + m[0].length);
        indexOffset += String(val).length - m[0].length;
        
    }
    
  }
  
  // Now string constants are gone remove all spacing from expression 
  
  exp = exp.replace(/\s/g, '')
  
  // Escape || chars to enable parse single filter pipes 
  
  exp = exp.replace(/\|\|/g, OR_ESCAPE);
  
  // 2) Seach for a filter inside a top level bracket.
  //    - Weed out simple brackets, looking for filter pipes.
  
  if (exp.includes(`|`) && exp.includes(`(`)){ // Pre check to quickly bypass non-targeted expressions
    
    var regex = new RegExp(/(\([^()|]*\))|(\([^()]*\))/gi);
    
    var keepLooping = true;
    
    while(keepLooping){
    
      var startingExp = exp;
      var m;
      var indexOffset = 0;
      while ((m = regex.exec(startingExp)) !== null) {

          if (m.index === regex.lastIndex) {
              regex.lastIndex++;
          }
          
          if (m[1] !== undefined){
            // Found a simple bracket, replace with placeholder char
            var val = BRACKET_IN_ESCAPE + m[1].substr(1,m[1].length-2).split(',').join(COMMA_IN_SIMPLE_BRACKET_ESCAPE) + BRACKET_OUT_ESCAPE
          } else {
            // Found a bracket containing a top level filter, process this separately
            var bracketExp = m[2].substr(1,m[2].length-2);
            data._tmp_vars.push(parseTemplateExpression(bracketExp, data));
            
            var val = '_tmp_vars[' + String(data._tmp_vars.length-1) + ']' // Use square brackets as result will be evaled;
          }
          
          exp = exp.substr(0, m.index+indexOffset) + val + exp.substr(m.index+indexOffset + m[0].length);
          indexOffset += String(val).length - m[0].length;
          
      }
      
      keepLooping = exp != startingExp;
    
    }
  }
  
  
  // Resolve each filter expression separately as their own call to this function
  // Rolling the result to be processed on the next filter.
  // -----------------------------------------------------------------
  
  var filterSequence = exp.split('|');  
  if (filterSequence.length > 1){
    
    var rollingResult = undefined;    
    for (var i = 0; i < filterSequence.length; i++){
      
      if (i == 0){ // Index 0 will *usually* contain the seed value        
        rollingResult = parseTemplateExpression(filterSequence[i], data);
        //try {        
        //  
        //} catch(e){
        //  // It is possible, if index 0 doens't resolve that index 0 is a filter name, that takes undefined as it's rolling value.
        //}        
      } else {
        // Interpret the filter:
        // `filterName:arg2,arg3`
        var filterParts = filterSequence[i].split(':');
        var filterName = filterParts[0];
        // Parse each extra arg
        var filterArgs = [rollingResult]
        if (filterParts.length > 1){
          filterArgs = filterArgs.concat(filterParts[1].split(','));
          for (var j = 1; j < filterArgs.length; j++){
            filterArgs[j] = parseTemplateExpression(filterArgs[j], data);  // Result each arg      
          }        
        }
        rollingResult = filter.applyFilter(filterName, filterArgs);  
      }
      
    }
    
    return rollingResult;
    
  }

  // Single expression parsing 
  // -------------------------
  
  // Replace escaped chars with real ones.

  exp = exp.split(BRACKET_IN_ESCAPE).join('(');
  exp = exp.split(BRACKET_OUT_ESCAPE).join(')');
  exp = exp.split(OR_ESCAPE).join('||');
  exp = exp.split(COMMA_IN_SIMPLE_BRACKET_ESCAPE).join(',');

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
		
    // Try resolving expression as var name
    result = utils.getObjPath(data, prop);
    
		if (result == undefined){ // Try evaluating
      
      try {
        
        result = safeEval(prop, data); // Will throw error if invalid
      
      } catch(error) {
        
      }
      
		}
    
    
		if (result != undefined){      
			// Found a result, exit optional search loop
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
      console.log(exp)
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

// Utils
// -----

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

module.exports = jnr;

jnr.__express = function(path, data, callback) {

	fs.readFile(path, 'utf8', function read(err, tpl) {
	  if (err) {
	      throw err;
	  }
    
	  callback(null, jnr.render(tpl, data));
	});
		
}
