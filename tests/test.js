#! /usr/bin/env node

var jnr = require('../jnr');
var path = require('path');

jnr.registerIncludePath(path.join(__dirname,'inc'));
jnr.registerIncludePath(path.join(__dirname,'inc2'));







var data = {foo:'{{>foo|uppercase}}', bar:'{{>bar}}'};
runTest({
ttl:'Sync include with filters',
exp: `{{>foo.jnr}}{{foo}}{{>bar|lowercase}}{{bar}}`,
data: data,
eq: '(I Am Foo)(I AM FOO)(i am bar)(I Am Bar)'
});



var data = {name:'Keith {{name2}}', name2:'{{name3}}',name3:'Brian'};
runTest({
ttl:'Ensuring conditionals can resolve nested expressions before being evaluated',
exp: `{{if (name|uppercase)=='KEITH BRIAN'}}correct{{/if}}`,
data: data,
eq: 'correct'
});




var data = {name:'Keith {{name2}}', name2:'{{name3}}',name3:'Brian'};
runTest({
ttl:'Ensuring nested expression names are not filtered',
exp: `{{name|uppercase}}`,
data: data,
eq: 'KEITH BRIAN'
});





// Custom test
var title = 'Remove tag whitespace';
var data = {firstName:'Susan',names:['Fred','Barney','Wilma']};
var exp = `          {{set name = 'test'}} 
LINE 1
   {{if true}} 
LINE 2
LINE 2.5
{{/if}}     
LINE 3
{{set captureVal=...|lowercase}}
SET CAPTURE 1
SET CAPTURE 2
{{/set}}
LINE 4
LINE 5
{{filter|uppercase}}
line 6
{{/filter}}    
LINE 7  
{{if firstName=='Susan'}}
Welcome Ken!
{{else}}
You're not Ken!
{{/if}}     
SET CAPTURE:
        {{captureVal}}     
EACH:
{{each names as name}}
{{name}}
{{/each}}
EACH INLINE:
{{each names as name}}{{name}},{{/each}}
NICKNAME: {{nickName?}}
LAST LINE
    {{set name = 'test'}}    
         {{set name = 'test'}} `


console.log('\n`'+title+'` test...');
var result = jnr.render(exp, data, {stripWhitespace:'tags'});
console.log(result.split(' ').join('°').split('\t').join('°'))

var pass = result.split(' ').join('°').split('\t').join('°') == `LINE°1
LINE°2
LINE°2.5
LINE°3
LINE°4
LINE°5
LINE°6
LINE°7°°
Welcome°Ken!
SET°CAPTURE:
set°capture°1
set°capture°2
EACH:
Fred
Barney
Wilma
EACH°INLINE:
Fred,Barney,Wilma,
NICKNAME:°
LAST°LINE`
console.log(exp)
console.log('`' + result + '`')
console.log((pass ? 'OK' : 'FAIL'));
if (!pass){    
  throw new Error('Test failed for `'+exp+'`');
}
jnr.resetOptions();




// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -


jnr.options = {stripWhitespace:'tags'};
var data = {firstName:'Susan',num:5, dataStoredExpression:`VVV
{{set tmp = num}}
^^^`};
runTest({
ttl:'Whitespace with text from data',
exp: `
---
{{dataStoredExpression}}
---
`,
data: data,
eq: function(result){
  return result == '\n---\nVVV\n^^^\n---\n'
}
});
jnr.resetOptions();



jnr.options = {filter:'uppercase'};
var data = {name:'Ken', dataStoredExpression:`lower case {{name}}`};
runTest({
ttl:'Global filter with text from data',
exp: `{{dataStoredExpression}}`,
data: data,
eq: 'LOWER CASE KEN'
});
jnr.resetOptions();





jnr.options = {filter:'uppercase|concat:\'(theend)\''};
var data = {firstName:'Susan'};
runTest({
ttl:'Default option',
exp: `Hi {{firstName}}
Hi {{firstName}}
Hi {{firstName}}
`,
data: data,
eq: function(result){
  return result.split('\n').join('') == 'HI SUSANHI SUSANHI SUSAN(theend)';
}
});
jnr.resetOptions();









// Custom test
var title = 'Remove all whitespace';
var data = {firstName:'Susan'};
var exp = `    {{set name=firstName + 'S'}} {{set name=firstName + 'S'}}
  {{if name=='SusanS'}}   
        hello    


{{/if}}
there     
{{set tmp=123+123}}   



{{set tmp=123+123}}      `;
console.log('\n`'+title+'` test...');
var result = jnr.render(exp, data, {stripWhitespace:true});
var pass = result == 'hello\nthere';
console.log(exp)
console.log('`' + result + '`')
console.log((pass ? 'OK' : 'FAIL'));
if (!pass){    
  throw new Error('Test failed for `'+exp+'`');
}




