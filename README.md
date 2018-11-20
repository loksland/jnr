# jnr

A simple and powerful templating system supporting conditional logic, optional chaining, nested data sources, non string templates, ternary operators, looping control flow and custom processing functions.

Install jnr
-----------

```bash
$ npm install jnr
```

```node
var jnr = require('jnr');
```

<!--readme-->
### Substitution

**Basic** `{{expression}}`  
```node
var data = {cereal:'corn flake',vehicle:'van'};
var template = 'Sitting on a {{cereal}}, waiting for the {{vehicle}} to come.';
var result = jnr.apply(template, data);
```
*result: `Sitting on a corn flake, waiting for the van to come.`*

**Nested data source**  
```node
var data = {recipes:{fav:{name:'cake',ingredient:'water'}}};
var template = 'Add some {{recipes.fav.ingredient}}, slap it in the oven, you got yourself a {{recipes.fav.name}}, baby.';
var result = jnr.apply(template, data);
```
*result: `Add some water, slap it in the oven, you got yourself a cake, baby.`*

**Object template type**  
```node
var data = {recipes:{fav:{name:'cake',fullname:'chocolate cake'}}};
var template = {statement1:'I like {{recipes.fav.fullname}}',statement2:'I like {{recipes.fav.name}}'};
var result = jnr.apply(template, data);
```
*result: `{statement1:'I like chocolate cake',statement2:'I like cake'}`*

**Recursive data**  
Templates will keep processing until all expressions are resolved.
```node
var data = {recipes:{fav:{name:'cookies',fullname:'chocolate {{recipes.fav.name}}'}}};
var template = {statement1:'I like {{recipes.fav.fullname}}',statement2:'I like {{recipes.fav.name}}'};
var result = jnr.apply(template, data);
```
*result: `{statement1:'I like chocolate cookies',statement2:'I like cookies'}`*
### Optionals

**Optional expression** `{{expression?}}`  
If the expression is not set then it will not output and will not throw an error.
```node
var data = {};
var template = 'One. Two. {{three?}}';
var result = jnr.apply(template, data);
```
*result: `One. Two. `*

**Fallback expression** `{{expA??expB??expC}}`  
If the first expression isn't set the second (and third etc) will be used.
```node
var data = {firstName:'Laurence'};
var template = 'Hello {{nickname??firstName}}';
var result = jnr.apply(template, data);
```
*result: `Hello Laurence`*
### Conditionals and logic

**Conditional if** `{{if expBool}}{{/if}}`  
```node
var data = {weather:{isSunny:true}};
var template = '{{if weather.isSunny}}Is is sunny{{/if}}';
var result = jnr.apply(template, data);
```
*result: `Is is sunny`*

**Conditional else** `{{if expBool}}{{else}}{{/if}}`  
```node
var data = {weather:{isSunny:true}};
var template = 'Is is currently {{if weather.isSunny}}sunny{{else}}overcast{{/if}}';
var result = jnr.apply(template, data);
```
*result: `Is is currently sunny`*

**Conditional elseif** `{{if expBoolA}}{{elseif expBoolB}}{{else}}{{/if}}`  
```node
var data = {weather:{isRainy:true,isSunny:false,isChilly:false}};
var template = 'The weather is {{if weather.isSunny}}sunny{{elseif weather.isRainy}}rainy{{elseif weather.isChilly}}cold{{else}}no weather info{{/if}}';
var result = jnr.apply(template, data);
```
*result: `The weather is rainy`*

**Conditional optional** `{{if exp?}}{{else}}{{/if}}`  
```node
var data = {temp:30};
var template = '{{if temp?}}Got temp: {{temp}}°{{else}}No temp data{{/if}}';
var result = jnr.apply(template, data);
```
*result: `Got temp: 30°`*

**Ternary operator** `{{expressionBool?expA:expB}}`  
```node
var data = {weather:{isRainy:true},packItem:{sunny:'hat',rainy:'umbrella'}};
var template = 'Don't forget your {{weather.isRainy?packItem.rainy:packItem.sunny}}';
var result = jnr.apply(template, data);
```
*result: `Don't forget your umbrella`*

