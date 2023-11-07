
var express = require("express");
var path=require("path");
var app = express();
const multer = require("multer");
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const exphbs = require('express-handlebars');
const stripJs = require("strip-js");
const itemData = require("./store-service");
const authData= require("./auth-service.js");
const clientSessions= require("client-sessions");

const {
  initialize, 
  getPublishedItems, 
  getAllItems, 
  getCategories, 
  addItem,
  getItemById, 
  getItemsByCategories, 
  getPublishedItemsByCategory, 
  getItemsByMinDate,
  addCategory,
  deleteCategoryById,
  deleteItemById}= require("./store-service.js");


app.engine('.hbs', exphbs.engine({ extname: '.hbs' }));
app.set('view engine', '.hbs');


cloudinary.config({
  cloud_name: 'dmomoat3v',
  api_key: '183847199238358',
  api_secret: 's-cLcLEd-4JkoVM5Ch_wX1E3Ebg',
  secure: true
});

const upload = multer(); // no { storage: storage } since we are not using disk storage

app.use(express.static('public')); //uses public folder as static folder

//creating client session
app.use(clientSessions({
  cookieName: "clientSession",
  secret: "web322storeApp",
  duration: 2 * 60 * 1000,
  activeDuration: 60 * 1000
}));

app.use(function(req, res, next) {
  res.locals.session = req.session;
  next();
});

//function to validate login
function ensureLogin(req, res, next) {
  if (!req.session.user) {
    res.redirect("/login");
  } else {
    next();
  }
}

app.use(function(req,res,next){
  let route = req.path.substring(1);
  app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
  app.locals.viewingCategory = req.query.category;
  next();
});



app.use(express.urlencoded({extended: true}));

