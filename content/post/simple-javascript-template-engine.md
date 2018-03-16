+++
title = "Simple JavaScript template engine"
date = "2013-12-30T00:11:00+10:00"
tags = ["programming", "javascript"]
aliases = ["/simple-javascript-template-engine"]
+++

Around 6 months ago while learning JavaScript properly and looking for work as a JavaScript developer I started working on a pure HTML/CSS/JS version of Tetris ([BlockDrop](https://blockdrop.benbooth.co) - [github](https://github.com/bkbooth/BlockDrop)) to experiment and play with my new skills. It's been a while since I've touched it but I just started looking at it again recently and there's quite a lot that I'd do differently now so I started rewriting it from the ground up. I haven't got that far with the actual rewrite but one of the things I really wanted to do differently and therefore implemented it first was a simple templating engine so that I could get all the HTML out of my JavaScript.


## Setting up a module

First things first, another issue I wanted to resolve from my original BlockDrop implementation was to make the code a little more modular so here's a little boilerplate I've been using to setup my modules.

```javascript
var TemplateEngine = (function() {
  // private stuff here
  var private;

  return {
  // public stuff in here
  public: function() { /* ... */ }
  };
})();
```

All we're doing here is putting the module into an [IIFE](http://en.wikipedia.org/wiki/Immediately-invoked_function_expression) (immediately-invoked function expression) and assigning it to the global TemplateEngine variable.


## Loading local files

The first thing the template engine needs to be able to do is load the HTML templates/partials. The way I chose to do this was using an `XMLHttpRequest`, to get this to work you'll need your templates to be served by some kind of web server.

```javascript
var TemplateEngine = (function() {
  var xhr = new XMLHttpRequest();

  return {
    load: function(fileName) {
      var contents = "";
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
          contents = xhr.responseText;
        }
      };
      xhr.open("GET", fileName, false);
      xhr.send();

      return contents;
    }
  }
})();
```

This is all pretty straight-forward if you've done any work with AJAX in native JS, we're basically just setting up an XHR object and returning the contents of the requested file as a string. One thing to note here is the third `false` parameter to the `xhr.open()` call, this means we're not actually doing an [asynchronous request](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest#open()). Since we're just requesting local files this shouldn't cause much delay, also for my particular application all of the templates will be loaded once during the first initialisation. For a more robust solution you might want to keep the request asynchronous and return a promise instead of the actual file contents.


## Caching loaded templates

For my application the most common template I'll be using are the actual pieces (shapes of 4 blocks). We wouldn't want to make a new XHR every time we need a new piece, especially since my current implementation doesn't make the requests asynchronously. A simple solution is to store loaded templates into a cache object the first time they're loaded and then simply retrieve them from the cache for subsequent requests. We can even take advantage of `localStorage` to cache the templates in the user's browser for future usage. Here's my modifications to include caching.

```javascript
var TemplateEngine = (function() {
  var xhr = new XMLHttpRequest(),
  cache = JSON.parse(
    localStorage.getItem("yourapp.cache.template")
  ) || {};

  return {
    load: function(fileName) {
      var contents = cache[Utils.hashCode(fileName)];
      if (!contents) {
        contents = "";
        // XHR unchanged from previous step

        cache[Utils.hashCode(fileName)] = contents;
        localStorage.setItem(
          "yourapp.cache.template",
          JSON.stringify(cache)
        );
      }
      return contents;
    }
  }
})();
```

We try to initialise our cache object from `localStorage` but if it doesn't exist yet we intialise it to an empty object. You can use whatever key you want when getting the cache object, just make sure you use the same key when setting the cache later. `Utils.hashCode()` is just a simple hashing function that I [borrowed](http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/). I chose to use a hash because the template key in the cache object needs to be unique and needs to be based on the template filename so we can retrieve it when requesting the same filename later.


## Simple tag replacements

The most basic thing we'll need to do with a template engine is find and replace data from the template file with our actual application data. I opted for double-curlies (eg. `{{ dataItem }}`) in the templates to define areas that should be replaced with application data. In JavaScript the simplest way to represent this is an object where the key matches the double-curly bracket fields in the template and the value is the actual data you want inserted (eg. `{ dataItem: "dataValue" }`).

```javascript
var replaceTags = function(templateString, replaceMap) {
  return templateString.replace(
    /\{\{\s*([a-zA-Z0-9\.\$_]+)\s*\}\}/g,
    function(match, p1) {
      return replaceMap[p1] !== void 0 ?
        replaceMap[p1] : "";
    }
  );
};
```

The heavy-lifting here is all done with a `RegExp` String replace. I won't go into the details of regular expressions here but it's worth noting that my allowed character set `[a-zA-Z0-9\.\$_]` might be too restrictive or too liberal for your application, I've been modifying this set as needed. We're capturing the set and can access it as the 2nd parameter in the replace function.


## Parsing the transformed string

Now that we've got a string representing some HTML which has all of the template tags replaced with actual application data we'll want to parse it into a DOM object so that we can add it into an application's DOM. There's some existing functionality to handle that.

```javascript
var TemplateEngine = (function() {
  // ...
  var parser = DOMParser();
  // ...
  var parse = function(templateString) {
    return parser.parseFromString(
      templateString,
      "text/xml"
    ).childNodes[0];
  };
})();
```

The `parseFromString()` function provided by `DOMParser()` returns a root DOM node so we'll need to get the first child node of the returned object so that we can attach that node into an application's DOM.


## Moving forward

What I've detailed here was my starting point but I've since found the need for my template engine to be able to handle loops which adds some more complexity which I won't cover here. I also refactored a little so that `load()`, `transform()` (which calls `replaceTags()` as well as handling repeating sections in the templates) and `parse()` are all private functions of the `TemplateEngine` object. The only public functions are `get()` and `getString()` which both load and transform the templates, `get()` additionally parses the strings while `getString()` does not, this was required so that I could use templates within templates.
