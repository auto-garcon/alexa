// Lambda Function code for Alexa.
// Paste this into your index.js file. 
//Testing functionality

// const Alexa = require("ask-sdk-core");
// const https = require("https");
const fetch = require('node-fetch');




// let jsonDinnerMenu = require("./dinner_menu.json")
// let jsonDrinkMenu = require("./drink_menu.json")
// const invocationName = "auto garcon";
var finalDinnerMenu;
async function fetch_data() {
    let result = fetch("https://autogarcon.live/api/restaurant/5/menu");
    result = await result;
    result = result.json();
    result = await result;
    var dinnerMenu=[];
    for (var i = 0; i < result.length; i++) {
        if (result[i].status === "ACTIVE") {
            for (var item = 0; item < result[i].menuItems.length; item++) {
                dinnerMenu.push(result[i].menuItems[item]);
            }
        }
    }
    return dinnerMenu;
}
//finalDinnerMenu=fetch_data().then(result=>{console.log(result)});
//console.log("2: "+finalDinnerMenu)

// jsonDinnerMenu = [];
// async function compileMenus(){

//     menu = fetch_data().then(result => {
//     //jsonDinnerMenu=[];
//     for (var i = 0; i < result.length; i++) {
//         if (result[i].status === "ACTIVE") {
//             for (var item = 0; item < result[i].menuItems.length; item++) {
//                 jsonDinnerMenu.push(result[i].menuItems[item]);
//             }
//             //console.log(result[i].menuItems)
//             // jsonDinnerMenu.concat(result[i].menuItems);
//             //console.log(i)
//             //console.log(jsonDinnerMenu);
//         }
//     }
//     });
// }
//return menu;
//}
// compileMenus();
// console.log(menu)

//setTimeout(function () { console.log(jsonDinnerMenu) }, 1500); //Takes somewhere between 1 to 1.5 seconds to process


////////////////////////////////////////////////////////////

var restaurantID = 5;
var tableNumber = 1;

var order = [{ a: 1 }];


var submitOrderPath = '/api/restaurant/'+restaurantID+'/tables/'+tableNumber+'/order/submit';
async function submitOrder(){

    let endpoint = 'https://autogarcon.live/api/restaurant/'+restaurantID+'/tables/'+tableNumber+'/order/submit';
    let res = fetch(endpoint, {
        method: 'post'
    })
    .then(res => res.status);
    setTimeout(function () { console.log(res) }, 1500);
    
}

//submitOrder();


var item = { 
    "menuItemID": 2, 
    "menuID":8,
    "quantity":1,
    "comments":""
};

var addToOrderPath = '/api/restaurant/'+restaurantID+'/tables/'+tableNumber+'/order/add';
async function addToOrder(){
    let endpoint = 'https://autogarcon.live/api/restaurant/'+restaurantID+'/tables/'+tableNumber+'/order/add';
    let res = await fetch(endpoint, {
        method: 'post',
        body: JSON.stringify(item),
        headers: { 'Content-Type': 'application/json' }
    })
    .then(res => res.status);
    setTimeout(function () { console.log(res) }, 1500);
    
}
//newOrder();
//addToOrder();

var customer = {"customerID":1}
async function newOrder(){
    let endpoint = 'https://autogarcon.live/api/restaurant/'+restaurantID+'/tables/'+tableNumber+'/order/new';
    console.log(endpoint);
    let res = await fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(customer),
        headers: { 'Content-Type': 'application/json' }
    })
    .then(res => res.status);
    setTimeout(function () { console.log(res) }, 1500);
}



const https = require('https');

var customer = {"customerID":1};
var newOrderPath='/api/restaurant/'+restaurantID+'/tables/'+tableNumber+'/order/new';
function httpsPost(path,body){
    var options = {
    hostname: 'autogarcon.live',
    path: path,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        }
    };

    var req = https.request(options, (res) => {
    console.log('statusCode:', res.statusCode);
    //console.log('headers:', res.headers);

    // res.on('data', (d) => {
    //     process.stdout.write(d);
    // });
    });
    req.write(JSON.stringify(body));
    req.end();

}
async function httpsEmptyPost(path){
    var options = {
    hostname: 'autogarcon.live',
    path: path,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        }
    };
    var req = https.request(options, (res) => {
        console.log('statusCode:', res.statusCode);
    });
    req.write(`{}`);
    req.end();
}

//httpsPost(newOrderPath,customer);
//httpsPost(addToOrderPath,item);
httpsEmptyPost(submitOrderPath);

/*
const body = { a: 1 };
 
fetch('https://httpbin.org/post', {
        method: 'post',
        body:    JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
    })
    .then(res => res.json())
    .then(json => console.log(json));
*/

