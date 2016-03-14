var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var expressHbs = require('express-handlebars');
var cookieParser = require('cookie-parser');
var jsonfile = require('jsonfile');
var uuid = require('uuid');
var fs = require('fs');
var path = require('path'); 

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(express.static('content'));
app.engine('hbs', expressHbs({ extname:'hbs', defaultLayout:'main.hbs' }));
app.set('view engine', 'hbs');

app.use(cookieParser());

var posts = [];

app.get('/', function(req, res) {
    res.render('index.hbs');
});

app.get('/logon', function(req, res) {
    res.render('logon.hbs', { error: '' });
});

app.get('/posts', function(req, res) {	
    var authCookie = req.cookies.authentication;     
    if(authCookie && authCookie != "") {        
		posts = loadState(authCookie);
		var userPosts = [];
		if(posts !== [])
			userPosts = posts;		
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

	var authCookie = req.cookies.authentication;
	var id;

	if( !posts ){		
		id = 1;
	} else {
		var max = 0;
		for(i=0; i<posts.length; i++){
			if(posts[i].id > max)
			{
				max = posts[i].id;
			}
		}		
		id = max + 1;
	}		


    var thePost = { 
		id: id,
        title: req.body.title, 
        content: req.body.content 
        };    
    
    posts.push(thePost);
	saveState(posts, authCookie);
	
    res.cookie("authentication", authCookie);
    res.redirect('/posts');
	
});

app.get('/viewpost/:id', function(req, res) {    
    var authCookie = req.cookies.authentication;
	var id = req.params.id;

	var indx = -1;
	for(i=0; i<posts.length; i++){
		if(posts[i].id == id)
		{
			indx = i;
		}
	}	

    res.cookie("authentication", authCookie);	
	if( indx !== -1 )
		res.render('viewpost.hbs', { username: authCookie, content: posts[indx].content });
	else
		 res.redirect('/posts');

});

app.get('/deletepost/:id', function(req, res) {    

    var authCookie = req.cookies.authentication;
	var id = req.params.id;	
    res.cookie("authentication", authCookie);
	var indx = -1;
	for(i=0; i<posts.length; i++){
		if(posts[i].id == id)
		{
			indx = i;
		}
	}

	if(indx > -1)
	{
		posts.splice(indx,1);
	}
	
	saveState(posts, authCookie);		
    res.redirect('/posts');
	
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


function loadState(authCookie) {
    //state = fs.readFile("state.json");
	
	var file = './' + authCookie + '.json'; 
	if (fs.existsSync(file)) {
		return jsonfile.readFileSync(file);
	} else {
		var obj = [];		
		jsonfile.writeFileSync(file, obj);	
		return obj;
	}
	
}

function saveState(obj, authCookie) {
    //fs.writeFile("state.json", JSON.stringify(state));	
    
	var obj = posts;
	var file = './' + authCookie + '.json';	 
	jsonfile.writeFileSync(file, obj);
	
}

app.listen(3000);