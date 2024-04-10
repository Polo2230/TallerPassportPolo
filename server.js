const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const PassportLocal = require("passport-local").Strategy;
const User = require('./schemas/user');

const app = express();

mongoose.connect("mongodb+srv://usuario1234:usuario1234@cluster0.q0g4e0n.mongodb.net/", {})
.then(() => console.log("Connected to MongoDB"))
.catch(err => console.error("Error connecting to MongoDB:", err));

app.use(express.urlencoded({ extended: true }));

app.use(cookieParser("my secure password"));

app.use(
  session({
    secret: "my secure password",
    resave: true,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new PassportLocal(async function (username, password, done) {
    try {
      const user = await User.findOne({ username: username });
      if (!user || user.password !== password) {
        return done(null, false);
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);


passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(async function (id, done) {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});


app.set("view engine", "ejs");

app.get(
  "/",
  (req, res, next) => {
    if (req.isAuthenticated()) return next();
    res.redirect("/login");
  },
  function (req, res) {
    res.send("Usuario Iniciado");
  }
);

app.get("/login", (req, res) => {
  res.render("login");
});

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
  })
);

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  try {
    const existingUser = await User.findOne({ username: username });
    if (existingUser) {
      return res.status(400).send("El usuario ya existe");
    }

    const newUser = new User({
      username: username,
      password: password
    });

    await newUser.save();
    res.render("register", { successMessage: "Usuario creado exitosamente" }); // Render the success message
  } catch (error) {
    console.error(error);
    res.status(500).send("Error en el servidor");
  }
});


app.listen(8080, () => console.log("Server started"));
