const Sequelize = require('sequelize');

var sequelize = new Sequelize('iuedpsho', 'iuedpsho', 'xOtxJ1OKwq1gqiXRDaypcn4X2NuTWWuK', {
    host: 'mahmud.db.elephantsql.com',
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
        ssl: { rejectUnauthorized: false }
    },
    query: { raw: true }
});

const Item = sequelize.define("Item", {
    body: Sequelize.TEXT,
    title: Sequelize.STRING,
    postDate: Sequelize.DATE,
    featureImage: Sequelize.STRING,
    published: Sequelize.BOOLEAN,
    price: Sequelize.DOUBLE

})

const Category = sequelize.define("Category", {
    category: Sequelize.STRING,
  });


Item.belongsTo(Category, {foreignKey: 'category'});

function initialize() {
    return new Promise((resolve, reject) => {
        sequelize
          .sync()
          .then(() => {
            resolve();
          })
          .catch(() => {
            reject("Unable to sync to the database.");
          });
      });
}

function getAllItems() {
    return new Promise((resolve, reject)=> {
        Item.findAll()
        .then(data => {
            resolve(data);
        })
        .catch(()=>{
            reject("No results returned")
        })

    })
}

function getPublishedItems() {
    return new Promise((resolve, reject)=> {
        Item.findAll({
            where: {
                published: true,
            },
        })
        .then(data => {
            resolve(data);
        })
        .catch(()=>{
            reject("No results returned")
        })

    })
}

function getCategories() {
    return new Promise((resolve, reject)=> {
        Category.findAll()
        .then(data => {
            resolve(data);
        })
        .catch(()=>{
            reject("No results returned")
        })

    })

}

function addItem(itemData){
    return new Promise ((resolve,reject) => {
        itemData.published = (itemData.published) ? true : false;

        for( const i in itemData){
            if (itemData[i] === ""){
                itemData[i] = null;
            }
        }

        itemData.postDate= new Date();

        Item.create(itemData)
        .then(data => {
            resolve(data);
        })
        .catch(()=>{
            reject("unable to create post")
        })
    })
}

function getItemsByCategories(category) {
    return new Promise((resolve,reject)=> {
        Item.findAll({
            where: {
                category: category,
            },
        })
        .then(data => {
            resolve(data);
        })
        .catch(()=>{
            reject("No results returned")
        })

    })
}

function getPublishedItemsByCategory(category) {
    return new Promise ((resolve, reject)=> {

        Item.findAll({
            where: {
                category: category,
                published: true,
            },
        })
        .then(data => {
            resolve(data);
        })
        .catch(()=>{
            reject("No results returned")
        })
    })
}

function getItemsByMinDate(minDate) {
    return new Promise ((resolve, reject)=> {
        Item.findAll({
            where: {
                postDate: {
                    [gte]: new Date(minDateStr)
                }
            }
        })
        .then(data => {
            resolve(data);
        })
        .catch(()=>{
            reject("No results returned")
        })
    })
}

function getItemById (id){
    return new Promise ((resolve, reject)=> {
        Item.findAll({
            where: {
                id: id,
            }
        })
        .then(data => {
            resolve(data);
        })
        .catch(()=>{
            reject("No results returned")
        })
    })
}

function addCategory(categoryData){
    return new Promise ((resolve,reject) => {
      
      for( const i in categoryData){
            if (categoryData[i] === ""){
                categoryData[i] = null;
            }
        }

        Category.create(categoryData)
        .then(data => {
            resolve(data);
        })
        .catch(()=>{
            reject("unable to create category")
        })

    })
}

function deleteCategoryById(id) {

    return new Promise((resolve, reject) => {
        Category.destroy( {
            where: {
                id: id,
            }
        })
        .then(()=> resolve("destroyed"))
        .catch(()=> {
            reject("unable to delete category")
        })
    })

}

function deleteItemById(id){
    return new Promise((resolve, reject) => {
        Item.destroy( {
            where: {
                id: id,
            }
        })
        .then(()=> resolve("destroyed"))
        .catch(()=> {
            reject("unable to delete item")
        })
    })
}

module.exports = { 
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
    deleteItemById
};