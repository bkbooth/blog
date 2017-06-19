+++
title = "Building a basic UI-clone of Instagram using Elm - Part 3"
date = "2016-12-07T23:34:00+10:00"
tags = ["programming", "elm", "functional"]
aliases = ["/building-a-basic-ui-clone-of-instagram-using-elm-part-3"]
hjsExtraLanguages = ["elm"]
+++

This article is a part of a series, if you haven't read the first or second parts yet you can read them [here](https://benkbooth.com/building-a-basic-ui-clone-of-instagram-using-elm-part-1/) and [here](https://bkbooth.me/building-a-basic-ui-clone-of-instagram-using-elm-part-2/). Alternatively you can get the code from the end of the last article [here](https://github.com/bkbooth/Elmstagram/tree/part2) and continue along. You can view the finished app [here][demo] and all of the source code is available [here][repo].


## Implement the single post view

Now that we can navigate to a new page/view, let's start building out the view properly. If you recall where we left off, the `SinglePost` case in `View.viewPage` was just rendering the `postId` that was parsed from the URL. We need to use this `postId` to find the right `Post` in `model.posts`. We'll define a `View.getPost` helper function to do this now.

```elm
-- View.elm

getPost : String -> List Post -> Maybe Post
getPost postId posts =
    let
        postsById = List.filter (\post -> post.id == postId) posts
    in
        List.head postsById
```

