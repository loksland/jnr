#! /usr/bin/env node


var jnr = require('../jnr');
var fs = require('fs');

var output = '';







output += h3('Substitution');

output += codeblock({
ttl:'Basic',
abstract: '{{expression}}',
exp: 'Sitting on a {{cereal}}, waiting for the {{vehicle}} to come.',
data: {cereal:'corn flake', vehicle:'van'}
})

output += codeblock({
ttl:'Nested data source',
exp: 'Add some {{recipes.fav.ingredient}}, slap it in the oven, you got yourself a {{recipes.fav.name}}, baby.',
data: {recipes:{fav:{name:'cake', ingredient:'water'}}}
})

output += codeblock({
ttl:'Object template type',
exp: {statement1:'I like {{recipes.fav.fullname}}', statement2:'I like {{recipes.fav.name}}'},
data: {recipes:{fav:{name:'cake', fullname:'chocolate cake'}}}
})

output += codeblock({
ttl:'Recursive data',
exp: {statement1:'I like {{recipes.fav.fullname}}', statement2:'I like {{recipes.fav.name}}'},
data: {recipes:{fav:{name:'cookies', fullname:'chocolate {{recipes.fav.name}}'}}},
info: 'Templates will keep processing until all expressions are resolved.'
})


output += h3('Optionals');


output += codeblock({
ttl:'Optional expression',
abstract: '{{expression?}}',
exp: 'One. Two. {{three?}}',
data: {},
info: 'If the expression is not set then it will not output and will not throw an error.'
})


output += codeblock({
ttl:'Fallback expression',
abstract: '{{expA??expB??expC}}',
exp: 'Hello {{nickname??firstName}}',
data: {firstName:'Laurence'},
info: 'If the first expression isn\'t set the second (and third etc) will be used.'
})

output += h3('Conditionals and logic');


output += codeblock({
ttl:'Conditional if',
abstract: '{{if expBool}}{{/if}}',
exp: '{{if weather.isSunny}}Is is sunny{{/if}}',
data: {weather: {isSunny: true}}
})


output += codeblock({
ttl:'Conditional else',
abstract: '{{if expBool}}{{else}}{{/if}}',
exp: 'Is is currently {{if weather.isSunny}}sunny{{else}}overcast{{/if}}',
data: {weather: {isSunny: true}}
})

output += codeblock({
ttl:'Conditional elseif',
abstract: '{{if expBoolA}}{{elseif expBoolB}}{{else}}{{/if}}',
exp: 'The weather is {{if weather.isSunny}}sunny{{elseif weather.isRainy}}rainy{{elseif weather.isChilly}}cold{{else}}no weather info{{/if}}',
data: {weather: {isRainy: true, isSunny:false, isChilly:false}}
});

output += codeblock({
ttl:'Conditional optional',
abstract: '{{if exp?}}{{else}}{{/if}}',
exp: '{{if temp?}}Got temp: {{temp}}°{{else}}No temp data{{/if}}',
data: {temp:30}
})


output += codeblock({
ttl:'Ternary operator',
abstract: '{{expressionBool?expA:expB}}',
exp: 'Don\'t forget your {{weather.isRainy?packItem.rainy:packItem.sunny}}',
data: {weather:{isRainy:true},packItem:{sunny:'hat',rainy:'umbrella'}}
})


output += codeblock({
ttl:'!Not boolean',
abstract: '{{!expressionBool}}',
exp: 'Don\'t forget your {{if !weather.isRainy}}{{packItem.sunny}}{{else}}{{packItem.rainy}}{{/if}}',
data: {weather:{isRainy:true},packItem:{sunny:'hat',rainy:'umbrella'}}
})

output += codeblock({
ttl:'Relational operators',
data: {pets:{dog:{age:4},cat:{age:7}}},
exp: '{{if pets.dog.age>pets.cat.age}}Dog is older{{else}}Cat is older{{/if}}',
info: 'Supported operators inlcude `==`,`!=`,`>`,`>=`,`<`,`<=`'
})

output += h3('Constants');

output += codeblock({
ttl:'String constant',
abstract: '{{\'str\'}}',
exp: 'Hello {{nickname??\'there\'}}',
data: {},
info: 'Note: Double quotes are not supported.'
})

output += codeblock({
ttl:'Boolean constant',
abstract: '{{true|false}}',
exp: 'Hello {{if true}}there{{/if}}',
data: {}
})

