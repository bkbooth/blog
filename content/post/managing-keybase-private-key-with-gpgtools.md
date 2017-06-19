+++
title = "Managing Keybase private key with GPGTools"
date = "2017-02-09T00:07:00+10:00"
tags = ["keybase", "gpg", "pgp"]
aliases = ["/managing-keybase-private-key-with-gpgtools"]
+++

This is not a particularly well-written article. I've found everything here useful, but so irregularly that I always end up Googling and needing to put together info from multiple blog posts so I'm putting it all together here for my reference, and maybe it'll help you if you stumbled across it. ~~At some stage I'll organise this into a proper article.~~ _[Update 2017-04-07]_ I'll probably never actually update this article.

## Import your [Keybase][] key into [GPGTools][]

Export your existing public and private keys from [Keybase][], save them locally as `keybase-public.key` and `keybase-private.key` respectively.

![Export private key from Keybase](/images/2017/02/Screen-Shot-2017-02-08-at-11.23.16-pm.png)

Import both keys into your local [GPGTools][]:

```none
$ gpg --allow-secret-key-import --import keybase-private.key
$ gpg --import keybase-public.key
```

Delete both the public and private key files.

Optionally, edit `~/.gnupg/gpg.conf` to set the default key. Firstly get the ID of the key:

```none
$ gpg --list-secret-keys
```

Then add it to `~/.gnupg/gpg.conf` with this line:

```none
default-key [YOUR_KEY_ID]
```


## Update the key with `gpg`

Make any required changes to the key with the `gpg` command-line tool:

```none
$ gpg --edit-key [YOUR_KEY_ID]
```

Some useful `gpg>` commands are:

```none
help    - show help
list    - list key and user IDs
uid N   - select user ID N
adduid  - add a user ID
deluid  - delete selected user IDs
trust   - change the ownertrust
save    - commit your changes and quit
```

Don't forget to `save` after making your changes!


## Push the updated key to [Keybase][]

Now that you've updated your local copy of the key, push it back to [Keybase][] with:

```none
$ keybase pgp update
```


## Export the updated public key to [GitHub][]

Export your local key to the clipboard with:

```none
$ keybase pgp export | pbcopy
```

Go to [GitHub][] > [Settings](https://github.com/settings/profile) > [SSH and GPG keys](https://github.com/settings/keys)

![](/images/2017/02/Screen-Shot-2017-02-08-at-11.52.57-pm.jpg)

Add a 'New GPG key', or 'Delete' your existing one first if you're updating it.


## Signing Git commits with your [Keybase][] key

Add `-S [YOUR_KEY_ID]` or `--gpg-sign=[YOUR_KEY_ID]` to your `git commit` commands to sign the commit using the specified key. You can replace `[YOUR_KEY_ID]` with any email address added as a uid in the key.

Run these lines to update your global config to sign git commits by default:

```none
$ git config --global user.signingkey [YOUR_KEY_ID]
$ git config --global core.gpgsign true
```

These can additionally be set or unset on a per-project basis.

Adding `--no-gpg-sign` to a `git commit` command will turn off signing for that commit only.

Adding `--show-signature` to `git log` commands will show signatures in the git commit log.

[keybase]: https://keybase.io/ "Keybase"
[gpgtools]: https://gpgtools.org/ "GPGTools"
[github]: https://github.com/ "GitHub"
