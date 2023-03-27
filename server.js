const express = require('express');
const app = express();
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();
const userService = require("./user-service.js");
const passport = require("passport");
const passportJWT = require("passport-jwt")
const jwt = require('jsonwebtoken');
const {flatten} = require("express/lib/utils");
const HTTP_PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(cors());

// JSON Web Token Setup
let ExtractJwt = passportJWT.ExtractJwt;
let JwtStrategy = passportJWT.Strategy;
// COnfigure its options
let jwtOptions = {};
jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme('jwt');
jwtOptions.secretOrKey = process.env.JWT_SECRET

var str = new JwtStrategy(jwtOptions, function (jwt_payload, next) {
    console.log('payload received', jwt_payload);

    if (jwt_payload) {
        // The following will ensure that all routes using
        // passport.authenticate have a req.user._id, req.user.userName, req.user.fullName & req.user.role values
        // that matches the request payload data
        next(null, {
            _id: jwt_payload._id,
            userName: jwt_payload.userName,
        });
    } else {
        next(null, false);
    }
});

// tell passport to use our "strategy"
passport.use(str);

// add passport as application-level middleware
app.use(passport.initialize());


// setup a 'route' to listen on the default url path
app.get("/", (req, res) => {
    res.send("Test Assignment 6 Nonthachai Plodthong");
});

// setup http server to listen on HTTP_PORT

// setup http server to listen on HTTP_PORT


app.post("/api/user/register", passport.authenticate('jwt', {session: false}), (req, res) => {
    userService.registerUser(req.body)
        .then((msg) => {
            res.json({"message": msg});
        }).catch((msg) => {
        res.status(422).json({"message": msg});
    });
});

app.post("/api/user/login", passport.authenticate('jwt', {session: false}), (req, res) => {
    userService.checkUser(req.body)
        .then((user) => {
            var payload = {
                _id: user._id,
                userName: user.userName,
            };
            var token = jwt.sign(payload, jwtOptions.secretOrKey);
            res.json({message: 'login done', token: token});
        }).catch(msg => {
        res.status(422).json({"message": msg});
    });
});

app.get("/api/user/favourites", passport.authenticate('jwt', {session: false}), (req, res) => {
    userService.getFavourites(req.user._id)
        .then(data => {
            res.json(data);
        }).catch(msg => {
        res.status(422).json({error: msg});
    })

});

app.put("/api/user/favourites/:id", passport.authenticate('jwt', {session: false}), (req, res) => {
    userService.addFavourite(req.user._id, req.params.id)
        .then(data => {
            res.json(data)
        }).catch(msg => {
        res.status(422).json({error: msg});
    })
});

app.delete("/api/user/favourites/:id", passport.authenticate('jwt', {session: false}), (req, res) => {
    userService.removeFavourite(req.user._id, req.params.id)
        .then(data => {
            res.json(data)
        }).catch(msg => {
        res.status(422).json({error: msg});
    })
});

app.get("/api/user/history", passport.authenticate('jwt', {session: false}), (req, res) => {
    userService.getHistory(req.user._id)
        .then(data => {
            res.json(data);
        }).catch(msg => {
        res.status(422).json({error: msg});
    })

});

app.put("/api/user/history/:id", passport.authenticate('jwt', {session: false}), (req, res) => {
    userService.addHistory(req.user._id, req.params.id)
        .then(data => {
            res.json(data)
        }).catch(msg => {
        res.status(422).json({error: msg});
    })
});

app.delete("/api/user/history/:id", passport.authenticate('jwt', {session: false}), (req, res) => {
    userService.removeHistory(req.user._id, req.params.id)
        .then(data => {
            res.json(data)
        }).catch(msg => {
        res.status(422).json({error: msg});
    })
});

userService.connect()
    .then(() => {
        app.listen(HTTP_PORT, () => {
            console.log("API listening on: " + HTTP_PORT)
        });
    })
    .catch((err) => {
        console.log("unable to start the server: " + err);
        process.exit();
    });