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