We need to return a `Maybe Post` because the `postId` string parsed from the URL might not be a valid `Post.id`, or there might just not be a `Post` in `model.posts` that matches the `postId`. We approach the problem by filtering the list to `Post`s with a `Post.id` matching `postId` which should leave 1 or 0 `Post`s in the `postsById` list (we're trusting the data source here that `Post.id` is unique), then we take the first item from the filtered list, which will return a `Maybe Post`. Now let's update the `SinglePost` case of `View.viewPage` to use `View.getPost` and `View.viewPost` to render a single post.
 
```elm
-- View.elm

viewPage : Model -> Html Msg
viewPage model =
    case model.page of
        ListOfPosts ->
            -- ...
        
        SinglePost postId ->
            case getPost postId model.posts of
                Just post ->
                    div [ class "photo-single" ]
                        [ viewPost model post ]
                        
                Nothing ->
                    div []
                        [ text ("Post " ++ postId ++ " not found.") ]
```

You should be able to recompile and open the app in the browser now and the `SinglePost` view will render a single post, which is fun, but no more useful than the `ListOfPosts` view. We'll load and display the list of comments (if any) on the `SinglePost` view next.


## Load and display comments

We've got a bit of work to do in order to load the comments, but thankfully it's all derivative of things we've already done. Firstly, download all of the _*.json_ files from [here](https://github.com/bkbooth/Elmstagram/tree/resources/data) and save them to _data/*.json_. If you inspect one of the files you'll notice that it's filename is a _{Post.id}.json_ and the [JSON][] data looks like this:

```json
[
  ...,
  {
    "id": "17856770641073526",
    "username": "tiktoktikkdotcom",
    "time": 1478756236,
    "text": "This is definitely first rated!"
  },
  ...
]
```

Basically for each `Post` we have a _{Post.id}.json_ with the list of comments for that post. We only care about the `"username"` and `"text"` properties for now, let's firstly define a `type alias` in _Types.elm_ and a decoder in _Rest.elm_.
 
```elm
-- Types.elm

type alias Comment =
    { username : String
    , text : String
    }
```

```elm
-- Rest.elm

import Types exposing (Msg(..), Post, Comment)

decodeComments : Json.Decoder (List Comment)
decodeComments =
    list <|
        map2 Comment
            (field "username" string)
            (field "text" string)
```

Most of this is pretty similar to what we already did with with the `Post` type and decoder. Notice that we've used `Json.Decoder.map2` to extract two properties from each [JSON][] object. While we're in _Rest.elm_ let's also add a function that takes a `Post.id` and loads it's associated [JSON][] comments file.

```elm
-- Rest.elm

getPostComments : String -> Cmd Msg
getPostComments postId =
    Http.send (FetchComments postId) <|
        Http.get ("data/" ++ postId ++ ".json") decodeComments
```

Again this is pretty similar to `Rest.getPosts` that we defined previously, except that we're taking a `postId` parameter, and we also pass the `postId` through to the `FetchComments` action. We should now add `FetchComments` to the `Types.Msg` union type and while we're in _Types.elm_ we should add the lists of `Comment`s to `Types.Model` and update `Types.initialModel` to initialise it. We'll store the lists of `Comment`s in a `Dict` which is provided by [`elm-lang/core`](http://package.elm-lang.org/packages/elm-lang/core/latest), but we need to `import` it before we can use it. The keys in our `Dict` will be `Post.id`s and the values will be `List Comment`. Note that `Dict.empty` just initialises an empty `Dict`.

```elm
-- Types.elm

import Dict exposing (Dict)

type alias Model =
    { posts : List Post
    , comments : Dict String (List Comment)
    , page : Page
    }
    
initialModel : Page -> Model
initialModel page =
    Model [] Dict.empty page

type Msg
    = FetchPosts (Result Http.Error (List Post))
    | FetchComments String (Result Http.Error (List Comment))
    | -- ...
```

Now we should move onto _State.elm_ to handle the `FetchComments` action in `State.update`, don't forget to `import Dict` here too.

```elm
-- State.elm

import Dict exposing (Dict)

update : Msg -> Model -> (Model, Cmd Msg)
update msg model =
    case msg of
        -- ...
        
        FetchComments postId (Ok comments) ->
            { model
                | comments = Dict.insert postId comments model.comments
                , posts = List.map (setPostComments postId <| List.length comments) model.posts
            } ! []
        
        FetchComments postId (Err _) ->
            update (FetchComments postId <| Ok []) model
            
setPostComments : String -> Int -> Post -> Post
setPostComments postId numberOfComments post =
    if post.id == postId then
        { post | comments = numberOfComments }
    else
        post
```

Just like with `FetchPosts`, we actually get a `Result` and need to handle the `Err` case as well as the `Ok` case. I decided that for the `Err` case we'd just call update again but this time passing `Ok []`, which as we'll see next will initialise the `Dict` entry for the given `postId` to an empty list of `Comment`s. The `Ok` case needs to do two things, firstly we insert the list of `Comment`s into the `Dict` with `Dict.insert`, then we need to update the counter in the `Post.comments` property of the `Post` with a `Post.id` matching `postId`. Unlike the `IncremementLikes` case where we defined a helper function inside the `case` block, we define `setPostComments` separately because we'll be reusing this function when we add and remove comments. `setPostComments` takes a `Post.id`, an updated number of `Comment`s and a `Post`, we use it in the `FetchComments` case to `List.map` over `model.posts`.

The final change that we need to make in _State.elm_ is to actually load the `Comment`s by calling `Rest.getPostComments`. In both `State.init` and `State.update` we'll split the `Just page` case to have slightly different behaviour for `Just ListOfPosts` and `Just SinglePost`. `Just ListOfPosts` will basically be the same as the current `Just page` case in both cases, but for `Just SinglePost` we'll want to call `Rest.getPostComments` in both cases.

```elm
-- State.elm

init : Navigation.location -> (Model, Cmd Msg)
init location =
    case UrlParser.parseHash pageParser location of
        Just ListOfPosts ->
            initialModel ListOfPosts
                ! [ Rest.getPosts
                  ]
                  
        Just (SinglePost postId) ->
            initialModel (SinglePost postId)
                ! [ Rest.getPosts
                  , Rest.getPostComments postId
                  ]
        
        Nothing ->
            -- ...

update : Msg -> Model -> (Model, Cmd Msg)
update msg model =
    case msg of
        -- ...
        
        NavigatedTo maybePage ->
            case maybePage of ->
                Just ListOfPosts ->
                    { model | page = ListOfPosts }
                        ! []
                
                Just (SinglePost postId) ->
                    { model | page = SinglePost postId }
                        ! [ Rest.getPostComments postId
                          ]
                
                Nothing ->
                    -- ...
```

Now we need to actually show the comments. Firstly we'll define a `getPostComments` helper function to return a `List Comment` from `model.comments`. Because `Dict.get` returns a `Maybe` we need to handle the `Nothing` case, we'll just return an empty `List`. Don't forgot to `import Dict` here too.

```elm
-- View.elm

import Dict exposing (Dict)

getPostComments : String -> Dict String (List Comment) -> List Comment
getPostComments postId comments =
    case (Dict.get postId comments) of
        Just postComments ->
            postComments

        Nothing ->
            []
```

Next we need to make some changes to the existing `View.viewPost` function. We'll determine if we should show the list of `Comment`s by inspecting `model.page`, we only want to show them for the `SinglePost` case, so we'll just show an empty `div` for the `ListOfPosts` case. We'll add the comments directly after `p.photo-caption`. 
   
```elm
-- View.elm

viewPost : Model -> Post -> Html Msg
viewPost model post =
    let
        displayComments =
            case model.page of
                SinglePost postId ->
                    viewComments model post

                ListOfPosts ->
                    div [] []
    in
        -- ...
        , p [ class "photo-caption" ] [ text post.text ]
        , displayComments
        -- ...
```

Finally we'll define the `viewComments` and `viewComment` functions. `viewComment` defines the bulk of the [DOM][] structure, but returns a `(String, Html Msg)` which if you recall is used by `Html.Keyed.node`. In `viewComments` we'll use `List.indexedMap` to pass an `Int` index as well as the `Comment` through to `viewComment`. `viewComments` then just returns a `Html.Keyed.node` using the list of [DOM][] returned by the `viewComment` calls for each `Comment`.

```elm
-- View.elm
        
viewComments : Model -> Post -> Html Msg
viewComments model post =
    let
        listOfComments =
            List.indexedMap (viewComment post) <|
                getPostComments post.id model.comments
    in
        Html.Keyed.node "div"
            [ class "comments" ] <|
            listOfComments


viewComment : Post -> Int -> Comment -> (String, Html Msg)
viewComment post index comment =
    ( toString index
    , div [ class "comment" ]
        [ p []
            [ strong [] [ text comment.username ]
            , text comment.text
            ]
        ]
    )
```

At this stage you should be able to recompile and test the app in the browser again. When you click through to any of the `SinglePost` views you should see a list of `Comment`s! Let's remove some of those comments next.


## Implement the remove comment button

We'll add the ability to remove comments by adding a little inline "x" button after each comment. Using our established pattern we'll firstly add the `RemoveComment` action to `Types.Msg`.

```elm
-- Types.elm

type Msg
    = -- ...
    | RemoveComment String Int
```

The `String` will be a `Post.id` and the `Int` will be an index representing the location of the `Comment` in the `List`. Let's add the handler for this action in `State.update` now. We're going to use a function from `List.Extra` which is provided by [`elm-community/list-extra`](http://package.elm-lang.org/packages/elm-community/list-extra/latest), so install it now with `elm package install elm-community/list-extra` and `import List.Extra`.

```elm
-- State.elm

import List.Extra

update : Msg -> Model -> (Model, Cmd Msg)
update msg model =
    case msg of
        -- ...
        
        RemoveComment postId index ->
            let
                removePostComment : Maybe (List Comment) -> Maybe (List Comment)
                removePostComment comments =
                    case comments of
                        Just comments ->
                            Just <| List.Extra.removeAt index comments

                        Nothing ->
                            Nothing

                numberOfPostComments =
                    getNumberOfPostComments postId model.comments
            in
                { model
                    | comments = Dict.update postId removePostComment model.comments
                    , posts = List.map (setPostComments postId <| numberOfPostComments - 1) model.posts
                } ! []

getNumberOfPostComments : String -> Dict String (List Comment) -> Int
getNumberOfPostComments postId comments =
    case Dict.get postId comments of
        Just postComments ->
            List.length postComments

        Nothing ->
            0
```

We need the handler to firstly remove the `Comment` from the right location in `model.comments`, which is determined by the index in the `List Comment` where the `Dict` key matches the passed in `postId`, then it needs to update the comments counter for the right `Post` in `model.posts`. We've defined a couple of helper functions for this, firstly `getNumberOfPostComments` which we've defined independently because we'll use it again soon when we want to add a new `Comment`, it just gets the `List Comment` by using `Dict.get` with the passed in `postId`, then either returns the length of the list, or 0 if the `Dict` doesn't have an entry matching the `postId`. `removePostComment` is defined in the `RemoveComment` handler because it's only ever used here. We use `List.Extra.removeAt` to attempt to remove from the provided `List` of `Comment`s the item at the provided `index`, it returns the updated `List`. In the `model` record update statement we use `Dict.update` with the `removePostComment` function, then similar to the `FetchComments` handler we use `List.map` with `setPostComments` to update the number of `Comment`s for the given `Post`.

Finally let's add the actual "x" button into the view, just add the following line to `View.viewComment` immediately after `, text comment.text`:

```elm
-- View.elm

viewComment : Post -> Int -> Comment -> (String, Html Msg)
viewComment post index comment =
    -- ...
    , text comment.text
    , button [ onClick <| RemoveComment post.id index, class "remove-comment" ] [ text "×" ]
    -- ...
```

Recompile and open the app in your browser, click through to one of the `SinglePost` views and remove comments to your heart's content by clicking the little "x" button next to each comment. You might notice that if you remove some comments, navigate back to the `ListOfPosts` view and then back to the same `SinglePost` view, the comments that you just removed will all be back! This is because we always load the list of `Comment`s when we navigate to the `SinglePost` view. To fix it we'll update the `Ok` case of `FetchComments` in `State.update` to check if there's an existing entry in `Dict` for the `postId` and only update the `model` if it's a new entry in the `Dict`.

```elm
-- State.elm

update : Msg -> Model -> (Model, Cmd Msg)
update msg model =
    case msg of
        -- ...
        
        FetchComments postId (Ok comments) ->
            case Dict.get postId model.comments of
                Just existingComments ->
                    model ! []
                    
                Nothing ->
                    { model
                        | comments = Dict.insert postId updatedComments model.comments
                        , posts = List.map (setPostComments postId <| List.length updatedComments) model.posts
                    } ! []
```

Recompile and test it in the browser. Removed comments now stay removed! ...until you refresh the page, but that's another story. Let's move onto the final piece of this puzzle, adding a new comment.


## Implement the add comment form

This last step will require updating text in some input fields. Starting in _Types.elm_, we will add and initialise a `newComment` property to the `Model` record and we'll need 3 new actions in `Msg`, one for each of the two input fields, and one for actually adding the comment.
 
```elm
--Types.elm

type alias Model =
    { posts : List Post
    , comments : Dict String (List Comment)
    , page : Page
    , newComment : Comment
    }
    
initialModel : Page -> Model
initialModel page =
    Model [] Dict.empty page (Comment "" "")
    
type Msg
    = -- ...
    | UpdateCommentUsername String
    | UpdateCommentText String
    | AddComment String Comment
```

Moving to _State.elm_, the two `UpdateComment...` actions are quite simple and basically the same, they just update the corresponding property in `model.newComment`.

```elm
-- State.elm

update : Msg -> Model -> (Model, Cmd Msg)
update msg model =
    case msg of
        -- ...
        
        UpdateCommentUsername username ->
            let
                comment = model.newComment
            in
                { model
                    | newComment = { comment | username = username }
                } ! []
                
        UpdateCommentText text ->
            let
                comment = model.newComment
            in
                { model
                    | newComment = { comment | text = text }
                } ! []
```

The `AddComment` action is more complex than these, but quite similar to the `RemoveComment` action. The `addPostComment` helper function that we'll define is also used by `Dict.update`, but either concatenates the new `Comment` onto the existing `List` of `Comment`s or returns a new `List` containing just the new `Comment`. We also need to reset the two input fields after adding the comment.

```elm
-- State.elm

update : Msg -> Model -> (Model, Cmd Msg)
update msg model =
    case msg of
        -- ...
        
        AddComment postId comment ->
            let
                addPostComment : Maybe (List Comment) -> Maybe (List Comment)
                addPostComment comments =
                    case comments of
                        Just comments ->
                            Just <| comments ++ [ comment ]

                        Nothing ->
                            Just [ comment ]

                numberOfPostComments =
                    getNumberOfPostComments postId model.comments
            in
                { model
                    | comments = Dict.update postId addPostComment model.comments
                    , posts = List.map (setPostComments postId <| numberOfPostComments + 1) model.posts
                    , newComment = Comment "" ""
                } ! []
```

Finishing up with _View.elm_ we need to define `View.viewCommentForm` to build the actual form [DOM][], then use it in `View.viewComments`. We actually append the comment form to the list of comments, so it also needs to return a `(String, Html Msg)` tuple for the `Html.Keyed.node`. Remember to expose `onInput` and `onSubmit` from the `Html.Events` import.

```elm
-- View.elm

import Html.Events exposing (onClick, onInput, onSubmit)

viewComments : Model -> Post -> Html Msg
viewComments model post =
    -- ...
        Html.Keyed.node "div"
            [ class "comments" ] <|
            listOfComments
                ++ [ viewCommentForm model post ]
                
viewCommentForm : Model -> Post -> (String, Html Msg)
viewCommentForm model post =
    ( "comment-form"
    , Html.form [ onSubmit <| AddComment post.id model.newComment, class "comment-form" ]
        [ input
            [ type_ "text"
            , value model.newComment.username
            , onInput UpdateCommentUsername
            , placeholder "author..."
            ]
            []
        , input
            [ type_ "text"
            , value model.newComment.text
            , onInput UpdateCommentText
            , placeholder "comment..."
            ]
            []
        , input
            [ type_ "submit"
            , hidden True
            ]
            []
        ]
    )
```

By now this should all look pretty straight-forward. We bind the `value` of each `input` to properties in `model.newComment` and we trigger `UpdateComment...` actions when either of the `input`s change. We trigger the `AddComment` action with the `form`s `onSubmit` event.

Recompile and open the app in your browser and you should now be able to leave any nasty comments that you want anonymously without anybody else ever seeing them!


## The end!

You can view the code that we've built [here](https://github.com/bkbooth/Elmstagram/tree/part3). We've covered quite a lot in building this example:

  * Bootstrap an [Elm][] application
  * Define and handle changes to the `model` state object
  * Define a DOM structure which responds to changes in the `model`
  * Get data with HTTP requests and decode a [JSON][] response
  * Add navigation with multiple pages/views, run commands after navigating to a new page
  * Define and handle changes to forms

This doesn't solve all of the problems that you'll face trying to build a front-end web application with [Elm][], but these foundations should give you enough to build most of what you require. Hopefully this has been an interesting exercise for you and encourages you to try and build something interesting with [Elm][].

If you missed one of the earlier parts, feel free to go back and read them too:

  * [Part 1](https://benkbooth.com/building-a-basic-ui-clone-of-instagram-using-elm-part-1/) - Setup an [Elm][] app and load posts from a [JSON][] file
  * [Part 2](https://benkbooth.com/building-a-basic-ui-clone-of-instagram-using-elm-part-2/) - Build the main list view and add navigation


  [elm]: http://elm-lang.org/ "Elm"
  [demo]: https://elmstagram.bkbooth.me "Elmstagram | Demo"
  [repo]: https://github.com/bkbooth/Elmstagram "Elmstagram | GitHub"
  [json]: https://en.wikipedia.org/wiki/JSON "JSON"
  [dom]: https://en.wikipedia.org/wiki/Document_Object_Model "DOM"