output += codeblock({
ttl:'Floating point constant',
exp: 'The temp is {{isSunny?31.31:8.08}}°',
data: {isSunny: true}
})

output += codeblock({
ttl:'Resolving numerical expressions',
exp: '5+22-7 = {{5+22-7}}',
data: {},
info: 'Note: brackets not currently supported'
})



output += h3('Looping data');


output += codeblock({
ttl:'Array loop',
abstract: '{{each exps as exp}}{{/each}}',
exp: '{{each names as name}}{{name}},{{/each}}',
data:{names:['Fred','Barney','Wilma']}
})

output += codeblock({
ttl:'Array loop with indexes',
abstract: '{{each exps as index,exp}}{{/each}}',
exp: '{{each names as ele,name}}[{{ele}}]={{name}},{{/each}}',
data:{names:['Fred','Barney','Wilma']}
})

output += codeblock({
ttl:'Object loop',
abstract: '{{each exps as exp}}{{/each}}',
exp: '{{each animals as sound}}{{sound}},{{/each}}',
data: {animals:{dog:'woof',cat:'meow',bird:'tweet'}}
})

output += codeblock({
ttl:'Object loop with props',
abstract: '{{each exps as prop,exp}}{{/each}}',
exp: '{{each animals as animal,sound}}{{animal}}s go {{sound}}, {{/each}}',
data: {animals:{dog:'woof',cat:'meow',bird:'tweet'}}
})

output += codeblock({
ttl:'Object loop with props and index',
abstract: '{{each exps as index,prop,exp}}{{/each}}',
exp: '{{each animals as index,animal,sound}}({{index}}){{animal}}s go {{sound}}{{/each}}', //{{if !ISLAST}},{{else}}.{{/if}}
data: {animals:{dog:'woof',cat:'meow',bird:'tweet'}}
})

output += h3('Working with arrays and objects');

output += codeblock({
ttl:'Array length',
abstract: '{{arrExp.length}}',
exp: '{{if names.length==3}}Three\'s a crowd{{/if}}',
data:{names:['Fred','Barney','Wilma']}
})

output += codeblock({
ttl:'Object length',
abstract: '{{objExp.length}}',
exp: '{{if animals.length==3}}Three\'s a crowd{{/if}}',
data: {animals:{dog:'woof',cat:'meow',bird:'tweet'}}
})

output += codeblock({
ttl:'Array by [index]',
abstract: '{{arrExp[index]}}',
exp: '#1 is {{names[0]}}',
data:{names:['Fred','Barney','Wilma']}
})

output += codeblock({
ttl:'Nice array output',
exp: '{{each names as index,name}}{{name}}{{if index==names.length-2}} and {{elseif index<names.length-1}}, {{/if}}{{/each}}.',
data:{names:['Fred','Barney','Wilma']}
})

output += h3('Filters');
output += '\nA filter is a function that modifies the data sent to it. Eg. `{{expression(filter)}}`.  \nFilters are applied according to the type of data sent to it.'


output += codeblock({
ttl:'Int - $currency',
abstract: '{{centsExp($currency)}}',
exp: '{{cents}} cents is {{cents($currency)}}',
data: {cents:1012344}
})


output += codeblock({
ttl:'Date - readable',
abstract: '{{dateExp(readable)}}',
exp: 'It is {{now(readable)}}',
data: {now:new Date()},
dataDisplay: '{now:new Date()};'
})

output += codeblock({
ttl:'Chaining filters',
abstract: '{{dateExp(filter1,filter2,etc)}}',
exp: '{{msg(uppercase,hyphenate)}}',
data: {msg:'Green eggs and ham'}
})

jnr.registerFilter('int', 'x1000', function(int){
  return int*1000;
});

var precode = ["jnr.registerFilter('int', 'x1000', function(int){","  return int*1000;","});"];
output += codeblock({
ttl:'Registering a filter',
precode: precode.join('\n') ,
abstract: 'jnr.registerFilter(dataType, filterName, filterFunction)',
exp: 'Result is {{hiscore(x1000)}}',
info: '|dataType| must be one of (`*`,`int`,`float`,`str`,`date`,`obj`,`arr`)  \nWildcard `*` filters will be applied to any data and take precedence to other filters of the same name.\n The return datatype does not have to match the incoming.',
data: {hiscore:123}
})

jnr.registerFilter('*', 'toString', function(anyValue){
  return String(anyValue);
});

jnr.registerFilter('str', 'spaced', function(str){
  return str.split('').join(' ')
});

