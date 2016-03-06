var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var expressHbs = require('express-handlebars');
var cookieParser = require('cookie-parser');
var uuid = require('uuid');
var fs = require('fs');

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(express.static('content'));
app.engine('hbs', expressHbs({ extname:'hbs', defaultLayout:'main.hbs' }));
app.set('view engine', 'hbs');

app.use(cookieParser());

var posts = {};

app.get('/', function(req, res) {
    res.render('index.hbs');
});

app.get('/logon', function(req, res) {
    res.render('logon.hbs', { error: '' });
});

app.get('/posts', function(req, res) {
     var authCookie = req.cookies.authentication;
    
    if(authCookie && authCookie != "") {
        
        var userPosts = posts[authCookie];
        res.render('posts.hbs', { username: authCookie, posts: userPosts });
    }
    else {
        res.redirect('/logon');
    }
});

app.get('/newpost', function(req, res) {    
    var authCookie = req.cookies.authentication;
    res.cookie("authentication", authCookie);
    res.render('newpost.hbs', { username: authCookie });
});

app.post('/newpost', function(req, res) {
    var thePost = { 
        title: req.body.title, 
        content: req.body.content 
        };
    var authCookie = req.cookies.authentication;
    
    if (!posts[authCookie])
    {
        posts[authCookie] = [];
    }
    
    posts[authCookie].push(thePost);
    
    res.cookie("authentication", authCookie);
    res.redirect('/posts');
});

app.get('/viewpost', function(req, res) {    
    var authCookie = req.cookies.authentication;
    res.cookie("authentication", authCookie);
    res.render('viewpost.hbs', { username: authCookie, content: posts[authCookie][0].content });
});

app.get('/signup', function(req, res) {     
    res.render('signup.hbs');
});

app.get('/logout', function(req, res) {    
    res.cookie('authentication', ""); 
    res.render('logout.hbs');
});

app.post('/logon', function(req, res) {    
    if (req.body.email == req.body.password) {            
        res.cookie('authentication', req.body.email);                      
        res.redirect('/posts');
    } else {
        res.render('logon.hbs', { error: "Invalid credentials."});
    } 
});


function loadState() {
    state = fs.readFile("state.json");
}

function saveState() {
    fs.writeFile("state.json", JSON.stringify(state));
}

app.listen(3000);