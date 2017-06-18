+++
title = "Building a basic UI-clone of Instagram using Elm - Part 2"
date = "2016-12-02T23:32:00+10:00"
tags = ["Programming", "Elm", "Functional"]
draft = false
aliases = ["/building-a-basic-ui-clone-of-instagram-using-elm-part-2"]
hjsExtraLanguages = ["elm"]
+++

This article is a part of a series, if you haven't read the first part yet you can read it [here](https://bkbooth.me/building-a-basic-ui-clone-of-instagram-using-elm-part-1/). Alternatively you can get the code from the end of the last article [here](https://github.com/bkbooth/Elmstagram/tree/part1) and continue along. You can view the finished app [here][demo] and all of the source code is available [here][repo].


## Implement the main list of posts view

Getting a list of posts is all well and good, but not particularly exciting if we're just going to show a count of the number of posts. We'll build the UI for the main list of posts now, and as you might have guessed, most of the work for this step will be in _View.elm_. First we'll get some house-keeping out of the way. We want more control over _index.html_ so add or replace your _index.html_ with this:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Elmstagram</title>
    <link rel="stylesheet" href="css/styles.css">
  </head>
  <body>
    <div id="app"></div>
    
    <script src="js/app.js"></script>
    <script>
      Elm.App.embed(document.getElementById("app"));
    </script>
  </body>
</html>
```

Download and save the final [CSS](https://en.wikipedia.org/wiki/Cascading_Style_Sheets) from [here](https://raw.githubusercontent.com/bkbooth/Elmstagram/resources/css/styles.css) to _css/styles.css_, then download all of the fonts from [here](https://github.com/bkbooth/Elmstagram/tree/resources/fonts) to _fonts/*_. Next, move _posts.json_ to _data/posts.json_ and update the URL in `Rest.getPosts` to `"data/posts.json"`.

We're no longer inlining the compiled [JavaScript][] code, so we need to manually bootstrap it after the script loads. We'll need to build _js/app.js_ and  with `elm make`:

```none
$ elm make App.elm --output js/app.js
```

You should be able to start or restart your static HTTP server and see that everything is still working.

OK, onto the view changes. The `View.rootView` is, as the name suggests, going to be the root view. When we have multiple pages the structure defined here will be common to all pages. Change it to look as follows then download and save [this logo](https://raw.githubusercontent.com/bkbooth/Elmstagram/resources/img/logo.svg) to _img/logo.svg_.

```elm
-- View.elm

import Html.Attributes exposing (..)

rootView : Model -> Html Msg
rootView model =
    div [ id "app-root" ]
        [ main_ []
            [ div [ class "photo-list" ] <|
                List.map (viewPost model) model.posts
            ]
        , nav []
            [ div [ class "nav-inner" ]
                [ a [ href "./", class "nav-logo" ]
                    [ img [ src "./img/logo.svg" ] []
                    , text "Elmstagram"
                    ]
                ]
            ]
        , footer []
            [ div [ class "footer-inner" ]
                [ p []
                    [ a [ href "https://github.com/bkbooth/Elmstagram.git" ] [ text "View Source" ]
                    , text "|"
                    , a [ href "./" ] [ text "Elmstagram" ]
                    ]
                ]
            ]
        ]
```

We've added `Html.Attributes` as another import where we expose everything, this is because similar to `Http` we will end up using a large number of the functions. This should all be fairly self-explanatory, each [DOM][] node takes a list of attributes followed by a list of child nodes. The only other item of interest is where we `List.map` with a view function over our list of `Post`s in `model.post`. We'll define `View.viewPost` now, we want `viewPost` to be reusable for each post in the main list and for when we click through to a single post. The function will look like this (don't forget to add `Post` to the `import Types` line).

```elm
-- View.elm

import Types exposing (Model, Msg(..), Post)

viewPost : Model -> Post -> Html Msg
viewPost model post =
    figure [ class "photo-figure" ]
        [ div [ class "photo-wrap" ]
            [ a [ href "#" ]
                [ img [ src post.media, alt post.text, class "photo" ] []
                ]
            ]
        , figcaption []
            [ div [ class "caption-button" ]
                [ button [ class "like-button" ] [ text "♡" ]
                ]
            , div [ class "caption-content" ]
                [ div [ class "photo-stats" ]
                    [ strong [] [ text <| toString post.likes ]
                    , text " likes, "
                    , strong [] [ text <| toString post.comments ]
                    , text " comments"
                    ]
                , p [ class "photo-caption" ] [ text post.text ]
                ]
            ]
        ]
