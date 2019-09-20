


### Express compatibility

More here:
https://expressjs.com/en/guide/using-template-engines.html

See `exports.__express` function here:
https://github.com/pugjs/pug/blob/master/packages/pug/lib/index.js
https://github.com/gsf/whiskers.js/blob/master/lib/__express.js

### Caching

###Filter blocks

- Applied last

```
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin efficitur dictum nibh, nec finibus mauris ultricies eu. Praesent eget porttitor neque, sit amet eleifend erat.
{{filter(uppercase)}}
Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Nam urna mauris, mollis at neque ut, dictum efficitur ex. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae.
{{/filter}}
Donec finibus lectus leo, eu elementum felis iaculis nec. Fusce ut orci urna. Curabitur iaculis libero in dignissim porta. Proin eget mauris luctus, auctor justo at, vulputate arcu.

```

### File in?

```
jnr.addFileDir('./docs/')
var data = {header: '=header.html'}; // String
var data = {header: '=header.json'}; // <- Will load as object
{{data}}
```
