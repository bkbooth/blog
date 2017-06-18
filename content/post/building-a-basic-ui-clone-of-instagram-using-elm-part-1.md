+++
title = "Building a basic UI-clone of Instagram using Elm - Part 1"
date = "2016-12-01T13:14:00+10:00"
tags = ["Programming", "Elm", "Functional"]
draft = false
aliases = ["/building-a-basic-ui-clone-of-instagram-using-elm-part-1"]
hjsExtraLanguages = ["elm"]
+++

I've had a fascination with [functional programming](https://en.wikipedia.org/wiki/Functional_programming) for a few years now, but despite taking a quick look at [Haskell](https://www.haskell.org/) I've not invested much time actually learning a functional language. I've generally tried to approach my front-end development from a functional mindset, keeping functions [pure](https://en.wikipedia.org/wiki/Pure_function), trying not to mutate objects, always using things like [`map`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map), [`filter`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter) and [`reduce`](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce) to manipulate collections. One of my main complaints/observations with functional languages is that they don't seem to be immediately practical, there seems to be a big step between picking up the fundamentals and basics of the language, and actually building something useful with it. Sometime recently I became aware of [Elm][] and after looking into it quickly, it seemed to address exactly this complaint of mine. There seemed to be a quick turnaround from picking up the basics of the language and being able to actually build something with it, specifically a front-end web application. I read through the [_An Introduction to Elm_][elm intro] book and wanted to build one of my side project ideas with [Elm][], but I decided that to avoid the possibility of getting overwhelmed and frustrated trying to build something ambitious with a new language, I'd build an example app that covered a lot of what I'd need for a bigger app. So, inspired by [Wes Bos'](https://twitter.com/wesbos) great [Learn Redux course](https://learnredux.com/), I decided I'd build a simple UI-clone of [Instagram][]. You can view the finished app [here][demo] and all of the source code is available [here][repo]. Also a big shout out to my friend Sam Gates for letting me use data from his [@wollongong_rips](https://www.instagram.com/wollongong_rips/) account for this example app and articles.


## Setting up a basic [Elm][] app

Most of the simple examples that you see for [Elm][] seem to have the entire codebase in a single _.elm_ file, this is great to demonstrate how little is required to get up and running with [Elm][], and the advice seems to be to only break your app into separate files when you need to. I had a look around at some articles and examples and I settled on the following app structure:

```none
project-directory/
├─ elm-package.json ─ project metadata and dependencies
├─ App.elm          ─ bootstrap app using The Elm Architecture
├─ Types.elm        ─ define Model, Msg and any other types
├─ State.elm        ─ handle all changes to state
├─ View.elm         ─ all view rendering and logic
├─ Rest.elm         ─ HTTP requests and JSON parsing
└─ Feature/         ─ a feature sub-directory
   ├─ Types.elm
   ├─ State.elm
   ├─ View.elm
   └─ Rest.elm
```

This should scale reasonably well, you would mostly re-use the same files as necessary in feature sub-directories. We'll only use the top-level files for this example, but for anything more complex you would probably need to break the app into smaller features, similar to how you would compose the UI out of separate small components in other frameworks.

The first steps to get started with [Elm][] are to install `elm`, create a new project directory and initialise an [Elm][] project inside of it. Installing [`elm-lang/core`](http://package.elm-lang.org/packages/elm-lang/core/latest/) will include [`elm-lang/html`](http://package.elm-lang.org/packages/elm-lang/html/latest/) and initialise an _elm-package.json_ file for the project.

```none
$ npm install -g elm
$ mkdir Elmstagram
$ cd Elmstagram
$ elm package install elm-lang/core
```

[The Elm Architecture][] is one of [Elm][]'s great contributions to the front-end ecosystem, the concept of a single immutable state object has been used by [Redux](http://redux.js.org/) and many other similar libraries. The following files implement a very basic [Elm][] example, and we'll use this as a starting point for the app. Note that we won't need _Rest.elm_ just yet.

```elm
-- Types.elm
module Types exposing (..)

type alias Model =
    Int

initialModel : Model
initialModel =
    0

type Msg
    = IncrementLikes
```

```elm
-- State.elm
module State exposing (..)

import Types exposing (..)

init : (Model, Cmd Msg)
init =
    initialModel ! []

update : Msg -> Model -> (Model, Cmd Msg)
update msg model =
    case msg of
        IncrementLikes ->
            (model + 1) ! []

subscriptions : Model -> Sub Msg
subscriptions model =
    Sub.none
```

```elm
-- View.elm
module View exposing (..)

import Html exposing (..)
import Html.Events exposing (onClick)
import Types exposing (Model, Msg(..))

rootView : Model -> Html Msg
rootView model =
    div []
        [ h1 [] [text "Elmstagram"]
        , p [] [text ("Likes: " ++ toString model)]
        , p []
            [ button [onClick IncrementLikes] [text "Like!"]
            ]
        ]
```

```elm
-- App.elm
module App exposing (main)

import Html
import Types exposing (Model, Msg)
import State
import View

main : Program Never Model Msg
main =
    Html.program
        { init = State.init
        , update = State.update
        , subscriptions = State.subscriptions
        , view = View.rootView
        }
```

I don't want to go into explaining this too much because this is all pretty thoroughly covered in the [Elm][] introductory [tutorials][elm intro] and [examples](http://elm-lang.org/examples). Basically the _App.elm_ file is the entry point into the application, it must expose a `main` function which returns a `Program` as defined by [The Elm Architecture][]. The `Program` requires:

  * an `init` function which provides an initial `model` and optionally some initial commands to run. We'll use this next to load the list of posts.
  * an `update` function which responds to commands and updates the `model`.
  * a `subscriptions` function which is used to respond to external updates such as messages on a web socket. We won't require any subscriptions for this example.
  * a `view` function which returns the UI based on the current `model`.

If you've only looked at basic [Elm][] examples so far, the `model ! [ cmd ]` syntax might look a little strange, but all it does is return a `(model, cmd)` tuple, where it's easy to provide a list of commands instead of just one. It also means we can just past an empty list as `[]` instead of explicitly using `Cmd.none`.

At this point you should be able to run `elm make App.elm` which will compile everything and produce an _index.html_ which you can open in a browser. Click the "Like!" button to your hearts content, then we'll move on with making things a little more interesting.


## Load posts from a [JSON][] file

Loading data from an external resource is actually fairly straight-forward, though if you're coming from [JavaScript][] you might find it a little tedious having to define [types](https://guide.elm-lang.org/types/) and [decoders](https://guide.elm-lang.org/interop/json.html). It definitely becomes easier after a little practice and I believe the extra effort trade-off is worth it. You'll basically need to define `type alias`es and decoders for all of the types that you're expecting in your [JSON][]-returning HTTP requests.

Download and save [_posts.json_](https://raw.githubusercontent.com/bkbooth/Elmstagram/resources/data/posts.json) into your project directory. The JSON data looks like this:

```json
[
  ...,
  {
    "id": "BLvMFSVB8mQ",
    "likes": 91,
    "comments": 4,
    "text": "The description or caption of the post #plusprobablysomehashtags",
    "media": "http://url.to/post.image.jpg"
  },
  ...
]
```

In _Types.elm_ we need to add a new `type alias Post` to map the [JSON][] data into. The type properties don't have to match exactly to the [JSON][] property names, but keeping them the same is the simplest for now. The type should look like this:

```elm
-- Types.elm

type alias Post =
    { id : String
    , likes : Int
    , comments : Int
    , text : String
    , media : String
    }
```

While we're in _Types.elm_, we'll update the `Model` type and the `initialModel` function to contain a list of `Post`s. Note that when we define a type in [Elm][] we get a constructor function of the same name that creates and returns a new value of that type, the function takes the same number of arguments as properties declared in the type definition and in the same order that they're declared. So far we just have a single `posts` property which we'll initialise to an empty list.

```elm
-- Types.elm

type alias Model =
    { posts : List Post
    }

initialModel : Model
initialModel =
    Model []
```

Next we need to define a decoder that instructs [Elm][] how to parse [JSON][] into types that it knows about. We need to use methods defined in [`Json.Decode`](http://package.elm-lang.org/packages/elm-lang/core/latest/Json-Decode) from [`elm-lang/core`](http://package.elm-lang.org/packages/elm-lang/core/latest) to create the decoder. The [JSON][] structure is an array of objects, each representing a single post. So we'll define the `decodePosts` function as returning a `Json.Decode.Decoder (List Post)`. We'll need to create the _Rest.elm_ file now and it will look like this:

```elm
-- Rest.elm
module Rest exposing (..)

import Json.Decode as Json exposing (..)
import Types exposing (Post)

decodePosts : Json.Decoder (List Post)
decodePosts =
    list <|
        map5 Post
            (field "id" string)
            (field "likes" int)
            (field "comments" int)
            (field "text" string)
            (field "media" string)
```

Note that we've imported `Json.Decode as Json exposing(..)`. This means that in the annotation we can simplify `Json.Decode.Decoder` to `Json.Decoder`. We could simplify it further to just `Decoder` because we've exposed everything from `Json.Decode`, but I prefer to be explicit here. To avoid exposing everything from `Json.Decode` we'd have to either explicitly refer to each of `list`, `map5`, `field`, `string` and `int` as `Json.list`, `Json.map`, etc. Or list just the functions that we're actually using in the `import` statement: `exposing(list, map5, field, string, int)`. The same goes for exposing functions from `Html` in _View.elm_. I generally prefer to be explicit about only importing what I need, but for _Rest.elm_ I'm OK with exposing everything from `Json.Decode` and for _View.elm_ I'm OK with exposing everything from `Html` because you generally need a number of functions from both.

Reading the decoder as we've defined it, we want to decode the [JSON][] into a list of `Post`s. We use the `map5` function here because we want to take 5 properties from the [JSON][] object. There are a number of `Json.Decode.mapx` functions to decode different sized [JSON][] objects. `map5` takes a function that takes 5 parameters to produce a value (in this case the default `Post` constructor function), followed by 5 decoders. The 5 `field` decoders that we're using each take a property name to extract from the [JSON][] object, followed by a type decoder which needs to match the [JSON][] property type.

To load the [JSON][] file we'll need to install [`elm-lang/http`](http://package.elm-lang.org/packages/elm-lang/http/latest) (`elm package install elm-lang/http`) and `import Http` in _Rest.elm_. The `getPosts` function will look like this:

```elm
-- Rest.elm

import Http
import Types exposing (Msg(..), Post)

getPosts : Cmd Msg
getPosts =
    Http.send FetchPosts <|
        Http.get "posts.json" decodePosts
```

`Http.get` takes a URL as a string and a `Json.Decode.Decoder` and returns a `Http.Request`. `Http.send` takes a `Msg` and a `Http.Request`, it performs the HTTP request and sends the success/fail as a `Result` to the specified `Msg`. To actually run all of this, we need to call `Rest.getPosts` from somewhere in the app. We could either do it in response to another `Msg` (such as clicking a button), or as a part of the initialisation. Because we always want to retrieve the list of posts before the app is able to do anything interesting, we'll do it as a part of the initialisation. In _State.elm_ modify the `init` function to look like this:

```elm
-- State.elm

import Rest

init : (Model, Cmd Msg)
init =
    initialModel ! [ Rest.getPosts ]
```

We'll also need to update the `Types.Msg` type to include the `FetchPosts` message and handle the message in the `State.update` function. Note that we've removed the `IncrementLikes` message.

```elm
-- Types.elm

import Http

type Msg
    = FetchPosts (Result Http.Error (List Post))
```

```elm
-- State.elm

update : Msg -> Model -> (Model, Cmd Msg)
update msg model =
    case msg of
        FetchPosts (Ok posts) ->
            { model | posts = posts } ! Cmd.none

        FetchPosts (Err _) ->
            model ! Cmd.none
```

The `{ model | posts = posts }` syntax is how you update a record in [Elm][]. It returns a new record, starting from the old record specified before the pipe, updated with any property changes after the pipe.

We'll update the view in the next part to show the actual posts, but for now just change `View.rootView` to show a count of the number of posts so that we can compile and check that everything still works.

```elm
-- View.elm

rootView : Model -> Html Msg
rootView model =
    div []
        [ h1 [] [text "Elmstagram"]
        , p [] [text ("Posts: " ++ (toString <| List.length model.posts))]
        ]
```

Go ahead and recompile the app with `elm make App.elm`. Because we've introduced a HTTP request you won't be able to just open the created _index.html_ file in a browser anymore, the browser will show a [CORS](https://en.wikipedia.org/wiki/Cross-origin_resource_sharing) error when attempting to load _posts.json_. You'll need to use a HTTP server to serve the example, but a static server such as [http-server](https://www.npmjs.com/package/http-server) will be good enough for now, just install and run it in your project directory, then open http://localhost:8080 in your browser.

```none
$ elm make App.elm
$ npm install -g http-server
$ http-server
```


## That's all (for now)

You can view the code that we've built so far [here](https://github.com/bkbooth/Elmstagram/tree/part1). We'll continue building the app in the following articles:

  * [Part 2](https://bkbooth.me/building-a-basic-ui-clone-of-instagram-using-elm-part-2/) - Build the main list view and add navigation
  * [Part 3](https://bkbooth.me/building-a-basic-ui-clone-of-instagram-using-elm-part-3/) - Build the single post view and add a comments form


  [elm]: http://elm-lang.org/ "Elm"
  [elm intro]: https://guide.elm-lang.org/ "An Introduction to Elm"
  [the elm architecture]: https://guide.elm-lang.org/architecture/ "The Elm Architecture"
  [instagram]: https://www.instagram.com/ "Instagram"
  [demo]: https://elmstagram.bkbooth.me "Elmstagram | Demo"
  [repo]: https://github.com/bkbooth/Elmstagram "Elmstagram | GitHub"
  [javascript]: https://en.wikipedia.org/wiki/JavaScript "JavaScript"
  [json]: https://en.wikipedia.org/wiki/JSON "JSON"
