jsonMenu = require("./ExampleMenu.json")

function jsonParser(stringValue) {

    var string = JSON.stringify(stringValue);
    var objectValue = JSON.parse(string);
    return objectValue;
 }
 
 const menu = jsonParser(jsonMenu);

let fullMenu = '';
for(var i = 0; i < menu.fullMenu.length; i++){
    var cat = menu.fullMenu[i];
    for(var j = 0; j < cat.items.length; j++){
        fullMenu += " " + cat.items[j].name + ","
    }
}


 console.log(fullMenu);