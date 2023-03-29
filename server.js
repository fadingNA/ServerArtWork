const express = require('express');
const app = express();
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();
const userService = require("./user-service.js");
const passport = require("passport");
const passportJWT = require("passport-jwt")
const jwt = require('jsonwebtoken');
const HTTP_PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(cors());

// JSON Web Token Setup
let ExtractJwt = passportJWT.ExtractJwt;
let JwtStrategy = passportJWT.Strategy;
// COnfigure its options
let jwtOptions = {};
jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken('jwt');
jwtOptions.secretOrKey = process.env.JWT_SECRET

let token = jwt.sign({
    userName: 'bob'
}, 'secret', {
    expiresIn: 60 * 60
});
// tell passport to use our "strategy"
let strategy = new JwtStrategy(jwtOptions, function(jwt_payload,next){
    console.log('payload received', jwt_payload);
    if (jwt_payload){
        next(null,{
            _id: jwt_payload._id,
            userName: jwt_payload.userName,
            password: jwt_payload.password,
        })
    }else{
        next(null,false)
    }
})

// add passport as application-level middleware
app.use(passport.initialize());
passport.use(new JwtStrategy(jwtOptions, (jwt_payload, done) => {
    User.findOne({ _id: jwt_payload._id }, (err, user) => {
        if (err) {
            return done(err, false);
        }
        if (user) {
            return done(null, user);
        } else {
            return done(null, false);
        }
    });
}));

// set up a 'route' to listen on the default url path
app.get("/", (req, res) => {
    res.send("Test Assignment 6 Nonthachai Plodthong");
});

// setup http server to listen on HTTP_PORT

// setup http server to listen on HTTP_PORT


app.post("/api/user/register", (req, res) => {
    userService.registerUser(req.body)
        .then((msg) => {
            res.json({"message": msg});
        }).catch((msg) => {
        res.status(422).json({"message": msg + " test"});
    });
});

app.post("/api/user/login", (req, res) => {
    userService.checkUser(req.body)
        .then(user => {
            const payload = {
                _id: user._id,
                userName: user.userName
            };
            const token = jwt.sign(payload, process.env.JWT_SECRET);
            res.json({
                message: 'Login successful',
                token: token
            });
        })
        .catch(error => {
            res.status(401).json({ error: 'Invalid credentials' });
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