var data = {firstName:'Susan'};
runTest({
ttl:'If subject with filter',
exp: `{{if (firstName|lowercase)=='susan'}}YES{{/if}}`,
data: data,
eq: 'YES'
});



// Custom test
var title = 'Global string filter';
var data = {firstName:'Susan'};
var exp = `Hi {{firstName}}
Hi {{firstName}}
Hi {{firstName}}
`;
console.log('\n`'+title+'` test...');
var result = jnr.render(exp, data, {filter:'uppercase|concat:\'(theend)\''})
var pass = result.split('\n').join('') == 'HI SUSANHI SUSANHI SUSAN(theend)';
console.log(exp)
console.log(result)
console.log((pass ? 'OK' : 'FAIL'));
if (!pass){    
  throw new Error('Test failed for `'+exp+'`');
}

// Custom test
var title = 'Global string filter to array';
var data = {firstName:'Susan'};
var exp = ['Hi {{firstName}}','Hi {{firstName}}',43]
console.log('\n`'+title+'` test...');
var result = jnr.render(exp, data, {filter:'uppercase|concat:\'(theend)\''})
var pass = result[0] == 'HI SUSAN(theend)' && result[1] == 'HI SUSAN(theend)' && result[2] === 43
console.log(exp)
console.log(result)
console.log((pass ? 'OK' : 'FAIL'));
if (!pass){    
  throw new Error('Test failed for `'+exp+'`');
}


jnr.registerFilter('int', 'plus', function(){
  var result = 0;
  for (var i=0; i < arguments.length; i++) {
      result += arguments[i];
  }
  return result;  
});
var data = {name:'Ken'}
runTest({
ttl:'Register filter',
exp: '{{5|plus:95}}',
data: data,
eq: '100'
});


runTest({
ttl:'Ensuring maths function commas aren\'t mistaken for filter argument commas',
exp: '{{270|plus:Math.atan2(10, 0) * 180 / Math.PI}}',
data: data,
eq: '360'
});



var data = {name:'Ken'}
runTest({
ttl:'Maths functions',
exp: '{{Math.atan2(10, 0) * 180 / Math.PI}}',
data: data,
eq: '90'
});





var data = {name:'Ken'}
runTest({
ttl:'Double filters in an expression',
exp: '{{(name|uppercase)+(name|lowercase)}}',
data: data,
eq: 'KENken'
});

var data = {price_cents_ex:1848, tax_rate:.1}
runTest({
ttl:'Inline bracket calculations and Maths operations',
exp: `Price: {{'$' + Math.round(price_cents_ex*(1+tax_rate))/100 + " inc tax"}}`,
data: data,
eq: 'Price: $20.33 inc tax'
});


var data = {name:'Ken'}
runTest({
ttl:'Filter capture with arguments',
exp: `{{filter|concat:' Jones'}}Hi {{name}}{{/filter}}`,
data: data,
eq: 'Hi Ken Jones'
});


var data = {name:'Ken'}
runTest({
ttl:'Capture set with filter arguments',
exp: `{{set captureVal=...|concat:' Jones'}}Hi {{name}}{{/set}}{{captureVal}}`,
data: data,
eq: 'Hi Ken Jones'
});


var data = {name:'Ken',nameB:'Mary'}
runTest({
ttl:'Filter with multiple arguments',
exp: `{{name|concat:'Dingo','Egg',nameB}}`,
data: data,
eq: 'KenDingoEggMary'
});


var data = {name:'Ken'}
runTest({
ttl:'Simple set with filter arguments',
exp: `{{set myvar=name|concat:'Dingo'}}{{myvar}}`,
data: data,
eq: 'KenDingo'
});



var data = {name:'Ken'}
runTest({
ttl:'Filter | with ||',
exp: `{{name=='Ken'||name=='Mary'?'yes':'no'|uppercase}}`,
data: data,
eq: 'YES'
});

var data = {name:'Ken'}
runTest({
ttl:'Filter in a bracket',
exp: '{{(name|uppercase) + \'Surname\'}}',
data: data,
eq: 'KENSurname'
});


var data = {name:'Ken'}
runTest({
ttl:'Double question mark string',
exp: '{{name + \'??what\'}}',
data: data,
eq: 'Ken??what'
});


var data = {name:'Ken'}
runTest({
ttl:'Operation strings ',
exp: '{{name + \'==,!=,>,>=,<,<=\' + "==,!=,>,>=,<,<=" }}',
data: data,
eq: 'Ken==,!=,>,>=,<,<===,!=,>,>=,<,<='
});