var precode = ["jnr.registerFilter('*', 'toString', function(anyValue){","  return String(anyValue);","});",""];
precode = precode.concat(["jnr.registerFilter('str', 'spaced', function(str){","  return str.split('').join(' ');","});",""]);
output += codeblock({
ttl:'Registering a wildcard filter',
precode: precode.join('\n') ,
exp: 'Score is {{hiscore(toString,spaced)}}',
data: {hiscore:123456789}
})



jnr.registerFilter('arr', 'oxfordComma', function(arr){
  var clone = arr.slice(0);
  if (clone.length > 1){
    clone[clone.length-1] = 'and ' + clone[clone.length-1];
  }
  return clone.join(', ');
});

var precode = [];
precode.push("jnr.registerFilter('arr', 'oxfordComma', function(arr){");
precode.push("  var clone = arr.slice(0);");
precode.push("  if (clone.length > 1){");
precode.push("    clone[clone.length-1] = 'and ' + clone[clone.length-1];");
precode.push("  }");
precode.push("  return clone.join(', ');");
precode.push("});");
precode.push("");
output += codeblock({
ttl:'Example array filter',
precode: precode.join('\n') ,
exp: '{{names(oxfordComma)}}',
data: {names:['Fred','Barney','Wilma']}
})

//

jnr.registerFilter('obj', 'readable', function(obj){
  return JSON.stringify(obj, null, 2);
});

var precode = [];
precode.push("jnr.registerFilter('obj', 'readable', function(obj){")
precode.push("  return JSON.stringify(obj, null, 2);")
precode.push("});")
precode.push("")
output += codeblock({
ttl:'Example object filter',
precode: precode.join('\n') ,
exp: '{{animals(readable)}}',
data: {animals:{dog:'woof',cat:'meow',bird:'tweet'}}
})

output += h3('Other features');


jnr.setTags('%','%')
output += codeblock({
ttl:'Custom tags',
abstract: 'jnr.setTags(openingTag,closingTag)',
precode: 'jnr.setTags(\'%\',\'%\')',
exp: 'Hello %name% my old friend',
data: {name: 'darkness'}
})
jnr.setTags('{{','}}')










console.log(output)

var readmeMD = fs.readFileSync('../README.md', 'utf8');
var readmeParts = readmeMD.split('<!--readme-->');
var readmeEndParts = readmeParts[1].split('<!--/readme-->');
readmeEndParts[0] = output + '<!--/readme-->';

readmeParts[1] = '<!--readme-->' + readmeEndParts.join('')
fs.writeFileSync('../README.md', readmeParts.join(''));

// ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱

function h3(str){
  return '\n### ' + str;
}

function ttl(msg){

  return '\n' + msg + '\n' + '='.repeat(msg.length);

}

function codeblock(config){

  var md = '';
  md += '\n\n**'+config.ttl+'**';
  if (config.abstract){
    md += ' `' + config.abstract + '`';
  }
  md += '  ';
  if (config.info){
    md += '\n' + config.info;
  }

  md += '\n```node';
  if (config.precode){
    md += '\n' + config.precode;
  }

  if (config.dataDisplay){
    md += '\nvar data = ' + config.dataDisplay;
  } else {
    md += '\nvar data = ' + stringify(config.data) + ';';
  }
  md += '\nvar template = ' + stringify(config.exp) + ';';
  md += '\nvar result = jnr.apply(template, data);';
  md += '\n```';
  var result = jnr.apply(config.exp, config.data)
  md += '\n*result: `'+ stringify(result, true) +'`*'

  return md;

}

function stringify(obj, noQuotesIfString){

    noQuotesIfString = typeof noQuotesIfString !== 'undefined' ? noQuotesIfString : false;
    if (noQuotesIfString && typeof obj == 'string') {
      return obj;
    }
    if(typeof obj !== "object" || Array.isArray(obj)){
        // not an object, stringify using native function
        return parseStringifyOutput(JSON.stringify(obj));
    }
    // Implements recursive object serialization according to JSON spec
    // but without quotes around the keys.
    let props = Object
        .keys(obj)
        .map(key => `${key}:${stringify(obj[key])}`)
        .join(",");

    return parseStringifyOutput(`{${props}}`);
}

function parseStringifyOutput(str){

  //str = str.split('\'').join('__escapedquot__');
  str = str.split('"').join('\'');
  //str = str.split('__escapedquot__').join('\\'+'\'');
  return str;
}
