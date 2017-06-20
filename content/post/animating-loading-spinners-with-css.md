+++
title = "Animating Loading Spinners with CSS"
date = "2017-06-20T22:15:17+10:00"
tags = ["programming", "css"]
image = "/images/2017/06/highres_461629142.jpg"
draft = true
+++

I recently had the privilege of being invited to give my first ever meetup talk at [SydCSS][]. It was a first time speakers night so short talks (5 mins) and high nerves were the order of the day. On a recent side project I had wasted a bunch of time creating a fancy loading spinner while I was mentally blocked trying to solve a real problem. I had the idea at the time that I could probably give a reasonably interesting talk by making some loading animations with CSS and explaining the interesting parts of the [CSS animation][css-animation] API used for each animation. I had a rough plan and a platform, the rest of this article is the transcript of that talk rewritten as a blog post. 

> You can view the [slides][] for the talk [here][slides], take a look and play around with the examples on the slides! The talk was recorded so provided I don't find it unbearably cringeworthy I'll embed it here when it's uploaded.

There are two basic building blocks for [CSS animations][css-animation]. Firstly the [`@keyframes` at-rule][css-keyframes], which you define with the `@keyframes` keyword, then a name or identifier for the keyframes set, then a list of steps which define CSS properties for each step.

```css
@keyframes my-sweet-animation {
    0% { /* ... */ }
   50% { /* ... */ }
  100% { /* ... */ }
}
```

Secondly the [`animation`][css-animation] properties which you can use in shorthand form, or by using individual sub-properties.

```css
@keyframes my-sweet-animation { /* ... */ }

.thing-to-animate {
  /* shorthand */
  animation: 2s my-sweet-animation;

  /* individual sub-properties */
  animation-name: my-sweet-animation;
  animation-duration: 2s;
  animation-timing-function: ease;
}
```

