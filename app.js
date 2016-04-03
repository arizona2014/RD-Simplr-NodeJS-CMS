var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var expressHbs = require('express-handlebars');
var cookieParser = require('cookie-parser');
var jsonfile = require('jsonfile');
var uuid = require('uuid');
var fs = require('fs');
var path = require('path'); 
var Handlebars = require('handlebars');

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(express.static('content'));
app.engine('hbs', expressHbs({ extname:'hbs', defaultLayout:'main.hbs' }));
app.set('view engine', 'hbs');
app.use(cookieParser());


var posts = [];
var meta = [];

app.get('/', function(req, res) {
    res.render('index.hbs');
});

app.get('/logon', function(req, res) {
    res.render('logon.hbs', { error: '' });
});

app.get('/posts', function(req, res) {	
    var authCookie = req.cookies.authentication;     
    if(authCookie && authCookie != "") {        
		posts = loadStatePosts(authCookie);
		meta = loadStateMeta(authCookie);
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
    
    var theMeta = { 
			id: id,
			meta: req.body.meta
        };    	
	
    posts.push(thePost);
	meta.push(theMeta);
	saveState(authCookie);
	
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
	
	if( indx !== -1 ){		

		var ctn = posts[indx].content;
		var pos1 = ctn.indexOf("###hbs_start###") + 15; 
		var pos2 = ctn.indexOf("###hbs_stop###"); 
		var dimension = pos2 - pos1;
		var hbs = ctn.substr(pos1, dimension);			
		var days = meta[indx].meta;		
		var objdays = JSON.parse(days);	
		
		if(hbs){
		
			var template = Handlebars.compile(hbs);
			var result = template(objdays);
			
			var fs = require('fs');
				fs.writeFile("./views/view.hbs", result, function(err) {
				if(err) {
					return console.log(err);
				}
				res.render('view.hbs');
			});											
			
		} else {
			console.log('nu exista hbs');
			var data = {
				username: authCookie, 
				content: posts[indx].content
			};
			
			res.render('viewpost.hbs', data);						
		}

	}		
	else
		 res.redirect('/posts');
	 
});

app.get('/editpost/:id', function(req, res) {    
    var authCookie = req.cookies.authentication;
	var id = req.params.id;
	
	var indx = -1;
	for(i=0; i<posts.length; i++){
		if(posts[i].id == id)
		{
			//console.log("id = " + id + " post has also " + posts[i].id);
			indx = i;
		}
		else 
		{
			//console.log("id = " + id + " post has " + posts[i].id);
		}
	}
	
    res.cookie("authentication", authCookie);	
	if( indx !== -1 )
		res.render('editpost.hbs', { username: authCookie, title:posts[indx].title, content: posts[indx].content, meta: meta[indx].meta });
	else
		 res.redirect('/posts');
});


app.post('/editpost/:id', function(req, res) {
    var authCookie = req.cookies.authentication;
	var id = req.params.id;

	if( !id || id<0 ){		
		res.redirect('/posts');	
	}

    var thePost = { 
			id: id,
			title: req.body.title, 
			content: req.body.content 
        };    
    
    var theMeta = { 
			id: id,
			meta: req.body.meta
       };    	
	
    posts.push(thePost);
	meta.push(theMeta);
	saveState(authCookie);
	
    res.cookie("authentication", authCookie);
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

function loadStatePosts(authCookie) {
	var file = './' + authCookie + '.json'; 
	if (fs.existsSync(file)) {		
		var obj = jsonfile.readFileSync(file);						
		return obj[0]["posts"];		
	} else {
		var obj = [];		
		jsonfile.writeFileSync(file, obj);	
		return obj;
	}	
}

function loadStateMeta(authCookie) {    	
	var file = './' + authCookie + '.json'; 
	if (fs.existsSync(file)) {
		var obj = jsonfile.readFileSync(file);		
		return obj[1]["metadata"];	
	} else {
		var obj = [];		
		jsonfile.writeFileSync(file, obj);	
		return obj;
	}	
}


function saveState(authCookie) {    
	var obj = [];
	obj.push({"posts":posts}) ;
	obj.push({"metadata":meta});
	var file = './' + authCookie + '.json';	 
	jsonfile.writeFileSync(file, obj);	
}

app.listen(3000);