# Filters


A filter is a function that modifies the data sent to it, filters are separated by the pipe `|` character.   
`{{variable|filterName}}`
    
Filters are applied according to the type of data sent to it.

```
{cents:1012344}
```

```
{{cents}} cents is {{cents|$currency}}
```

```
1012344 cents is $10,123.44
```

Separate successive filters with pipe char `|` and they will be applied in order.

```
{{message|uppercase|hyphenate)}}
```
```
GREEN-EGGS-AND-HAM
```

Extra arguments can be supplied to the filter using the following format:  

`{{variable|filterName1:extraArg1,extraArg2|filterName2:extraArg1,extraArg2}}`
 
Eg:
```
{name:'Ken',surname:'Jones'}}
```

```
{{name|concat:'-',surname|lowercase}}
```

```
ken-jones
```



### Included filters 


**date.readable**

Outputs supplied native date object as readable date and time.

```
{now:new Date()}
```
```
It is {{now|readable}}
```
```
`It is October 1st 2019, 12:09:05pm`
```

**date.format**

Pass a format string to output the date, using the [moment](https://www.npmjs.com/package/moment) library.

```
{now:new Date()}
```
```
It is {{now|format:'YYYY-MM-DD'}}
```
```
`2019-10-23`
```


**int.$currency**   

Outputs supplied cents as dollars with dollar sign and thousand commas.
```
{cents:1012344}
```
```
{{cents}} cents is {{cents|$currency}}
```
``` 
1012344 cents is $10,123.44
```

**int.minsToHrs**

Output supplied minutes as hours to 2 decimal points with `hr/s` appended.

``` 
{mins:1245}
```
```
{{mins|minsToHrs}}
```
``` 
20.75hrs
```

**str.concat**   

Concatenates string with extra arguments suppplied to the filter.
``` 
{{firstname|concat:'-',surname}}'
```
``` 
Ken-James
```

**str.yaml**   

Converts supplied YAML string to object, using the [js-yaml](https://www.npmjs.com/package/js-yaml) library.
``` 
{{set myInlineVar=...|yaml}}
men: [John Smith, Bill Jones]
women:
  - Mary Smith
  - Wilma Williams
{{/set}}

{{myInlineVar.women[1]}}
```
``` 
Wilma Williams
```

**str.md**   

Converts supplied markdown string to HTML string, using the [markdown-it](https://www.npmjs.com/package/markdown-it) library. If the supplied string has line breaks, the result will be wrapped in a p tag.
``` 
{{filter|md}}{{title}}, this is *rendered* as **HTML**.{{/filter}}
```
``` 
Welcome, this is <em>rendered</em> as <strong>HTML</strong>.
```

**arr.sentence**

Outputs supplied array as a list sentence.

``` 
{ turtles: [ 'Donatello', 'Raphael', 'Michaelangelo', 'Leonardo' ] }
```
``` 
{{turtles|sentence}}
```
``` 
Donatello, Raphael, Michaelangelo and Leonardo
```

### Registering custom filters 

Custom filters can be registered using `jnr.registerFilter(%data_type%, %filter_name%, %filter_function%)`.

Filters are called depending on the data type being supplied to it. 

This way the data type being supplied to the filter is strictly enforced. It also allows the same filter name to be handled separately for different data types Eg. `dateVar|readable` will be a different function to `currencyVar|readable`.

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

``` 
{{names|oxfordComma}}
```
``` 
Fred, Barney, and Wilma
```

### Global filters

Apply global render filters using the option properties `filter` and `stringFilter`. 

- `filter` will apply to the top level template only. (This may not be a string)
- `stringFilter` will be applied to every string value that is rendered.

```node 
jnr.render(template, data, {filter:'reverse|sentence',stringFilter:'clean|md'})
```