There are 8 `animation` sub-properties and they provide a great deal of flexibility: [`animation-name`](https://developer.mozilla.org/en-US/docs/Web/CSS/animation-name), [`animation-duration`](https://developer.mozilla.org/en-US/docs/Web/CSS/animation-duration), [`animation-delay`](https://developer.mozilla.org/en-US/docs/Web/CSS/animation-delay), [`animation-direction`](https://developer.mozilla.org/en-US/docs/Web/CSS/animation-direction), [`animation-iteration-count`](https://developer.mozilla.org/en-US/docs/Web/CSS/animation-iteration-count), [`animation-timing-function`](https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timing-function), [`animation-fill-mode`](https://developer.mozilla.org/en-US/docs/Web/CSS/animation-fill-mode) and [`animation-play-state`](https://developer.mozilla.org/en-US/docs/Web/CSS/animation-play-state).


## Fading

<p data-height="263" data-theme-id="0" data-slug-hash="WOjvPM" data-default-tab="css,result" data-user="bkbooth" data-embed-version="2" data-pen-title="Fading dot, 3-step @keyframes" class="codepen">See the Pen <a href="https://codepen.io/bkbooth/pen/WOjvPM/">Fading dot, 3-step @keyframes</a> by Ben (<a href="https://codepen.io/bkbooth">@bkbooth</a>) on <a href="https://codepen.io">CodePen</a>.</p>

Starting with a simple fading dot animation, which is just a block with rounded corners where the `opacity` is being faded in and out. I've defined the [`@keyframes` at-rule][css-keyframes] with 3 steps going from completely visible, to completely invisible, then back to completely visible. To use these keyframes to animate the dot, I've used the [`animation`][css-animation] shorthand property to set the `animation-duration` to _1 second_; the `animation-name` to _'fade-in-out'_ which matches the `@keyframes` at-rule; and _'infinite'_ for the `animation-iteration-count`. `animation-iteration-count` can be a number or _'infinite'_ and defaults to _1_. A single pass through the keyframes isn't very useful for loading animations, so I'll be using _'infinite'_ for all of these animations. You can tweak the speed of the animation by modifying the `animation-duration` property which takes seconds or milliseconds values.

<p data-height="265" data-theme-id="0" data-slug-hash="wedKWj" data-default-tab="css,result" data-user="bkbooth" data-embed-version="2" data-pen-title="Fading dot, 2-step @keyframes" class="codepen">See the Pen <a href="https://codepen.io/bkbooth/pen/wedKWj/">Fading dot, 2-step @keyframes</a> by Ben (<a href="https://codepen.io/bkbooth">@bkbooth</a>) on <a href="https://codepen.io">CodePen</a>.</p>

  In this case the [`@keyframes` at-rule][css-keyframes] can be simplified to just the start and end steps by setting the `animation-direction` property to _'alternate'_, which means the animation goes forward through the keyframes steps, then back through in reverse. Now that a full animation loop goes through the keyframes twice, the `animation-duration` should be halved. This approach means that you can define more generic and reusable [`@keyframes` at-rules][css-keyframes]. You may also see _'from'_ and _'to'_ instead of percentages for keyframes steps, these are just aliases for _'0%'_ and _'100%'_ respectively. I personally prefer to stick with percentage steps.


## Spinning

<p data-height="265" data-theme-id="0" data-slug-hash="yXboZM" data-default-tab="css,result" data-user="bkbooth" data-embed-version="2" data-pen-title="Rotating star" class="codepen">See the Pen <a href="https://codepen.io/bkbooth/pen/yXboZM/">Rotating star</a> by Ben (<a href="https://codepen.io/bkbooth">@bkbooth</a>) on <a href="https://codepen.io">CodePen</a>.</p>

Spinners are another simple animation that can be defined easily in CSS. I've introduced the [`transform`][css-transform] property to handle the rotation, [`transform`][css-transform] provides a great toolset of functions for 2D and 3D translating (as in movement), scaling and rotation. The _'rotate'_ [`@keyframes` at-rule][css-keyframes] just sets the starting rotation to _'0deg'_ and the ending rotation to _'360deg'_. I've introduced the `animation-timing-function` property and set it to _'linear'_. `animation-timing-function` defaults to _'ease'_ to ease the animation in and out, this caused the fading dot to "breathe" in and out. If a rotation animation uses _'ease'_ it speeds up and slows down, for rotation you want a nice even _'linear'_ animation.

<p data-height="265" data-theme-id="0" data-slug-hash="RgVZvO" data-default-tab="css,result" data-user="bkbooth" data-embed-version="2" data-pen-title="Rotating concentric circles" class="codepen">See the Pen <a href="https://codepen.io/bkbooth/pen/RgVZvO/">Rotating concentric circles</a> by Ben (<a href="https://codepen.io/bkbooth">@bkbooth</a>) on <a href="https://codepen.io">CodePen</a>.</p>

Using the same rotation [`@keyframes` at-rule][css-keyframes] you can create more complex animations by just combining things we've already looked at. Another value that you can set for the `animation-direction` property is _'reverse'_ which as you can probably guess, plays the keyframes in reverse.

You can use the same `keyframes` to rotate pretty much anything you want...

<p data-height="265" data-theme-id="0" data-slug-hash="awWyeK" data-default-tab="css,result" data-user="bkbooth" data-embed-version="2" data-pen-title="Rotating doge" class="codepen">See the Pen <a href="https://codepen.io/bkbooth/pen/awWyeK/">Rotating doge</a> by Ben (<a href="https://codepen.io/bkbooth">@bkbooth</a>) on <a href="https://codepen.io">CodePen</a>.</p>


## Chasing

<p data-height="265" data-theme-id="0" data-slug-hash="pwPWjw" data-default-tab="css,result" data-user="bkbooth" data-embed-version="2" data-pen-title="Chasing dots, CSS" class="codepen">See the Pen <a href="https://codepen.io/bkbooth/pen/pwPWjw/">Chasing dots, CSS</a> by Ben (<a href="https://codepen.io/bkbooth">@bkbooth</a>) on <a href="https://codepen.io">CodePen</a>.</p>

For this animation I've arranged a series of small dots around a circle and used a similar [`@keyframes` at-rule][css-keyframes] as earlier, fading the dots in and out to _'20%'_ `opacity`. The main [`animation`][css-animation] shorthand property adds nothing new and is being applied to all of the individual dots with an attribute selector. I've set an `animation-delay` for each of the dots to offset each of them starting by an 1/8th of a second. As you can see it's a little tedious having to manually set the offset for each dot, especially if you wanted to change the speed of the whole animation.

<p data-height="265" data-theme-id="0" data-slug-hash="zzwEqa" data-default-tab="css,result" data-user="bkbooth" data-embed-version="2" data-pen-title="Chasing dots, SCSS" class="codepen">See the Pen <a href="https://codepen.io/bkbooth/pen/zzwEqa/">Chasing dots, SCSS</a> by Ben (<a href="https://codepen.io/bkbooth">@bkbooth</a>) on <a href="https://codepen.io">CodePen</a>.</p>

If you're using SASS or something similar, you can improve on this by setting the desired animation speed and the number of dots in variables. Halve the animation speed for the [`animation`][css-animation] property definition. Then loop through the number of dots and calculate the `animation-delay` for each dot using the desired animation speed, number of dots and current iteration variables.


## Bouncing

<p data-height="265" data-theme-id="0" data-slug-hash="owWGGr" data-default-tab="css,result" data-user="bkbooth" data-embed-version="2" data-pen-title="Bouncing dot, single" class="codepen">See the Pen <a href="https://codepen.io/bkbooth/pen/owWGGr/">Bouncing dot, single</a> by Ben (<a href="https://codepen.io/bkbooth">@bkbooth</a>) on <a href="https://codepen.io">CodePen</a>.</p>

This bouncing dot animation uses yet another fairly simple [`@keyframes` at-rule][css-keyframes], it's just using the [`transform`][css-transform] property to translate the dot up, and I'm using _'alternate'_ for the `animation-direction` again. To make it look more "bouncy" I've defined a _'cubic-bezier'_ function for the `animation-timing-function` property. If that looks a little daunting to you, don't worry, I didn't actually write this, and you should never need to write one of these by hand because Chrome (and possibly other browsers?) has an awesome bezier curve editor where you can just drag some dots to visually create the cubic-bezier curve and it will write the cubic-bezier function for you.


![Chrome cubic-bezier editor](/images/2017/06/cubic-bezier.png "Chrome cubic-bezier editor")

<p data-height="265" data-theme-id="0" data-slug-hash="XgReQG" data-default-tab="css,result" data-user="bkbooth" data-embed-version="2" data-pen-title="Bouncing dot, triple" class="codepen">See the Pen <a href="https://codepen.io/bkbooth/pen/XgReQG/">Bouncing dot, triple</a> by Ben (<a href="https://codepen.io/bkbooth">@bkbooth</a>) on <a href="https://codepen.io">CodePen</a>.</p>

Finally, to create this excitedly impatient series of dots, I've defined a slightly more complex [`@keyframes` at-rule][css-keyframes] which performs the translation up and down in just the first 1/3rd of the time. I've also set an `animation-delay` for each of the dots in the series to offset them starting.


## Wrapping Up

Most of this is relatively new to the CSS spec but support in modern browsers is actually really good. Depending what browsers you need to target though you'll get a lot of mileage out of using [autoprefixer](https://github.com/postcss/autoprefixer) to process your CSS and automatically add any required vendor prefixes like `-webkit`, `-moz`, etc.

[![MDN browser support](/images/2017/06/mdn-animations.png "MDN browser support")](https://developer.mozilla.org/en/docs/Web/CSS/animation#Browser_compatibility)

[![Can I use browser support](/images/2017/06/caniuse-animations.png "Can I use browser support")](http://caniuse.com/#feat=css-animation)

MDN is a great learning resources for understanding CSS properties and rules. There's also a really helpful guide on using CSS animations:

* [`@keyframes`][css-keyframes]
* [`animation`][css-animation]
* [Using CSS Animations](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Animations/Using_CSS_animations)


[sydcss]: https://www.meetup.com/SydCSS/
[slides]: http://github.bkbooth.me/sydcss-talk-animations/
[css-animation]: https://developer.mozilla.org/en-US/docs/Web/CSS/animation
[css-keyframes]: https://developer.mozilla.org/en/docs/Web/CSS/@keyframes
[css-transform]: https://developer.mozilla.org/en-US/docs/Web/CSS/transform

<script async src="https://production-assets.codepen.io/assets/embed/ei.js"></script>