var data = {num:30}
runTest({
ttl:'Brackets',
exp: '{{(num-28)*(num+3)}}',
data: data,
eq: '66'
});

var data = {num:6}
runTest({
ttl:'Brackets with filters',
exp: '{{set num=(60*((num*2+8)/10))|minsToHrs}}{{num}}',
data: data,
eq: '2hrs'
});

var data = {num:30}
runTest({
ttl:'Set with brackets with filters',
exp: '{{(num-28)*(num+3)-6|minsToHrs}}',
data: data,
eq: '1hr'
});

var data = {num:4}
runTest({
ttl:'Math constants',
exp: '{{num + Math.round(Math.PI)}}',
data: data,
eq: '7'
});


var data = {name:'Ken'}
runTest({
ttl:'Single quote escaping',
exp: `{{name + "'s"}}`,
data: data,
eq: `Ken's`
});

var data = {name:'Ken'}
runTest({
ttl:'Double quote escaping',
exp: `{{'"' + name + '"'}}`,
data: data,
eq: `"Ken"`
});

var data = {name:'Ken',nameB:'Jenny\'s'}
runTest({
ttl:'Single quote escaping with slashes',
exp: `{{name + ' single quote\\'s ' + nameB}}`,
data: data,
eq: 'Ken single quote\'s Jenny\'s'
});


var data = {name:'Ken',nameB:"Jenny\"s"}
runTest({
ttl:'Double quote escaping with slashes',
exp: `{{name + " double \\"quote\\" " + nameB}}`,
data: data,
eq: "Ken double \"quote\" Jenny\"s"
});


var data = {mins:20}
runTest({
ttl:'Modulo operation',
exp: '{{mins%3}}',
data: data,
eq: '2'
})


var data =  {mins:20}
runTest({
ttl:'Spacing in expression and filter',
exp: '{{mins + 100| minsToHrs }}',
data: data,
eq: '2hrs'
})


// Custom test
var title = 'YAML filter - loading inline data and getting data';
var exp = `{{set myInlineVar=...|yaml}}
men: [John Smith, Bill Jones]
women:
  - Mary Smith
  - {{firstName}} Williams{{/set}}:P`;
var data = {firstName:'Susan'};
console.log('\n`'+title+'` test...');
var result = jnr.render(exp, data, {returnData:true})
console.log(result.data)
var pass = result.data.myInlineVar.women[1] == 'Susan Williams'
console.log(data)
console.log(exp)
console.log(result.rendered)
console.log((pass ? 'OK' : 'FAIL'));
if (!pass){    
  throw new Error('Test failed for `'+exp+'`');
}


jnr.registerFilter('arr', 'oxfordComma', function(arr){
  var clone = arr.slice(0);
  if (clone.length > 1){
    clone[clone.length-1] = 'and ' + clone[clone.length-1];
  }
  return clone.join(', ');
});
var data = {names:['Fred','Barney','Wilma']}
runTest({
ttl:'Register filter',
exp: '{{names|oxfordComma}}',
data: data,
eq: 'Fred, Barney, and Wilma'
})


jnr.registerFilter('arr', 'sep', function(arr, seperator){
  return arr.join(seperator);
});
var data = {names:['Fred','Barney','Wilma']}
runTest({
ttl:'Register filter with args',
exp: '{{names|sep:\'$\'}}',
data: data,
eq: 'Fred$Barney$Wilma'
})


var data =  {num:1}
runTest({
ttl:'Object expression with common edited data',
exp: {foo:'{{num}}', bar:'{{set num=num+1}}{{num}}', jo:'{{set num=num+1}}{{num}}'},
data: data,
eq: function(res){
  return res.foo == '1' && res.bar == '2' && res.jo == '3'
}
})


var data = {title:'Welcome!'}
runTest({
ttl:'YAML filter - loading inline data',
exp: `{{set data=...|yaml}}
men: [John Smith, Bill Jones]
women:
  - Mary Smith
  - Susan Williams{{/set}}#w1:{{data.women.1}}`,
data: data,
eq: '#w1:Susan Williams'
})


var data = {title:'Welcome!'}
runTest({
ttl:'Markdown filter (md) - multiline',
exp: '{{filter|md}}### {{title}}\nThis is *rendered* as **HTML**.{{/filter}}',
data: data,
eq: '<h3>Welcome!</h3>\n<p>This is <em>rendered</em> as <strong>HTML</strong>.</p>\n'
})

