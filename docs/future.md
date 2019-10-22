


if filter data type is `arr!` it will be converted to arr before processing.

 

jnr.registerFilter('arr!', 'oxfordComma', function(arr){ <- If not this data type then will get converted before processing, and won't throw an error.


- - - - - - - - - - - - - - - -

{{each foo as bar}}

{{start}} 
saadsfsadfsadf
{{/start}}

{{inter}} 
saadsfsadfsadf
{{/inter}}

{{end}} 
saadsfsadfsadf
{{/end}}

{{/each}}

- - - - - - - - - - - - - - - -

Should whitespace `all` ignore content inside <pre>,',",`?

```