```

Again, this is fairly straight-forward building of a [DOM][] tree, note where we access the properties of the `Post` that is passed into the function (this function is called for every `Post` in `model.posts`). At this stage you should be able to rebuild _js/app.js_ with `elm make App.elm --output js/app.js`, start your static HTTP server if it isn't still running and reload http://localhost:8080 in your browser to see the layout and list of posts.

An optimisation that we can and should make is to use `Html.Keyed` to turn each node in our list of `Post`s into a keyed node to help with [Elm][]'s rendering. This is important for lists where items are getting added, moved, removed, etc. but also when we add navigation between views that are using similar elements. In an early version of this app before adding `Html.Keyed`, whenever I navigated back to the main list view from a single post view, the first item in the list was always the post that I'd just been looking at momentarily. Using `Html.Keyed` fixes problems like these, so lets use it now. Because we want to make use of the current `View.viewPost` implementation on the single post view, we'll keep it as is and create a wrapper function that returns a keyed node. Add `View.viewKeyedPost` like this:

```elm
-- View.elm

import Html.Keyed

viewKeyedPost : Model -> Post -> (String, Html Msg)
viewKeyedPost model post =
    ( post.id
    , viewPost model post
    )
```

As you can see, a keyed node is a `(String, Html Msg)` tuple instead of just a `Html Msg` node, the string is the unique identifier for that node, in this case the `post.id`. Change `div.photo-list` to a keyed node which uses `viewKeyedPost` like this `View.rootView` 

```elm
-- View.elm

Html.Keyed.node "div"
    [ class "photo-list" ]
    <| List.map (viewKeyedPost model) model.posts
```

Recompile and reload to see that everything should still be working.


## Implement the "Like" button

Now let's implement the functionality for the "like" button which is the heart next to the number of likes and comments on each post. It would be fairly easy to implement double-click to like similar to [Instagram][], but I've decided to reserve clicking on the image for navigating to the single post view. A general procedure which we'll follow now for adding a new action is to:

1. add the new action to the `Types.Msg` union type
2. handle the action in `State.update`
3. use/call the action somewhere in the `View`

Firstly, update `Types.Msg` to look like this:

```elm
-- Types.elm

type Msg
    = FetchPosts (Result Http.Error (List Post))
    | IncrementLikes String
```

The `String` parameter after `IncrementLikes` will be a `Post.id`. Next add this to the `State.update` case statement after the two `FetchPosts` cases:

```elm
-- State.elm

update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case action of
        -- ...
        
        IncrementLikes postId ->
            let
                incrementPostLikes : String -> Post -> Post
                incrementPostLikes postId post =
                    if post.id == postId then
                        { post | likes = post.likes + 1 }
                    else
                        post
            in
                { model
                    | posts = List.map (incrementPostLikes postId) model.posts
                } ! []
```

This looks significantly more complex than the previous `State.update` cases, but most of it is the definition of the `incrementPostLikes` function. We could move this function out but this is the only place where the function is used, so I find it simpler to just keep it defined here. The function itself just takes a `String` representing a `Post.id` and a `Post`, if the passed in `postId` matches the passed in `post.id` we increment the `likes` property and return the updated `post`, otherwise we just return the `post` as is. We use this function in the `model` update to `List.map` over the `model.posts`. Basically all this does is return a new `model`, with an updated `posts` property, where any `Post` with the same `Post.id` will have it's `likes` property incremented.

Finally, we need to update `View.viewPost`. In _View.elm_, you should still have `import Html.Events exposing (onClick)` from the starting example, if not add it back in now. Find `button.like-button` in `View.viewPost` and add an `onClick` handler like this:

```elm
-- View.elm

