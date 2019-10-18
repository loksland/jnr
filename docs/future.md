{{if A}}

  This content
  should loose the indent
  
  {{if B}}
  
    This content
    should loose the indent

  {{/if}}

{{/if}}


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

PROMISES, and:


jnr.registerIncDir(path.join(__dirname,'views','includes');

``` jnr
{{>footer.jnr}}

{{>tpl/footer.jnr}}

{{set data=>footer.yml(yml)}} With promise / async 
```

write?

### Express compatibility

Partial support

More here:
https://expressjs.com/en/guide/using-template-engines.html

See `exports.__express` function here:
https://github.com/pugjs/pug/blob/master/packages/pug/lib/index.js
https://github.com/gsf/whiskers.js/blob/master/lib/__express.js

### Caching

### File in?

```

{{>data}}
```
