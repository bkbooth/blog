+++
title = "Animating Loading Spinners With CSS"
date = "2017-06-20T22:15:17+10:00"
tags = ["programming", "css"]
image = "/images/2017/06/highres_461629142.jpg"
draft = true
+++

I recently had the privilege of being invited to give my first ever meetup talk at [SydCSS][]. It was a first time speakers night so short talks (5 mins) and high nerves were the order of the day. On a side project recently I had wasted a bunch of time creating a fancy loading spinner while I was mentally blocked trying to solve a real problem, I had the idea at the time that I could probably give a reasonably interesting talk by making some loading animations with CSS and explaining the interesting parts of the [CSS animation][css-animation] API used for each animation. I had a rough plan and a platform, the rest of this article is the transcript of the talk rewritten as a blog post. 

> You can view the [slides][] for the talk [here][slides], take a look and play around with the examples on the slides! The talk was recorded so provided I don't find it unbearably cringeworthy I'll embed it here when it's uploaded.

There are two basic building blocks for [CSS animations][css-animation]. Firstly the [`@keyframes` at-rule][css-keyframes], which you define with the `@keyframes` keyword, then a name or identifier for the keyframes set, then a list of steps which define CSS properties for each step.

```css
@keyframes my-sweet-animation {
    0% { /* ... */ }
   50% { /* ... */ }
  100% { /* ... */ }
}
```

Secondly the [`animation` properties][css-animation] which you can use in shorthand form, or by using individual sub-properties.

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


## Animation 1 - fading

<p data-height="263" data-theme-id="0" data-slug-hash="WOjvPM" data-default-tab="css,result" data-user="bkbooth" data-embed-version="2" data-pen-title="WOjvPM" class="codepen">See the Pen <a href="https://codepen.io/bkbooth/pen/WOjvPM/">WOjvPM</a> by Ben (<a href="https://codepen.io/bkbooth">@bkbooth</a>) on <a href="https://codepen.io">CodePen</a>.</p>

Starting with a simple fading dot animation, which is just a square with rounded corners where the `opacity` is being faded in and out. I've defined the [`@keyframes` at-rule][css-keyframes] with 3 steps going from completely visible, to completely invisible, then back to completely visible. To use these keyframes to animate the dot, I've used the [`animation`][css-animation] shorthand property to set the `animation-duration` to 1 second; the `animation-name` to _'fade-in-out'_ which matches `@keyframes` at-rule; and _'infinite'_ for the `animation-iteration-count`. `animation-iteration-count` can be a number or _'infinite'_ and defaults to 1. A single pass through the keyframes isn't very useful for loading animations, so I'll be using 'infinite' for all of these animations. You can tweak the speed of the animation by modifying the `animation-duration` property which takes seconds or milliseconds values.

<p data-height="265" data-theme-id="0" data-slug-hash="wedKWj" data-default-tab="css,result" data-user="bkbooth" data-embed-version="2" data-pen-title="wedKWj" class="codepen">See the Pen <a href="https://codepen.io/bkbooth/pen/wedKWj/">wedKWj</a> by Ben (<a href="https://codepen.io/bkbooth">@bkbooth</a>) on <a href="https://codepen.io">CodePen</a>.</p>

  In this case the [`@keyframes` at-rule][css-keyframes] can be simplified to just the start and end steps by setting the `animation-direction` property to _'alternate'_, which means the animation goes forward through the keyframes steps, then back through in reverse. Now that a full animation loop goes through the [`@keyframes`] twice, the `animation-duration` should be halved. This approach means that you can define more generic and reusable [`@keyframes` at-rules][css-keyframes]. You may also see _'from'_ and _'to'_ instead of percentages for keyframes steps, these are just aliases for _'0%'_ and _'100%'_ respectively. I personally prefer to stick with percentage steps.


[sydcss]: https://www.meetup.com/SydCSS/
[slides]: http://github.bkbooth.me/sydcss-talk-animations/
[css-animation]: https://developer.mozilla.org/en-US/docs/Web/CSS/animation
[css-keyframes]: https://developer.mozilla.org/en/docs/Web/CSS/@keyframes
[using-css-animations]: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Animations/Using_CSS_animations

<script async src="https://production-assets.codepen.io/assets/embed/ei.js"></script>
