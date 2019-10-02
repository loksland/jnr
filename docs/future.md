
Remove whitespace


FILTERS NEED TAKE ARGUMENTS
- Separate filters to new .js src file



{{var.path|filterA:argA|filterB:argC|filterF:argB,'constant',argF+243}}   
Accept eval

Call filter as first expression
{{filterA:'43'}} <- First filter arg will be null
{{filterA}} <- just call a filter with no arg

jnr.render can accept option of filters to apply to the result?

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