////////////////////////////////////////////////////////////////
/*
const Taxjar = require('taxjar');
const client = new Taxjar({
    apiKey: "2837ad1585b8764c100a248d138eacfd"
});

//float
var orderTotal;
//zip needs to be a string
var zip;
//state needs to be a string of the state 2-letter abbreviation in caps
var state;

var tax;

orderTotal = 100;
zip = '55105';
state = "MN";

client.taxForOrder({
    // from_country: 'US',
    // from_zip: '92093',
    // from_state: 'CA',
    // from_city: 'La Jolla',
    // from_street: '9500 Gilman Drive',
    to_country: 'US',
    to_zip: zip,
    to_state: state,
    //to_city: 'St. Paul',
    //to_street: '2115 Summit Ave',
    amount: 100.00,
    shipping: 0,
    nexus_addresses: [
      {
        id: 'Main Location',
        country: 'US',
        zip: zip,
        state: state,
        //city: 'St. Paul',
        //street: '2215 Summit Ave'
      }
    ]
    // line_items: [
    //   {
    //     id: '1',
    //     quantity: 1,
    //     product_tax_code: '20010',
    //     unit_price: 15,
    //     discount: 0
    //   }
    // ]
  }).then(res => {
    res.tax; // Tax object
    res.tax.amount_to_collect; // Amount to collect
    tax = res.tax.amount_to_collect
    console.log(tax)
    // console.log(res.tax)
    // console.log(res.tax.amount_to_collect);
  });



//because of async, this gets evaluated before tax gets set to a value
console.log(tax)


  */
 //////////////////////



/*

jsonDinnerMenu = require("./dinner_menu.json")
jsonDrinkMenu = require("./drink_menu.json")


function jsonParser(stringValue) {

    var string = JSON.stringify(stringValue);
    var objectValue = JSON.parse(string);
    return objectValue;
}

const dinnerMenu = jsonParser(jsonDinnerMenu);
const drinkMenu = jsonParser(jsonDrinkMenu);


var categories = [];
var catIndex = 0;
function ListOfCategories() {
    for (var i = 0; i < dinnerMenu.items.length; i++) {
        if (categories.length == 0) {
            categories[catIndex] = dinnerMenu.items[i].category;
            catIndex += 1;
            //console.log(dinnerMenu.items[i].category);
        }
        else{
            var alreadyIn = 0;
            for (var j = 0; j < categories.length; j++) {
                if(dinnerMenu.items[i].category == categories[j]){
                    alreadyIn=1;
                }
            }
            if(alreadyIn!=1){
                categories[catIndex] = dinnerMenu.items[i].category;
                catIndex += 1;
                alreadyIn =0;
            }
        }
    }
    for (var i = 0; i < drinkMenu.items.length; i++) {
        if (categories.length == 0) {
            categories[catIndex] = drinkMenu.items[i].category;
            catIndex += 1;
            //console.log(dinnerMenu.items[i].category);
        }
        else{
            var alreadyIn = 0;
            for (var j = 0; j < categories.length; j++) {
                if(drinkMenu.items[i].category == categories[j]){
                    alreadyIn=1;
                }
            }
            if(alreadyIn!=1){
                categories[catIndex] = drinkMenu.items[i].category;
                catIndex += 1;
                alreadyIn =0;
            }
        }
    }

}


//ListOfCategories();
var catString = '';
for (var j = 0; j < categories.length; j++) {
    catString += categories[j]+ ", ";
}

//console.log(catString);


var listOfDrinks = " ";
for (var i = 0; i < drinkMenu.items.length; i++) {
    listOfDrinks += drinkMenu.items[i].name + ", "
}


var currentOrder = [];
var say = "";

//this will return an object based on a text string match with the name of the item
function FindItem(itemName){
    for (var i = 0; i < dinnerMenu.items.length; i++) {
        if(dinnerMenu.items[i].name.toLowerCase() == itemName.toLowerCase()){
            return dinnerMenu.items[i];
        }
    }
    for (var i = 0; i < drinkMenu.items.length; i++) {
        if(drinkMenu.items[i].name.toLowerCase() == itemName.toLowerCase()){
            return drinkMenu.items[i];
        }
    }
}

function AddToOrder(itemObject){
    var lenOfOrder = currentOrder.length;
    currentOrder[lenOfOrder] = itemObject;
}

function GetPrice(itemObject){
    say = itemObject.price;
}
function GetDescription(itemObject){
    say = itemObject.description;
}

function ReadCurrentOrder(){
    if(currentOrder.length == 0){
        say = "There are currently no items in your order";
    }
    else{
        for(var i =0; i < currentOrder.length; i++){
            say += currentOrder[i].name + ", ";
        }
    }
}


// AddToOrder(FindItem("Cheesecurds"));
// AddToOrder(FindItem("Mini Tacos"));
// ReadCurrentOrder();
// GetDescription(FindItem("Merlot"));
// //GetPrice(FindItem("Cheesecurds"));
// console.log(say);
*/