+++
title = "Running ghost with PM2 under a different user account on a Linux server"
date = "2015-06-15T13:17:00+10:00"
tags = ["ghost", "node.js", "linux"]
aliases = ["/running-ghost-under-a-different-user-account-on-a-linux-server"]
+++

When I first setup my [ghost] blog on my own server (a self-managed [Linode] which has been great and I highly recommend them), I installed [Node.js] directly under my main user account. I eventually ran into the problem of needing/wanting to use different versions of [Node.js] for different applications, so I uninstalled [Node.js] and installed/used [nvm] instead. It occurred to me that I might be better off running the [ghost] application under a different user account, so that it could manage it's own [nvm]/[Node.js] versions and global [npm] packages. I did nothing about it at the time, but I recently wanted to be able to run two applications which needed different [Node.js] versions simultaneously.

My [Linode] is running [CentOS] 7, but the process should be pretty similar across Linux distributions, this is an overview of how I'm setup to run [ghost]:

* [Node.js] and [npm] are installed and managed by [nvm]
* The [ghost] application is setup under `/var/www/benbooth.co`
* [nginx] is being used as a reverse proxy to forward requests to the [ghost] application
* The [ghost] application is always running and starts on server start using [PM2]
* [Keymetrics] monitoring through [PM2]


## Create the new user

Let's get started, firstly you'll need to create the new user:

```none
[user]$ sudo useradd [username]
```

I'm creating a user called `ghost` to run my blog, so I'd run `sudo useradd ghost` (tip: to fully delete the user including home directory, use `sudo userdel -r ghost`). If you want to set a password for the new user type `passwd [username]`. I don't want to be able to login directly to this user, so I'm not going to set a password, we can switch to the new user by typing:

```none
[user]$ sudo su ghost
```

Which switches to the new user, but stays in the same working directory. Pass the `-l` (or just `-`) option to login to the new users' home directory (eg. `sudo su - ghost`).


## Setup [Node.js] using [nvm]

Next we need to install [nvm] and then install [Node.js]. Download and run the [nvm] installer script (this is the latest version at the time of writing, check the [nvm GitHub repo][nvm] for the latest version). If you haven't already, change to the new user first `sudo su - ghost`.

```none
[ghost]$ curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.25.4/install.sh | bash
```

Then install a [Node.js] version and tag it as `default`. (You might need to `source ~/.bashrc` before you use [nvm] if you just installed it):

```none
[ghost]$ nvm install 0.10
[ghost]$ nvm alias default 0.10
```

At the time of writing, [ghost] requires [Node.js] version `0.10.*` (`0.10.38` is the latest at the time of writing).


## Install [PM2]

Installing [PM2] is a straight-forward [npm] global install:

```none
[ghost]$ npm install -g pm2
```


# Stop the existing [ghost] instance

Next, if you haven't already, stop the existing [ghost] instance running under your user account (`exit` the `ghost` user shell to take you back to your user shell):

```none
[user]$ pm2 stop ghost
[user]$ pm2 delete ghost
[user]$ pm2 save
```

This is assuming you were already running the blog using [PM2] with the name `ghost`. `pm2 save` dumps the list of currently running processes to file so it can be restored later, this is one part of keeping [ghost] running even after the server restarts. To cleanup the rest, run these commands too (we'll set these up again with the new user account):

```none
[user]$ sudo chkconfig --del pm2-init.sh
[user]$ sudo rm /etc/init.d/pm2-init.sh
[user]$ sudo rm /var/lock/subsys/pm2-init.sh
```


## Run the [ghost] application under the new user account

Next you'll need to get [ghost] running under the new user account. Firstly, change the ownership of all files (my [ghost] instance is installed to `/var/www/benbooth.co`):

```none
[user]$ cd /var/www/
[user]$ sudo chown -R ghost:ghost benbooth.co/
```

I don't think it would be necessary, but just to be sure, I cleared out the `node_modules` and re-installed the dependencies under the new user account (remember to change to the new user account):

```none
[user]$ sudo su ghost
[ghost]$ cd benbooth.co/
[ghost]$ rm -rf node_modules/*
[ghost]$ npm install --production
```

Finally, run the [ghost] application using [PM2] and save the running [PM2] processes to file:

```none
[ghost]$ NODE_ENV=production pm2 start index.js --name "ghost"
[ghost]$ pm2 save
```


## Persist [ghost] application across server restarts

Keeping [PM2] and your [ghost] application running across server restarts is a little different depending on your OS/distribution, but [PM2] will try to help you as much as possible. Just run:

```none
[ghost]$ pm2 startup [platform]
```

For me, running [CentOS], I run `pm2 startup centos`. This will not work because it needs to be run using `sudo` and I don't want to give my `ghost` user `sudo` permission. It will give you a full command that you can run using `sudo` but linked to the `ghost` user, copy that command. Now `exit` from the `ghost` shell back to your user shell and either run the copied command using `sudo`, or `sudo su` to get a `root` shell, and then run the copied command.

At this stage I found that the startup script wasn't actually bringing up the [PM2] daemon, I had to manually edit the `/etc/init.d/pm2-init.sh` file to fix an issue (I'm assuming this is a bug, so should be temporary):

```none
[user]$ sudo vim /etc/init.d/pm2-init.sh
```

Look for the line `USER=[username]`. In my case, this was set to `USER=root` and I just had to change it to `USER=ghost` and save the file.


## Extra: Add [Keymetrics] monitoring

[Keymetrics] offers good *free* monitoring for [PM2] applications, if you haven't already, [register][PM2] for an account. You'll get a **private key** and a **secret key**. Linking it to your [PM2] instance is super-simple:

```none
[ghost]$ pm2 link [YOUR_SECRET_KEY] [YOUR_PUBLIC_KEY]
```

If you keep an eye on the [Keymetrics] dashboard, you should start seeing a heartbeat from your server shortly.

If you already had [Keymetrics] running under your user account, and aren't running any other [PM2] applications, feel free to delete the [Keymetrics] link:

```none
[user]$ pm2 link delete [YOUR_PUBLIC_KEY]
```

[ghost]: https://ghost.org
[Linode]: https://www.linode.com/?r=92a203d4e391cd917cd9c6e351e7c2e3c2ddd294
[Node.js]: https://nodejs.org/
[nvm]: https://github.com/creationix/nvm
[npm]: https://www.npmjs.com/
[CentOS]: https://www.centos.org/
[nginx]: http://nginx.org/en/
[PM2]: https://github.com/Unitech/pm2
[Keymetrics]: https://app.keymetrics.io/#/register