button [ onClick <| IncrementLikes post.id, class "like-button" ] [ text "♡" ]
```

Now you should be able to recompile and test the app in the browser. Click any of the heart icon "like" buttons and the likes counter for the corresponding post will increment, exciting!


## Add a second page and navigation

Just about any reasonably complex web application will contain multiple views and manage the navigation between those views by using the URL. Storing some of the application state in the URL also makes it easier to share a link to a particular page or view. There are two libraries provided by [Elm][] for handling changes in the URL, namely [`elm-lang/navigation`](http://package.elm-lang.org/packages/elm-lang/navigation/latest/) and [`evancz/url-parser`](http://package.elm-lang.org/packages/elm-lang/navigation/latest/). Go ahead and install both of them now with `elm package install elm-lang/navigation` and `elm package install evancz/url-parser`. It's worth noting that [Elm][] has been deliberate about calling this set of behaviours "navigation" and not "routing" as you would see in most front-end libraries and frameworks.

The first change required to introduce navigation to an [Elm][] app is right at the top in _App.elm_, [`elm-lang/navigation`](http://package.elm-lang.org/packages/elm-lang/navigation/latest/) provides `Navigation.program` which we use to create `App.main` instead of `Html.app`. Replace `import Html` with `import Navigation`, then replace `Html.program` with `Navigation.program` and pass `State.hashParser` is the first parameter before the record definition, we'll define `State.hashParser` shortly. `App.main` should now look like this.

```elm
-- App.elm

import Navigation

main : Program Never Model Msg
main =
    Navigation.program State.hashParser
        { init = State.init
        , update = State.update
        , subscriptions = State.subscriptions
        , view = View.rootView
        }
```

Next we need to update _Types.elm_, we'll need `Model` to keep track of the current page. Firstly define a new union type `Page` with the pages that you need, in this case `ListOfPosts` for the main list of posts, and `SinglePost String` for the single post view where the `String` will be a `Post.id`. We then need to add a new `page` property to the `Model` record. We'll also need to update `Types.initialModel` to set the initial `Page`, but we'll take the initial `Page` as a parameter because we'll parse the initial URL to work out what the initial `Page` should be in `State.init`. We also need to add a new action to the `Msg` union type to handle navigation changes, we'll call it `NavigatedTo` and it will take a single `Maybe Page` parameter.
 
```elm
-- Types.elm

type alias Model =
    { posts : List Post
    , page : Page
    }
    
initialModel : Page -> Model
initialModel page =
    Model [] page

type Msg
    = -- ...
    | NavigatedTo (Maybe Page)

type Page
    = ListOfPosts
    | SinglePost String
```

Next up is _State.elm_ and we've got a few changes that we need to make. We need to define some utility functions that map URL's to a `Page` and vice-versa:

```elm
-- State.elm

import Navigation
import UrlParser exposing (..)
            
hashParser : Navigation.Location -> Msg
hashParser location =
    NavigatedTo <|
        UrlParser.parseHash pageParser location
        
pageParser : Parser (Page -> a) a
pageParser =
    oneOf
        [ map ListOfPosts <| s ""
        , map SinglePost <| s "view" </> string
        ]
        
toUrl : Page -> String
toUrl page =
    case page of
        ListOfPosts ->
            "/"
            
        SinglePost postId ->
            "/view/" ++ postId
```

`State.hashParser` is the function that we passed as the first argument to `App.main` earlier. It's role is to translate changes in `Navigation.Location` to messages that `State.update` can handle, in this case `NavigatedTo` which we defined in the last step. To do this it uses `UrlParser.parseHash` which takes a `UrlParser.Parser` and a `Navigation.Location` record. `UrlParser` exports a number of functions to help with building an `UrlParser.Parser` which matches the expected URL's in the app and maps them to `Page`s. `UrlParser.parseHash` actually returns a `Maybe Page` because it might not be able to map the URL to one of the known states of the app, you'll need to handle this case too. Note that there is also a `UrlParser.parsePath` function that will run a `UrlParser.Parser` against the path part of the URL instead of the hash. I've actually used `UrlParser.parsePath` in the [repository][repo], but using URL paths with a single-page web application requires some server-side support, `UrlParser.parseHash` is easier for examples because we can just use a simple HTTP server. Finally `State.toUrl` just returns a URL `String` based on a `Page`. Now we need to replace `State.init` with this:

```elm
-- State.elm

