# Filters

### Included filters 


**date.readable**

Outputs supplied native date object as readable date and time.

```node
{now:new Date()}
```
```node
It is {{now(readable)}}
```
```node
`It is October 1st 2019, 12:09:05pm`
```

**int.$currency**   

Outputs supplied cents as dollars with dollar sign and thousand commas.
```node 
{cents:1012344}
```
```node
{{cents}} cents is {{cents($currency)}}
```
```node 
1012344 cents is $10,123.44
```

**int.minsToHrs**

Output supplied minutes as hours to 2 decimal points with `hr/s` appended.

```node 
{mins:1245}
```
```node
{{mins(minsToHrs)}}
```
```node 
20.75hrs
```

**str.yaml**   

Converts supplied YAML string to object, using the [js-yaml](https://www.npmjs.com/package/js-yaml) library.
```node 
{{set myInlineVar=...(yaml)}}
men: [John Smith, Bill Jones]
women:
  - Mary Smith
  - Wilma Williams
{{/set}}

{{myInlineVar.women[1]}}
```
```node 
Wilma Williams
```

**str.md**   

Converts supplied markdown string to HTML string, using the [markdown-it](https://www.npmjs.com/package/markdown-it) library. If the supplied string has line breaks, the result will be wrapped in a p tag.
```node 
{{filter(md)}}{{title}}, this is *rendered* as **HTML**.{{/filter}}
```
```node 
Welcome, this is <em>rendered</em> as <strong>HTML</strong>.
```

**arr.sentence**

Outputs supplied array as a list sentence.

```node 
{ turtles: [ 'Donatello', 'Raphael', 'Michaelangelo', 'Leonardo' ] }
```
```node 
{{turtles(sentence)}}
```
```node 
Donatello, Raphael, Michaelangelo and Leonardo
```



### Registering custom filters 

Custom filters can be registered using `jnr.registerFilter(%data_type%, %filter_name%, %filter_function%)`.

Filters are called depending on the data type being supplied to it. 

This way the data type being supplied to the filter is strictly enforced. It also allows the same filter name to be handled separately for different data types Eg. `dateVar(readable)` will be a different function to `currencyVar(readable)`.

Supported data types are represented by the following strings. The return datatype does not have to match the incoming.

- `*`
- `int`
- `float`
- `str`
- `date`
- `obj`
- `arr`

Wildcard `*` filters will be applied to any data and take precedence to other filters of the same name. 

```node
jnr.registerFilter('arr', 'oxfordComma', function(arr){
  var clone = arr.slice(0);
  if (clone.length > 1){
    clone[clone.length-1] = 'and ' + clone[clone.length-1];
  }
  return clone.join(', ');
});
```

```node 
{{names(oxfordComma)}}
```
```node 
Fred, Barney, and Wilma
```