**!Not boolean** `{{!expressionBool}}`  
```node
var data = {weather:{isRainy:true},packItem:{sunny:'hat',rainy:'umbrella'}};
var template = 'Don't forget your {{if !weather.isRainy}}{{packItem.sunny}}{{else}}{{packItem.rainy}}{{/if}}';
var result = jnr.apply(template, data);
```
*result: `Don't forget your umbrella`*

**Relational operators**  
Supported operators inlcude `==`,`!=`,`>`,`>=`,`<`,`<=`
```node
var data = {pets:{dog:{age:4},cat:{age:7}}};
var template = '{{if pets.dog.age>pets.cat.age}}Dog is older{{else}}Cat is older{{/if}}';
var result = jnr.apply(template, data);
```
*result: `Cat is older`*
### Constants

**String constant** `{{'str'}}`  
Note: Double quotes are not supported.
```node
var data = {};
var template = 'Hello {{nickname??'there'}}';
var result = jnr.apply(template, data);
```
*result: `Hello there`*

**Boolean constant** `{{true|false}}`  
```node
var data = {};
var template = 'Hello {{if true}}there{{/if}}';
var result = jnr.apply(template, data);
```
*result: `Hello there`*

**Floating point constant**  
```node
var data = {isSunny:true};
var template = 'The temp is {{isSunny?31.31:8.08}}°';
var result = jnr.apply(template, data);
```
*result: `The temp is 31.31°`*

**Resolving numerical expressions**  
Note: brackets not currently supported
```node
var data = {};
var template = '5+22-7 = {{5+22-7}}';
var result = jnr.apply(template, data);
```
*result: `5+22-7 = 20`*
### Looping data

**Array loop** `{{each exps as exp}}{{/each}}`  
```node
var data = {names:['Fred','Barney','Wilma']};
var template = '{{each names as name}}{{name}},{{/each}}';
var result = jnr.apply(template, data);
```
*result: `Fred,Barney,Wilma,`*

**Array loop with indexes** `{{each exps as index,exp}}{{/each}}`  
```node
var data = {names:['Fred','Barney','Wilma']};
var template = '{{each names as ele,name}}[{{ele}}]={{name}},{{/each}}';
var result = jnr.apply(template, data);
```
*result: `[0]=Fred,[1]=Barney,[2]=Wilma,`*

**Object loop** `{{each exps as exp}}{{/each}}`  
```node
var data = {animals:{dog:'woof',cat:'meow',bird:'tweet'}};
var template = '{{each animals as sound}}{{sound}},{{/each}}';
var result = jnr.apply(template, data);
```
*result: `woof,meow,tweet,`*

**Object loop with props** `{{each exps as prop,exp}}{{/each}}`  
```node
var data = {animals:{dog:'woof',cat:'meow',bird:'tweet'}};
var template = '{{each animals as animal,sound}}{{animal}}s go {{sound}}, {{/each}}';
var result = jnr.apply(template, data);
```
*result: `dogs go woof, cats go meow, birds go tweet, `*

**Object loop with props and index** `{{each exps as index,prop,exp}}{{/each}}`  
```node
var data = {animals:{dog:'woof',cat:'meow',bird:'tweet'}};
var template = '{{each animals as index,animal,sound}}({{index}}){{animal}}s go {{sound}}{{/each}}';
var result = jnr.apply(template, data);
```
*result: `(0)dogs go woof(1)cats go meow(2)birds go tweet`*
### Working with arrays and objects

**Array length** `{{arrExp.length}}`  
```node
var data = {names:['Fred','Barney','Wilma']};
var template = '{{if names.length==3}}Three's a crowd{{/if}}';
var result = jnr.apply(template, data);
```
*result: `Three's a crowd`*

**Object length** `{{objExp.length}}`  
```node
var data = {animals:{dog:'woof',cat:'meow',bird:'tweet'}};
var template = '{{if animals.length==3}}Three's a crowd{{/if}}';
var result = jnr.apply(template, data);
```
*result: `Three's a crowd`*