init : Navigation.Location -> (Model, Cmd Msg)
init location =
    case UrlParser.parseHash pageParser location of
        Just page ->
            initialModel page
                ! [ Rest.getPosts
                  ]
            
        Nothing ->
            initialModel ListOfPosts
                ! [ Rest.getPosts
                  , Navigation.modifyUrl <| toUrl ListOfPosts
                  ]
```

Because we're using `Navigation.program`, our `State.init` function now gets passed a `Navigation.Location` which is the URL at the time that the application is initialised. We parse this to a `Maybe Page` using `UrlParser.parseHash` and `State.pageParser`. If it matches a page we pass the page to `Types.initialModel`, otherwise we explicitly set the page to `ListOfPosts` and update the URL with `Navigation.modifyUrl` and `State.toUrl`. You might want to redirect to a [404 Not Found](https://en.wikipedia.org/wiki/HTTP_404) page instead. In each case we still call `Rest.getPosts` to load the post data. To finish up the changes in _State.elm_, we need to add the `NavigatedTo` case to `State.update`:

```elm
-- State.elm

update msg model =
    case msg of
        -- ...
        
        NavigatedTo maybePage ->
            case maybePage of
                Just page ->
                    { model | page = page }
                        ! []
                        
                Nothing ->
                    model
                        ! [ Navigation.newUrl <| toUrl ListOfPosts
                          ]
```

This is pretty similar to what we just did in `State.init`, except that we don't need to trigger another action if `maybePage` is a known `Page`, just update `model.page`. If it's not a known `Page`, we redirect to the `ListOfPosts` page using `Navigation.newUrl`. `Navigation.newUrl` updates the state and write a new URL into the browser history, whereas `Navigation.modifyUrl` updates the URL without adding a new state to the browser history.

We'll add the proper UI for the single post view in the next part, for now we'll just show the `Post.postId`. We'll create a new `View.viewPage` function to change the view based on the current page. Replace `Html.Keyed.node ...` in `View.rootView` with just `viewPage model` and move the `Html.Keyed.node ...` block to `View.viewPage` under the `ListOfPosts` case. We'll just put a dummy view in for the `SinglePost` case for now. Don't forget to expose `Page(..)` from the `Types` import, or you might want to just expose everything from `Types` now.

```elm
-- View.elm

import Types exposing (..)

rootView : Model -> Html Msg
rootView model =
    div [ id "app-root" ]
        [ main_ []
            [ viewPage model
            ]
        -- ...

viewPage : Model -> Html Msg
viewPage model =
    case model.page of
        ListOfPosts ->
            Html.Keyed.node "div"
                [ class "photo-list" ]
                <| List.map (viewKeyedPost model) model.posts
                
        SinglePost postId ->
            div [ class "photo-single" ]
                [ text ("Post: " ++ postId) ]
```

Finally we need to update the links in _View.elm_ to use `State.toUrl`. Import `State` and then replace both of the `href "./"`'s in `View.rootView` with `href (State.toUrl ListOfPosts)`, then replace the `href "#"` in `View.viewPost` with `href (State.toUrl SinglePost post.id)`. You should be able to recompile _js/app.js_ now, start your static HTTP server and view the app in the browser. 


## That's all (for now)

You can view the code that we've built so far [here](https://github.com/bkbooth/Elmstagram/tree/part2). We'll continue building the app in Part 3:

  * [Part 1](https://bkbooth.me/building-a-basic-ui-clone-of-instagram-using-elm-part-1/) - Setup an [Elm][] app and load posts from a [JSON][] file
  * [Part 3](https://bkbooth.me/building-a-basic-ui-clone-of-instagram-using-elm-part-3/) - Build the single post view and add a comments form


  [elm]: http://elm-lang.org/ "Elm"
  [instagram]: https://www.instagram.com/ "Instagram"
  [demo]: https://elmstagram.bkbooth.me "Elmstagram | Demo"
  [repo]: https://github.com/bkbooth/Elmstagram "Elmstagram | GitHub"
  [javascript]: https://en.wikipedia.org/wiki/JavaScript "JavaScript"
  [json]: https://en.wikipedia.org/wiki/JSON "JSON"
  [dom]: https://en.wikipedia.org/wiki/Document_Object_Model "DOM"