var data = {title:'Welcome'}
runTest({
ttl:'Markdown filter (md) - single line',
exp: '{{filter|md}}{{title}}, this is *rendered* as **HTML**.{{/filter}}',
data: data,
eq: 'Welcome, this is <em>rendered</em> as <strong>HTML</strong>.'
})

var data = {msg:'ok'};
runTest({
ttl:'Filter blocks',
exp: '{{filter|uppercase}}This should be upper case. {{msg}}{{/filter}}',
data: data,
eq: 'THIS SHOULD BE UPPER CASE. OK'
})


var data = {num:1};
runTest({
ttl:'Comment blocks',
exp: 'Pre comment,{{/'+'* {{if num==1}} Number is one {{/if}} *'+'/}} post comment{{/'+'* num is {{num}} {{/if}} *'+'/}}.',
data: data,
eq: 'Pre comment, post comment.'
})


var data = {num:1};
runTest({
ttl:'Var set',
exp: '{{num}}{{set num=num+1}}{{num}}{{set num=num+1}}{{num}}',
data: data,
eq: '123'
})

var data = {people:[{name:'ken'},{name:'wilma'}]};
runTest({
ttl:'Var set with dot notation',
exp: '{{set people.1.name=\'barney\'}}{{each people as person}}{{person.name}},{{/each}}',
data: data,
eq: 'ken,barney,'
})

var data = {name:'ken'};
runTest({
ttl:'Block capture',
exp: '{{set myvar=...|uppercase}}My name is {{name}}{{/set}}Uppercase is {{myvar}}',
data: data,
eq: 'Uppercase is MY NAME IS KEN'
})

var data = {number:10};
runTest({
ttl:'Number and constant calculations',
exp: 'Number plus one is {{number+1}}',
data: data,
eq: 'Number plus one is 11'
})

var data = {number:10};
runTest({
ttl:'Number and complex constant calculations',
exp: 'Number resolves to {{number+10-40}}',
data: data,
eq: 'Number resolves to -20'
})

var data = {petowners:[{name:'fred', pets:['dog','cat']},{name:'barney', pets:['goat']}]};
runTest({
ttl:'Loop within a loop',
exp: '{{each petowners as petowner}}{{petowner.name}} has {{each petowner.pets as pet}}a {{pet}}, {{/each}}{{/each}}',
data: data,
eq: 'fred has a dog, a cat, barney has a goat, '
})

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

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

console.log(ttl('Filters'));



var data = {mins:150};
runTest({
ttl:'int: minsToHrs',
exp: '{{mins|minsToHrs}}',
data: data,
eq: '2.5hrs'
})

var data = {cents:1434231};
runTest({
ttl:'int: currency',
exp: '${{cents|currency}}',
data: data,
eq: '$14,342.31'
})



var data = {now:new Date()};
runTest({
ttl:'date: readable',
exp: '{{now|readable}}',
data: data,
eq: function(res){
  return res.length > 10
}
})

var data = {phoneNum:'0412 123 123'};
runTest({
ttl:'str: phoneAuHref',
exp: 'Call me on <a href="{{phoneNum|phoneAuHref}}" >{{phoneNum}}</a>',
data: data,
eq: 'Call me on <a href="+6412123123" >0412 123 123</a>'
})

var data = {phoneNum:'0412 123 123'};
runTest({
ttl:'str: slugify',
exp: 'Call me on {{phoneNum|slugify}}',
data: data,
eq: 'Call me on 0412-123-123'
})

var data = {phoneNum:'0412 123 123'};
runTest({
ttl:'str: nbsp',
exp: 'Call me on {{phoneNum|nbsp}}',
data: data,
eq: 'Call me on 0412&nbsp;123&nbsp;123'
})



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


var title = 'Async includes with filters';
var data = {foo:'{{>foo|uppercase}}', bar:'{{>bar}}'};
var exp = ` {{>foo.jnr}}{{foo}}{{>bar|lowercase}}{{bar}}`;
console.log('\n`'+title+'` test...');
var result = jnr.renderPromise(exp, data).then(function (render){
  var pass = render = '(I Am Foo)(I AM FOO)(i am bar)(I Am Bar)';
  console.log((pass ? 'OK' : 'FAIL'));
  return pass;
}, function(error){
  throw new Error('Test failed for `'+exp+'`');
}).then(function(pass){
  
  if (pass){    
    console.log('\nALL PASS\n');
  }
  
})

// ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱ ✱


function ttl(msg){

  return '\n' + msg + '\n' + '='.repeat(msg.length);

}

function runTest(config){

  console.log('\n`'+config.ttl+'` test...');
  var result = jnr.render(config.exp, config.data)
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


