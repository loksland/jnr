#! /usr/bin/env node


var jnr = require('../jnr');


console.log(ttl('Basics'));

var data = {name:'Laurence'};
runTest({
ttl:'Basic',
exp: 'My name is {{name}}',
data: data,
eq: 'My name is Laurence'
})


var data = {fav: {col:'#FF3300'}};
runTest({
ttl:'Data depth',
exp: 'My favorite color is {{fav.col}}',
data: data,
eq: 'My favorite color is #FF3300'
})

var data = {all: { time: {fav: {col:'#FF3300'}}}};
runTest({
ttl:'Data depth deep',
exp: 'My favorite color is {{all.time.fav.col}}',
data: data,
eq: 'My favorite color is #FF3300'
})


var data = {action:'scream'}
runTest({
ttl:'Array template',
exp: ['I {{action}}','You {{action}}'],
data: data,
eq: function(res){
  return res[0] == 'I scream' && res[1] == 'You scream'
}
})

var data = {action:'rock'}
runTest({
ttl:'Object template',
exp: {fred:'I {{action}}', barney: 'I {{action}} too'},
data: data,
eq: function(res){
  return res.fred == 'I rock' && res.barney == 'I rock too'
}
})

console.log(ttl('Optionals'));

var data = {firstName:'Laurence'};
runTest({
ttl:'Optional fallback',
exp: 'My name is {{nickname??firstName}}',
data: data,
eq: 'My name is Laurence'
})

var data = {nickname:'Laurie'};
runTest({
ttl:'Optional fallback exists',
exp: 'My name is {{nickname??firstName}}',
data: data,
eq: 'My name is Laurie'
})

var data = {surname:'Fishburne'};
runTest({
ttl:'Optional fallback chain',
exp: 'My name is {{nickname??firstName??surname}}',
data: data,
eq: 'My name is Fishburne'
})

var data = {extraX:'Three'};
runTest({
ttl:'Optional output',
exp: 'One. Two. {{extra?}}',
data: data,
eq: 'One. Two. '
})

var data = {extra:'Three.'};
runTest({
ttl:'Optional output exists',
exp: 'One. Two. {{extra?}}',
data: data,
eq: 'One. Two. Three.'
})


console.log(ttl('Ternary Logic'));

var data = {isSunny: false, pack: {rainy:'raincoat',sunny:'hat'}};
runTest({
ttl:'Ternary logic',
exp: 'Pack a {{isSunny?pack.sunny:pack.rainy}}',
data: data,
eq: 'Pack a raincoat'
})
data.isSunny = true
runTest({
ttl:'Ternary logic inverse',
exp: 'Pack a {{isSunny?pack.sunny:pack.rainy}}',
data: data,
eq: 'Pack a hat'
})

var data = {isSunny: true, pack: {rainy:'raincoat',sunny:'hat'}};
runTest({
ttl:'Ternary with otional fallback',
exp: 'Pack a {{isHot??isSunny?pack.sunny:pack.rainy}}',
data: data,
eq: 'Pack a hat'
})

var data = {isSunny: false, pack: {rainy:'raincoat',sunny:'hat'}};
runTest({
ttl:'Ternary with otional advanced',
exp: 'Pack a {{isWarm??isHot??isSunny?pack.hot??pack.sunny:packx.mild??pack.rainy}}',
data: data,
eq: 'Pack a raincoat'
})


console.log(ttl('Literals'));


var data = {isSunny: true};
runTest({
ttl:'Literal string',
exp: 'I say {{isSunny?\'YAY\':\'NAY\'}}',
data: data,
eq: 'I say YAY'
})

var data = {isSunny: false};
runTest({
ttl:'Literal int',
exp: 'The temp is {{isSunny?31:8}}°',
data: data,
eq: 'The temp is 8°'
})

var data = {isSunny: true};
runTest({
ttl:'Literal float',
exp: 'The temp is {{isSunny?31.31:8.08}}°',
data: data,
eq: 'The temp is 31.31°'
})

var data = {};
runTest({
ttl:'Literal numeric expression',
exp: '5+22-7 = {{5+22-7}}',
data: data,
eq: '5+22-7 = 20'
})

var data = {fruitA:'Apple', fruitB:'Banana'};
runTest({
ttl:'Literal bool',
exp: 'The chosen fruit is {{true?fruitA:fruitB}}',
data: data,
eq: 'The chosen fruit is Apple'
})

var data = {fruitA:'Apple', fruitB:'Banana'};
runTest({
ttl:'Literal bool false',
exp: 'The chosen fruit is {{false?fruitA:fruitB}}',
data: data,
eq: 'The chosen fruit is Banana'
})


console.log(ttl('Conditionals'));


var data = {isSunny: true};
runTest({
ttl:'Conditional',
exp: '{{if isSunny}}Is is sunny{{/if}}',
data: data,
eq: 'Is is sunny'
})

var data = {weather: {isSunny: true}};
runTest({
ttl:'Conditional nested',
exp: '{{if weather.isSunny}}Is is sunny{{/if}}',
data: data,
eq: 'Is is sunny'
})

