# jnr

A simple and powerful templating engine that supports:
 - optional chaining
 - conditional logic
 - nested data sources
 - non-string templates
 - ternary operators
 - looping control flow 
 - [custom processing filters](FILTERS.md)
 - expression evaluation
 - block capture

### Installation

```bash
$ npm install jnr
```

```node
var jnr = require('jnr');
```

### Basics

Use the `render` function to apply tags in the template with supplied data.

```node
var result = jnr.render(template, data);
```

Wrap variable names in `{{` double curly brackets `}}`.

```
{{page.greeting}} 
```
```
Welcome
```

### Conditionals

Conditional logic is defined by `if`, `elseif` and `else` tags.

```
{{if user.logged_in}}
  Log out
{{else}}
  Log in
{{/if}}
```
```
Log out  
```

### Loops

The `each` ... `as` tag is used to loop arrays and objects.

```
{{each pets as pet}}
- {{pet.name}} ${{pet.price}}
{{/each}} 
```
``` 
- Hamster $25.95
- Guinea Pig $18.80
- Parrot $23.33
```

Object property names can be accessed by supplying a second property.
```
{ scores: { Fred: 8, Barney: 4, Wilma: 5 } }
```
```
{{each scores as name,score}}
- {{name}} got {{score}}
{{/each}}
```
``` 
- Fred got 8
- Barney got 4
- Wilma got 5
```

Array indexes can be accessed the same way.
```
{ names: [ 'Fred', 'Barney', 'Wilma' ] }
```
```
{{each names as index,name}}
{{index}}) {{name}}
{{/each}}
```
```
0) Fred
1) Barney
2) Wilma
```


### Optionals 

If the expression is followed by a `?` and it is not defined, it will not output and will not throw an error.

```
Hello {{username?}}
```
```
Hello
```

### Conditional optional 

Optionals can also be used to test conditional statements.

```
{{if user.cart?}}  
  View cart ({{user.cart.length}})
{{else}}
  Log in to view cart
{{/if}} 
```

```
View cart (5)
```

### Optional chains  

Optional variables can be chained using double quotes `??`.   
If the first expression isn't set the second (and third etc) will be used.

```
Oh hi {{user.nickname??user.firstname??user.surname}}
```
```
Oh hi Marcus
```

### Ternary logic 

Ternary operators can be used for shorthand conditional output.

```
Don't forget your {{weather.isRainy?packItem.rainy:packItem.sunny}}
```

```
Don't forget your umbrella
```

### Relational operators

Supported operators inlcude `==`,`!=`,`>`,`>=`,`<`,`<=`

```
{{if user.cart.length > 0}}  
  View cart ({{user.cart.length}})
{{else}}
  Cart is empty
{{/if}} 
```
```
Cart is empty
```
### Filters 

A filter is a function that modifies the data sent to it. Eg. `{{variable(%filter_name%)}}`.  
Filters are applied according to the type of data sent to it.

```
{{cents}} cents is {{cents($currency)}}
```

```
1012344 cents is $10,123.44
```

Separate successive filters with a comma `,` and they will be applied in order.

```
{{message(uppercase,hyphenate)}}
```
```
GREEN-EGGS-AND-HAM
```

Read more advanced filter operations [here](FILTERS.md).

### Filtering output 

Output blocks can have a filter applied using the `filter(%filter_name%)` tag.

```
{{filter(md)}}
### {{title}}
This is *rendered* as **HTML**.
{{/filter}}
```

```
<h3>Welcome!</h3>
<p>This is <em>rendered</em> as <strong>HTML</strong>.</p>
```

### Evaluating expressions 

Complex expressions are safely resolved using [safe-eval](https://www.npmjs.com/package/safe-eval) library.

Brackets, maths functions, filters, single and double quotes and variable names are all supported. 
```
{price_cents_ex:1848, tax_rate:.1}
```
```
Price: {{'$' + Math.round(price_cents_ex*(1+tax_rate))/100 + " inc tax"}}
```
```
price: $20.33 inc tax
```


### Setting variables

Variables can be set using the `set` tag. Dot syntax is supported.

```
{cart:[{price:1.32},{price:2.33},{price:5.43}]}
```
```
{{set cart_total=0}}
{{each cart as item}}
  {{set cart_total=cart_total + item.price}}
{{/each}}
Total: {{'$' + cart_total}}
```
```
Total: $9.08
```

### Capturing blocks
Blocks of the template can be captured to a variable using `set %var_name%=...(%filters%)`.

```
{{set receipt=...(uppercase)}}
  {{set cart_total=0}}
  {{each cart as index,item}}
    {{set cart_total=cart_total + item.price}}
    Item {{index+1}} price is {{'$' + item.price}}
  {{/each}}
  Total is {{'$' + cart_total}}
{{/set}}

{{receipt}}
```

```
ITEM 1 PRICE IS $1.32
ITEM 2 PRICE IS $2.33
ITEM 3 PRICE IS $5.43
TOTAL IS $9.08
```

### Loading data from template 

Access to variables set in the template can be obtained by using the option property `returnAlteredData`. 

```node 
jnr.render(template, data, {returnAlteredData:true})
```

If set to true the function will return an object with 2 properties:
- `render.result` the result of the render
- `render.data` a copy of the supplied data object including any `set` variables

``` 
{{set inlineMeta=...(yaml)}}
men: [John Smith, Bill Jones]
women:
  - Mary Smith
  - {{firstName}} Williams
{{/set}}
```

```node
var result = jnr.render(exp, data, {returnAlteredData:true});
console.log(result.data.inlineMeta.men[1]);
```

```
Bill Jones
```

### Custom tags

Custom template tags can be defined using `jnr.setTags(%opening_tag%,%closing_tag%)`  

```node
jnr.setTags('%','%')
```
```
%page.greeting% 
```
```
Welcome
```

### Release history
- v0.1.12 - Major update, set, set capture blocks, deep eval, documentation update.
- v0.1.10 - Switched to async file operations
- v0.1.7 - Improved documentation
- v0.1.6 - Updated dependencies
- v0.1.5 - Improved documentation
- v0.1.4 - `registerFilter()` added with new datatypes `*`, `arr` and `obj`
- v0.1.3 - `elseif` added
- v0.1.2 - More documentation, added index access `[]`, mixed numeric and constant eval
- v0.1.1 - Added some basic documentation
- v0.1.0 - Initial release
