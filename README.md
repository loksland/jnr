# jnr

jnr is a simple templating engine with some neat features.


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

**Conditional if/else** `{{if expBool}}{{else}}{{/if}}`  
```node
var data = {weather:{isSunny:true}};
var template = 'Is is currently {{if weather.isSunny}}sunny{{else}}overcast{{/if}}';
var result = jnr.apply(template, data);
```
*result: `Is is currently sunny`*

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
### Working with arrays

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

- v0.1.1 - Added some basic documentation
- v0.1.0 - Initial release