//helper functions
app.engine('.hbs', exphbs.engine({ 
  extname: '.hbs',
  helpers: { 
      navLink: function(url, options){
         return (
          '<li class="nav-item"><a ' + 
          (url == app.locals.activeRoute ? ' class="nav-link active" ' : ' class="nav-link" ') +
          ' href="' +
          url +
          '">'+
          options.fn(this) + 
          "</a<M/li>" 
         );
      },
      equal: function (lvalue, rvalue, options) {
        if (arguments.length < 3)
            throw new Error("Handlebars Helper equal needs 2 parameters");
        if (lvalue != rvalue) {
            return options.inverse(this);
        } else {
            return options.fn(this);
        }
    },
    safeHTML: function (context) {
      return stripJs(context);
    },
    formatDate: function(dateObj){
      let year = dateObj.getFullYear();
      let month = (dateObj.getMonth() + 1).toString();
      let day = dateObj.getDate().toString();
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2,'0')}`;
  }  
    
  }
}));



var HTTP_PORT = process.env.PORT || 8080; //the port the app uses

function onHttpStart() {
    console.log("Express http server listening on: " + HTTP_PORT);
  }

//*********************************************************************************
// setup a 'route' to listen on the default url path
app.get("/", (req,res) => {
    res.redirect("/shop");
  });



//*********************************************************************************
//route for about page
  app.get("/about", (req, res) => {
    res.render("about");
})

//*********************************************************************************
//route for shop page
app.get("/shop", async (req, res) => {
  // Declare an object to store properties for the view
  let viewData = {};

  try {
    // declare empty array to hold "post" objects
    let items = [];

    // if there's a "category" query, filter the returned posts by category
    if (req.query.category) {
      // Obtain the published "posts" by category
      items = await itemData.getPublishedItemsByCategory(req.query.category);
    } else {
      // Obtain the published "items"
      items = await itemData.getPublishedItems();
    }

    // sort the published items by postDate
    items.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));

    // get the latest post from the front of the list (element 0)
    let item = items[0];

    // store the "items" and "post" data in the viewData object (to be passed to the view)
    viewData.items = items;
    viewData.item = item;
  } catch (err) {
    viewData.message = "no results";
  }

  try {
    // Obtain the full list of "categories"
    let categories = await itemData.getCategories();

    // store the "categories" data in the viewData object (to be passed to the view)
    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = "no results";
  }

  // render the "shop" view with all of the data (viewData)
  res.render("shop", { data: viewData });
});



//*********************************************************************************
//item route
  app.get('/items', ensureLogin, (req, res) => {

    console.log(req.query.category);
    if (req.query.category) {
      getPublishedItemsByCategory(req.query.category)
        .then((data) => {
          data.length > 0
            ? res.render("items", { items: data })
            : res.render("items", { message: "No Results" });
        })
        .catch((err) => {
          res.render("items", { message: "no results" });
        });
    }
    else if (req.query.minDate) {
      getItemsByMinDate(req.query.minDate)
        .then((data) => {
          data.length > 0
            ? res.render("items", { posts: data })
            : res.render("items", { message: "No Results" });
        })
        .catch((err) => {
          res.render("items", { message: "no results" });
        });
    }
    else {
      getAllItems()
        .then((data) => {
          data.length > 0
            ? res.render("items", { items: data })
            : res.render("items", { message: "No Results" });
        })
        .catch((err) => {
          res.render("items", { message: "no results" });
        });
    }
  
  });

//*********************************************************************************
  //category route
  app.get("/categories", ensureLogin, (req, res) => {
    getCategories()
    .then((data)=>{
      if(data.length > 0){
        res.render("categories", {categories: data});

      }else{
        res.render("categories", { message: "No Results" });
      }
     
    })
    .catch((err)=> {
      res.render("categories", {message: "no results"});
    })
  });

//*********************************************************************************
//adding new items 
  app.get("/items/add", ensureLogin, (req, res) => {
    getCategories()
    .then((categories) => {
      res.render("addItems", { categories: categories});
    })
    .catch(() =>{
      res.render("addItems", {categories: []});
    })
    
  })

  app.post("/items/add", ensureLogin, upload.single("featureImage"), (req, res) => {
    if(req.file){
      let streamUpload = (req) => {
          return new Promise((resolve, reject) => {
              let stream = cloudinary.uploader.upload_stream(
                  (error, result) => {
                      if (result) {
                          resolve(result);
                      } else {
                          reject(error);
                      }
                  }
              );
  
              streamifier.createReadStream(req.file.buffer).pipe(stream);
          });
      };
  
      async function upload(req) {
          let result = await streamUpload(req);
          console.log(result);
          return result;
      }
  
      upload(req).then((uploaded)=>{
          processItem(uploaded.url);
      });
  }else{
      processItem("");
  }
   
  function processItem(imageUrl){
      req.body.featureImage = imageUrl;
  
      // TODO: Process the req.body and add it as a new Item before redirecting to /items
      let postItem = {};

      postItem.category=req.body.category;
      postItem.postDate= req.body.postDate;
      postItem.featureImage= req.body.featureImage;
      postItem.price=req.body.price;
      postItem.title= req.body.title;
      postItem.body= req.body.body;
      postItem.published= req.body.published;

      if(postItem.title){
        addItem(postItem);
      }
  }
  res.redirect("/items");
  })
//*********************************************************************************
//query items by id 
  app.get("/item/:value", ensureLogin, (req, res) => {
    getItemById(req.params.value)
    .then((data)=>{
      res.send(data);
    }
    ).catch((err)=> {
      res.send(err);
    })
  })

  app.get('/shop/:id', ensureLogin, async (req, res) => {

    // Declare an object to store properties for the view
    let viewData = {};
  
    try{
  
        // declare empty array to hold "item" objects
        let items = [];
  
        // if there's a "category" query, filter the returned posts by category
        if(req.query.category){
            // Obtain the published "posts" by category
            items = await itemData.getPublishedItemsByCategory(req.query.category);
        }else{
            // Obtain the published "posts"
            items = await itemData.getPublishedItems();
        }
  
        // sort the published items by postDate
        items.sort((a,b) => new Date(b.postDate) - new Date(a.postDate));
  
        // store the "items" and "item" data in the viewData object (to be passed to the view)
        viewData.items = items;
  
    }catch(err){
        viewData.message = "no results";
    }
  
    try{
        // Obtain the item by "id"
        viewData.item = await itemData.getItemById(req.params.id);
    }catch(err){
        viewData.message = "no results"; 
    }
  
    try{
        // Obtain the full list of "categories"
        let categories = await itemData.getCategories();
  
        // store the "categories" data in the viewData object (to be passed to the view)
        viewData.categories = categories;
    }catch(err){
        viewData.categoriesMessage = "no results"
    }
  
    // render the "shop" view with all of the data (viewData)
    res.render("shop", {data: viewData})
  });

  //*********************************************************************************
  //add category route
  app.get("/categories/add", ensureLogin, (req, res) => {
    res.render("addCategory");
  })

  app.post("/categories/add", ensureLogin, (req,res) => {
    let obj = {}
    obj.category = req.body.category;
    console.log(req.body.category);
    if(req.body.categort !=""){
      addCategory(obj)
      .then(()=> {
        res.redirect("/categories");
      }) 
      .catch(() => {
        console.log("Error");
      });
    }
  })

  //*********************************************************************************
  //deleting item and category
  app.get("/categories/delete/:id", ensureLogin, (req, res) => {
    deleteCategoryById(req.params.id)
    .then(() => {
      res.redirect("/categories");
    })
    .catch(() => {
      console.log("Unable to remove category / Category not found");
    });
  })

  app.get("/item/delete/:id" , ensureLogin,(req, res) => {
    deleteItemById(req.params.id)
    .then(() => {
      res.redirect("/items");
    })
    .catch(() => {
      res.status(500).send("Unable to Remove Item / Item not found")
    });
  })

  //*********************************************************************************
  //login route
  app.get("/login", (req,res) =>{
    res.render("login");
  })

  
  app.post("/login", (req,res)=> {
    req.body.userAgent = req.get('User-Agent');
    authData.checkUser(req.body).then((user) => {
      req.session.user = {
          userName: user.userName,// authenticated user's userName
          email: user.email,// authenticated user's email
          loginHistory: user.loginHistory// authenticated user's loginHistory
      };
      res.redirect('/items');
  }).catch((err) => {
    res.render('login', {errorMessage: err, userName: req.body.userName})
  });
  })

  //*********************************************************************************
  //register route
  app.get("/register", (req,res)=> {
    res.render("register");

  })

  app.post("/register", (req,res)=> {
    authData.registerUser(req.body)
    .then(()=>{
      res.render('register',{successMessage: "User created"} )
    }).catch((err)=>{
      res.render('register', {errorMessage: err, userName: req.body.userName} )
    }) 
  })

  //*********************************************************************************
  //404 page
  app.use((req, res) => {
    res.status(404).send("404 PAGE NOT AVAILABLE")
  })


  //*********************************************************************************
  //logout route
  app.get("logout", (req, res) =>{
    req.session.reset();
    res.redirect("/");
  })

  //*********************************************************************************
  //userHistory route
  app.get("/userHistory", ensureLogin, (req,res)=>{
    res.render("userHistory");
  })

//*********************************************************************************
// setup http server to listen on HTTP_PORT

itemData.initialize()
.then(authData.initialize)
.then(function(){
    app.listen(HTTP_PORT, function(){
        console.log("app listening on: " + HTTP_PORT)
    });
}).catch(function(err){
    console.log("unable to start server: " + err);

});

//
//