**Array by [index]** `{{arrExp[index]}}`  
```node
var data = {names:['Fred','Barney','Wilma']};
var template = '#1 is {{names[0]}}';
var result = jnr.apply(template, data);
```
*result: `#1 is Fred`*

**Nice array output**  
```node
var data = {names:['Fred','Barney','Wilma']};
var template = '{{each names as index,name}}{{name}}{{if index==names.length-2}} and {{elseif index<names.length-1}}, {{/if}}{{/each}}.';
var result = jnr.apply(template, data);
```
*result: `Fred, Barney and Wilma.`*
### Filters
A filter is a function that modifies the data sent to it. Eg. `{{expression(filter)}}`.  
Filters are applied according to the type of data sent to it.

**Int - $currency** `{{centsExp($currency)}}`  
```node
var data = {cents:1012344};
var template = '{{cents}} cents is {{cents($currency)}}';
var result = jnr.apply(template, data);
```
*result: `1012344 cents is $10,123.44`*

**Date - readable** `{{dateExp(readable)}}`  
```node
var data = {now:new Date()};
var template = 'It is {{now(readable)}}';
var result = jnr.apply(template, data);
```
*result: `It is November 7th 2018, 3:00:35pm`*

**Chaining filters** `{{dateExp(filter1,filter2,etc)}}`  
```node
var data = {msg:'Green eggs and ham'};
var template = '{{msg(uppercase,hyphenate)}}';
var result = jnr.apply(template, data);
```
*result: `GREEN-EGGS-AND-HAM`*

**Registering a filter** `jnr.registerFilter(dataType, filterName, filterFunction)`  
|dataType| must be one of (`*`,`int`,`float`,`str`,`date`,`obj`,`arr`)  
Wildcard `*` filters will be applied to any data and take precedence to other filters of the same name.
 The return datatype does not have to match the incoming.
```node
jnr.registerFilter('int', 'x1000', function(int){
  return int*1000;
});
var data = {hiscore:123};
var template = 'Result is {{hiscore(x1000)}}';
var result = jnr.apply(template, data);
```
*result: `Result is 123000`*

**Registering a wildcard filter**  
```node
jnr.registerFilter('*', 'toString', function(anyValue){
  return String(anyValue);
});

jnr.registerFilter('str', 'spaced', function(str){
  return str.split('').join(' ');
});

var data = {hiscore:123456789};
var template = 'Score is {{hiscore(toString,spaced)}}';
var result = jnr.apply(template, data);
```
*result: `Score is 1 2 3 4 5 6 7 8 9`*

**Example array filter**  
```node
jnr.registerFilter('arr', 'oxfordComma', function(arr){
  var clone = arr.slice(0);
  if (clone.length > 1){
    clone[clone.length-1] = 'and ' + clone[clone.length-1];
  }
  return clone.join(', ');
});

var data = {names:['Fred','Barney','Wilma']};
var template = '{{names(oxfordComma)}}';
var result = jnr.apply(template, data);
```
*result: `Fred, Barney, and Wilma`*

**Example object filter**  
```node
jnr.registerFilter('obj', 'readable', function(obj){
  return JSON.stringify(obj, null, 2);
});

var data = {animals:{dog:'woof',cat:'meow',bird:'tweet'}};
var template = '{{animals(readable)}}';
var result = jnr.apply(template, data);
```
*result: `{
  "dog": "woof",
  "cat": "meow",
  "bird": "tweet"
}`*
### Other features

**Custom tags** `jnr.setTags(openingTag,closingTag)`  
```node
jnr.setTags('%','%')
var data = {name:'darkness'};
var template = 'Hello %name% my old friend';
var result = jnr.apply(template, data);
```
*result: `Hello darkness my old friend`*<!--/readme-->

### Release history
- v0.1.5 - Improved documentation
- v0.1.4 - `registerFilter()` added with new datatypes `*`, `arr` and `obj`
- v0.1.3 - `elseif` added
- v0.1.2 - More documentation, added index access `[]`, mixed numeric and constant eval
- v0.1.1 - Added some basic documentation
- v0.1.0 - Initial release
