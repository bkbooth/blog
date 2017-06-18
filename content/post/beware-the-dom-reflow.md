+++
title = "Beware the DOM Reflow"
date = "2014-03-14T17:17:00+10:00"
tags = ["Programming", "CSS"]
draft = false
aliases = ["/beware-the-dom-reflow"]
+++

## TL;DR

Don't *ever* use a [CSS transition][5] with any CSS property that causes a [DOM reflow][4], you will never get smooth transitions, even if you attempt to use a [common hack][7] to force GPU rendering of the transitioning DOM element. Try to use the CSS `transform` property instead of something like `left` or `width` for transitions.


## A little background

I've been working on a mobile app using [Cordova][1] ([PhoneGap][2]) and [AngularJS][3] which has been quite fun to work with so far. I haven't done any proper performance optimising yet, I've just been trying to stay on top of things as I notice them. One particular issue had been bothering me enough that I ended up looking into (and solving) it outside of work.

A little while ago I added a simple CSS slide animation between the app states/views but the animation was terribly choppy when testing in a browser and when testing on my phone (Xperia Z1 which isn't exactly a slow device). It was so bad that there's no way it could be put into a finished app, but I left it in there planning to look into eventually. My suspicion was that it was due to a [DOM reflow][4] but I had thought that the problem was refreshed data coming back from the server mid-animation causing a DOM update, reflow and the choppiness.

Recently I added a slide out menu similar to many modern mobile apps which included another CSS transition, again terribly choppy but this time it was happening on an element that was already in the DOM and was not getting refreshed data from the server each time it appeared. The slide out menu looked great and was behaving just like I'd planned but the animation choppiness was killing it so I had to investigate further.


## A false solution

The first solution I ran into and seemed to be recommended (even if sparingly) by a number of sources was to use a CSS 3D transform that would have no visual effect but would theoretically offload the rendering of that element to the GPU in modern browsers.

```css
transform: translate3D(0, 0, 0);
```

I wasn't really happy with the idea of using a [hack solution][7] but I gave it a try and it didn't even seem to be having any effect in my situation.


## The solution

Finally I came across another explanation that made much more sense, I was transitioning using the `left` CSS property which was triggering a [DOM reflow][4] each time it changed. The solution was to use a [CSS transform][6] properly instead of as a hack, so in my case where I was basically wanting to transition the element along the x-axis I changed my start and end states from:

```css
left: 100%; /* start */
left: 0; /* end */
```

To:

```css
transform: translateX(100%); /* start */
transform: translateX(0); /* end */
```

Notes:

1. You may need to include browser targeted CSS properties such as `-webkit-transform` depending on your application.
2. This also produced the added benefit that I no longer needed to absolutely position the element that I was transitioning.

This produced silky smooth animations in both of my testing environments (browser and phone). Using a combination of the various CSS transforms ([read up on them][6] for more information) and standard CSS properties that do not cause a DOM reflow (such as `opacity`) I've been able to produce a several subtle animations in my app that are also perfectly smooth.

[1]: https://cordova.apache.org "Apache Cordova"
[2]: http://phonegap.com "Adobe PhoneGap"
[3]: http://angularjs.org "AngularJS"
[4]: http://stackoverflow.com/questions/510213/when-does-reflow-happen-in-a-dom-environment "DOM Reflow"
[5]: https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Using_CSS_transitions "CSS Transition"
[6]: https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Using_CSS_transforms "CSS Transform"
[7]: http://stackoverflow.com/questions/10814178/css-performance-relative-to-translatez0 "translate3D hack"