var data = {isSunny: false};
runTest({
ttl:'Conditional not',
exp: '{{if !isSunny}}Is is raining{{/if}}',
data: data,
eq: 'Is is raining'
})

var data = {isSunny: true};
runTest({
ttl:'Conditional else',
exp: '{{if isSunny}}Is is sunny{{else}}Is is raining{{/if}}',
data: data,
eq: 'Is is sunny'
})

var data = {id: false, age: 20};
runTest({
ttl:'Conditional elseif',
exp: '{{if id}}ID check{{elseif age>=18}}Welcome{{else}}No entry{{/if}}',
data: data,
eq: 'Welcome'
})

var data = {isSunny: false};
runTest({
ttl:'Conditional else alt',
exp: '{{if isSunny}}Is is sunny{{else}}Is is raining{{/if}}',
data: data,
eq: 'Is is raining'
})

var data = {isSunny: true};
runTest({
ttl:'Conditional optional resolve',
exp: '{{if isHot??isSunny}}Is is sunny{{/if}}',
data: data,
eq: 'Is is sunny'
})

var data = {isSunny: true, result: {yay:true, nay:false}};
runTest({
ttl:'Conditional with ternary',
exp: '{{if isSunny?result.yay:result.nay}}Is is sunny{{/if}}',
data: data,
eq: 'Is is sunny'
})

var data = {temp:30};
runTest({
ttl:'Conditional optional resolve',
exp: '{{if temp?}}Got temp: {{temp}}°{{/if}}',
data: data,
eq: 'Got temp: 30°'
})

var data = {}
runTest({
ttl:'Conditional optional resolve alt',
exp: '{{if temp?}}Got temp: {{temp}}°{{else}}No weather data.{{/if}}',
data: data,
eq: 'No weather data.'
})

var data = {};
runTest({
ttl:'Conditional optional resolve not',
exp: '{{if !temp?}}Temp not found.{{/if}}',
data: data,
eq: 'Temp not found.'
})


console.log(ttl('Equations'));

var data = {age:100};
runTest({
ttl:'Relational operator ==',
exp: 'I am {{age==100?\'one-hundred\':age}}', // Bug: doesn't recognise if spaces
data: data,
eq: 'I am one-hundred'
})

var data = {age:99};
runTest({
ttl:'Relational operator !=',
exp: 'I am {{age!=100?\'not\':\'\'}} one-hundred',
data: data,
eq: 'I am not one-hundred'
})

var data = {age:18};
runTest({
ttl:'Relational operator >',
exp: 'I am {{age>17?\'indeed\':\'not\'}} an adult',
data: data,
eq: 'I am indeed an adult'
})

var data = {age:10};
runTest({
ttl:'Relational operator <',
exp: 'I am {{age<18?\'indeed\':\'not\'}} a kid',
data: data,
eq: 'I am indeed a kid'
})

var data = {age:18};
runTest({
ttl:'Relational operator >=',
exp: 'I am {{age>=18?\'indeed\':\'not\'}} an adult',
data: data,
eq: 'I am indeed an adult'
})

var data = {age:17};
runTest({
ttl:'Relational operator <=',
exp: 'I am {{age<=17?\'indeed\':\'not\'}} a kid',
data: data,
eq: 'I am indeed a kid'
})

console.log(ttl('Loops'));


var data = {nums:[0,1,2,3,4,5,6,7,8]};
runTest({
ttl:'Array loop',
exp: '{{each nums as num}}{{num}},{{/each}}',
data: data,
eq: '0,1,2,3,4,5,6,7,8,'
})


var data = {names:['Fred','Barney','Wilma'],name:'Johnny'};
runTest({
ttl:'Array loop with overwrite prop',
exp: '{{each names as name}}{{name}},{{/each}}{{name}}',
data: data,
eq: 'Fred,Barney,Wilma,Johnny'
})

var data = {nested: {nums:[0,1,2,3]}};
runTest({
ttl:'Array loop resolved expression',
exp: '{{each nested.nums as num}}{{num}},{{/each}}',
data: data,
eq: '0,1,2,3,'
})

var data = {nested: {nums:[0,1,2,3]}};
runTest({
ttl:'Array loop with optional fallback expression',
exp: '{{each nonesuch??nested.nums as num}}{{num}},{{/each}}',
data: data,
eq: '0,1,2,3,'
})

var data = {names:['Fred','Barney','Wilma']};
runTest({
ttl:'Array loop with named indexes',
exp: '{{each names as index,name}}{{index}}:{{name}},{{/each}}',
data: data,
eq: '0:Fred,1:Barney,2:Wilma,'
})




var data = {animals:{dog:'woof',cat:'meow',bird:'tweet'}};
runTest({
ttl:'Object loop',
exp: '{{each animals as sound}},{{sound}}{{/each}}',
data: data,
eq: ',woof,meow,tweet'
})

var data = {scores:{Fred:8,Barney:4,Wilma:5}};
runTest({
ttl:'Object loop with named props',
exp: '{{each scores as name,score}}{{name}} got {{score}},{{/each}}',
data: data,
eq: 'Fred got 8,Barney got 4,Wilma got 5,'
})

