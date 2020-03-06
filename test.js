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


AddToOrder(FindItem("Cheesecurds"));
AddToOrder(FindItem("Mini Tacos"));
ReadCurrentOrder();
//GetPrice(FindItem("Cheesecurds"));
console.log(say);