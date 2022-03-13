Files Manager
=============

This project had us build an express API MVC backend connecting to a mongodb with a redis session client. The app creates and stores users in the noSQL db, and then on login stores a session token for up to 24 hour or until logout with the redis client. Due to the use of redis, this app requires a unix environment and therefore will not run correctly in a windowns environment.

## Instructions

1. Make sure Redis Server is running

2. Run Express server with:
```
npm run start-server
```

Contributors:
<br>
[Rachel Lewis](https://www.github.com/rlewis11769)
<br>
[ay Calhoun](https://www.github.com/Valinor13)