var data = {scores:{Fred:8,Barney:4,Wilma:5}, num:100};
runTest({
ttl:'Object loop with overwrite named props',
exp: '{{each scores as index,num}}{{index}} got {{num}},{{/each}}{{num}}',
data: data,
eq: 'Fred got 8,Barney got 4,Wilma got 5,100'
})

var data = {animals:{dog:'woof',cat:'meow',bird:'tweet'}};
runTest({
ttl:'Loop with nested conditional and literal',
exp: '{{each animals as animal,sound}}{{if animal==\'cat\'}}Cat says {{sound}}{{/if}}{{/each}}',
data: data,
eq: 'Cat says meow'
})

console.log(ttl('Misc'));

var data = {animals:{dog:'woof',cat:'meow',bird:'tweet, tweet'}};
runTest({
ttl:'Literal with space',
exp: '{{each animals as animal,sound}}{{if sound==\'tweet, tweet\'}}Might be a bird{{/if}}{{/each}}',
data: data,
eq: 'Might be a bird'
})

/*
Ternarys do not accept spacing in literals
var data = {isTrue:true};
runTest({
ttl:'Ternary literal with space',
exp: '{{isTrue?\'Y A Y\':\'NAY\'}}',
data: data,
eq: 'Y A Y'
})
*/


console.log(ttl('Filters'));

var data = {mins:150};
runTest({
ttl:'int: minsToHrs',
exp: '{{mins(minsToHrs)}}',
data: data,
eq: '2.5hrs'
})

var data = {cents:1434231};
runTest({
ttl:'int: currency',
exp: '${{cents(currency)}}',
data: data,
eq: '$14,342.31'
})


var data = {now:new Date()};
runTest({
ttl:'date: filename',
exp: '{{now(filename)}}',
data: data,
eq: function(res){
  return res.length == 10 && res.charAt(4) == '-' && res.charAt(7) == '-';
}
})

runTest({
ttl:'date: readable',
exp: '{{now(readable)}}',
data: data,
eq: function(res){
  return res.length > 10
}
})

var data = {phoneNum:'0412 123 123'};
runTest({
ttl:'str: phoneAuHref',
exp: 'Call me on <a href="{{phoneNum(phoneAuHref)}}" >{{phoneNum}}</a>',
data: data,
eq: 'Call me on <a href="+6412123123" >0412 123 123</a>'
})

var data = {phoneNum:'0412 123 123'};
runTest({
ttl:'str: slugify',
exp: 'Call me on {{phoneNum(slugify)}}',
data: data,
eq: 'Call me on 0412-123-123'
})

var data = {phoneNum:'0412 123 123'};
runTest({
ttl:'str: nbsp',
exp: 'Call me on {{phoneNum(nbsp)}}',
data: data,
eq: 'Call me on 0412&nbsp;123&nbsp;123'
})

console.log(ttl('Adding filters'));

console.log(ttl('Recursive tag identification'));

var data = {red:'#FF3300', fav: {col:'{{red}}'}};
runTest({
ttl:'Depth 1',
exp: 'My favorite color is {{fav.col}}',
data: data,
eq: 'My favorite color is #FF3300'
})

var data = {red:'{{redHex}}', fav: {col:'{{red}}'}, redHex: '#FF3300'};
runTest({
ttl:'Depth 2',
exp: 'My favorite color is {{fav.col}}',
data: data,
eq: 'My favorite color is #FF3300'
})

console.log(ttl('Tags'));

jnr.setTags('<<<','>>>')
var data = {name:'Laurence'};
runTest({
ttl:'Custom tags',
exp: 'My name is <<<name>>>',
data: data,
eq: 'My name is Laurence'
})

jnr.setTags('%','%')
var data = {name:'Laurence'};
runTest({
ttl:'Same tag',
exp: 'My name is %name%',
data: data,
eq: 'My name is Laurence'
})

jnr.setTags('|','|')
var data = {name:'Laurence'};
runTest({
ttl:'Regex conflicting tags',
exp: 'My name is |name|',
data: data,
eq: 'My name is Laurence'
})

jnr.setTags('*','^')
var data = {name:'Laurence'};
runTest({
ttl:'Regex conflicting tags',
exp: 'My name is *name^',
data: data,
eq: 'My name is Laurence'
})

jnr.setTags(null, null)
var data = {name:'Laurence'};
runTest({
ttl:'Default tags',
exp: 'My name is {{name}}',
data: data,
eq: 'My name is Laurence'
})
// ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱

function ttl(msg){

  return '\n' + msg + '\n' + '='.repeat(msg.length);

}

function runTest(config){

  console.log('\n`'+config.ttl+'` test...');
  var result = jnr.apply(config.exp, config.data)
  var pass;
  if (typeof config.eq == 'function'){
    pass = config.eq(result);
  } else {
    pass = result == config.eq;
  }
  console.log(config.data)
  console.log(config.exp)
  console.log(result)
  console.log((pass ? 'OK' : 'FAIL'));
  if (!pass){
    throw new Error('Test failed for `'+config.exp+'`');
  }

}
