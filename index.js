// Lambda Function code for Alexa.
// Paste this into your index.js file. 
// Testing functionality

const Alexa = require("ask-sdk-core");
const https = require("https");
const fetch = require('node-fetch');

const invocationName = "auto garcon";
var alexaID = '';
var restaurantID = '';
var tableNum = '';
var restaurantName = '';
var customerID = '';

//fetchData: gets the available menus from the database.
//Authors: Jack
async function fetchData(restaurantID) {
    let endpoint = 'https://autogarcon.live/api/restaurant/' + restaurantID + '/menu/available';
    let result = fetch(endpoint);
    result = await result;
    result = result.json();
    result = await result;
    return result;
};

//fetchRestaurant: gets the restaurant based on the alexa ID from the database.
//Authors: Ben
async function fetchRestaurant(alexaID) {
    let res = fetch("https://autogarcon.live/api/tables?alexaid=" + alexaID);
    res = await res;
    res = res.json();
    res = await res;

    return res;
};
//fetchTables: gets the tables associated with a restaurant.
//Authors: Ben
async function fetchTables(restaurantID) {
    let res = fetch("https://autogarcon.live/api/restaurant/" + restaurantID + "/tables");
    res = await res;
    res = res.json();
    res = await res;
    return res;
};
//fetchRestaurantName: gets restaurant specific data from the database.
//Authors: Ben
async function fetchRestaurantName(restaurantID) {
    let res = fetch("https://autogarcon.live/api/restaurant/" + restaurantID);
    res = await res;
    res = res.json();
    res = await res;
    return res;
};
//httpsPost: Posts to the https endpoint
//Authors: Max
function httpsPost(path, body) {
    var options = {
        hostname: 'autogarcon.live',
        path: path,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    };

    var req = https.request(options, (res) => {
    });
    req.write(JSON.stringify(body));
    req.end();

};
//httpsGet: sends a Get request to the https endpoint
//Authors: Max
function httpsGet(path) {
    var options = {
        hostname: 'autogarcon.live',
        path: path,
        method: 'GET'
    };
    const req = https.request(options, res => {
        console.log(`statusCode: ${res.statusCode}`)

        res.on('data', d => {
            process.stdout.write(d)
        });
    });
    req.end();
};

var dinnerMenu = [];

//for our build order functionality
var currentOrder = [];
var currentItem;
var catIndex = 0;

//listOfCategories:fills the categories array with the appropriate category 
//Author:Max
function listOfCategories() {
    let categories = [];

    for (var i = 0; i < dinnerMenu.length; i++) {
        let category = dinnerMenu[i].category.toString();
        if (categories.includes(category) == false) {
            categories.push(category);
        }
    }

    return categories.join(', ').trim();
}

//findItem:this will return an object based on a text string match with the name of the item
//Author:Max
function findItem(itemName) {
    for (var i = 0; i < dinnerMenu.length; i++) {
        if (dinnerMenu[i].name.toLowerCase() == itemName.toLowerCase()) {
            return dinnerMenu[i];
        }
    }
}

//findItemInOrder:this will return the index of the itemObject in the current order
//Author:Max
function findItemInOrder(itemObject) {
    for (let i = 0; i < currentOrder.length; i++) {
        if (currentOrder[i] === itemObject) {
            return i;
        }
    }
}

//getPrice: returns the price of an item
//Author: Max
function getPrice(itemObject) {
    return itemObject.price;

}

//getDescription: returns the price of an item
//Author: Ben
function getDescription(itemObject) {
    return itemObject.description;
}

//addToOrder: adds item to current order
//Author:Max
async function addToOrder(itemObject) {
    var item = {
        "menuItemID": itemObject.itemID,
        "menuID": itemObject.menuID,
        "quantity": 1,
        "comments": itemObject.mod,
        "price": itemObject.price
    };

    var clone = JSON.parse(JSON.stringify(itemObject));

    var addToOrderPath = '/api/restaurant/' + restaurantID + '/tables/' + tableNum + '/order/add';

    //This will keep it in our current order list so we don't have to repull when reading off the menu
    currentOrder.push(clone);

    //This sends it to the database
    await httpsPost(addToOrderPath, item);
}

//removeFromOrder: removes an item from the current order
//Author: Jack,Max
async function removeFromOrder(itemObject) {
    let newOrder = [];
    let removedID = -1;
    for (let i = 0; i < currentOrder.length; i++) {
        if (currentOrder[i].itemID !== itemObject.itemID) {
            newOrder.push(currentOrder[i])
        } else if (removedID == currentOrder[i].itemID) {
            newOrder.push(currentOrder[i])
        } else {
            removedID = itemObject.itemID;
        }
    }
    let result = currentOrder !== newOrder;
    currentOrder = newOrder;
    var removeEndpoint = "/api/restaurant/" + restaurantID + "/tables/" + tableNum + "/order/remove";
    //remove this item from the current order by sending it to the remove endpoint
    await httpsPost(removeEndpoint, { "menuItemID": itemObject.itemID });

    return result;
}

//readCurrentOrder: reads back the current order
//Author: Jack,Max
function readCurrentOrder() {
    let say = "";
    if (currentOrder.length == 0) {
        say = "There are currently no items in your order";
    }
    else {
        for (var i = 0; i < currentOrder.length; i++) {
            if (currentOrder[i].mod !== "" && currentOrder[i].mod !== undefined) {
                say += currentOrder[i].name + " with " + currentOrder[i].mod + ", "
            }
            else {
                say += currentOrder[i].name + ", ";
            }
        }
    }
    return say;
}

/////////////////////////////////////////////////////////////////////////////////
//END GET LIST OF CATEGORIES

//Amazon default function
function getMemoryAttributes() {
    const memoryAttributes = {
        "history": [],

        // The remaining attributes will be useful after DynamoDB persistence is configured
        "launchCount": 0,
        "lastUseTimestamp": 0,

        "lastSpeechOutput": {},
        "nextIntent": []
    };
    return memoryAttributes;
};

const maxHistorySize = 30; // remember only latest 20 intents 

// 1. Intent Handlers =============================================
//Shush_Handler: Shuts Alexa up.
//Author: Zack,Max.
const Shush_Handler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'Shush';
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        let say = '';

        return responseBuilder
            .speak(say)
            .reprompt(say)
            .getResponse();
    },
};

//AllergenFilter_Handler: Allows the user to filter based on specific allergens
//Authors: Zack
const AllergenFilter_Handler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'AllergenFilter';
    },
    async handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        let say = "";
        let allergen = "";
        let isIsnot = "";
        let allergyItems = [];
        let itemName = "";
        let slotValues = getSlotValues(request.intent.slots);
        //checks to see if the slot can be resolved
        if (handlerInput.requestEnvelope.request.intent.slots.IsIsnot === undefined) {
            say = "please try again";
        } else {
            isIsnot = slotValues.IsIsnot.resolved;
        }
        //checks if the allergen slot gets filled
        if (handlerInput.requestEnvelope.request.intent.slots.allergen === undefined) {
            say = 'Allergen not identified';
        } else {
            allergen = handlerInput.requestEnvelope.request.intent.slots.allergen.value;
        }
        //loops through the menu and adds the correct items to be included or excluded.
        for (var i in dinnerMenu) {
            if (isIsnot == "is") {
                if (dinnerMenu[i].allergens.includes(allergen.toUpperCase())) {
                    allergyItems.push(dinnerMenu[i]);
                }
            }
            if (isIsnot == "isn't") {
                if (!dinnerMenu[i].allergens.includes(allergen.toUpperCase())) {
                    allergyItems.push(dinnerMenu[i]);
                }
            }
        }
        //loops through all filtered items and adds them to the string say
        for (var i in allergyItems) {
            itemName = allergyItems[i].name;
            say += itemName + ", ";
        }

        return responseBuilder
            .speak(say)
            .reprompt(say)
            .getResponse();
    }
};

//FilterByPrice_Handler: allows guest to filter items based on a price
//Author: Zack.
const FilterByPrice_Handler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'FilterByPrice';
    },
    async handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        let say = "";
        let overUnder = "";
        let price = '';
        let category = '';
        let itemsInCategory = [];
        let itemName = "";
        //checks to see if a slot exists for being over or under a certain price
        if (handlerInput.requestEnvelope.request.intent.slots.overUnder === undefined) {
            say = 'overUnder not identified';
        } else {
            overUnder = handlerInput.requestEnvelope.request.intent.slots.overUnder.value;
        }
        //checks if the price exists, or is invalid
        if (handlerInput.requestEnvelope.request.intent.slots.price === undefined) {
            say = 'price not identified';
        } else {
            price = handlerInput.requestEnvelope.request.intent.slots.price.value.substring(1);
        }
        //parse out the price
        price = parseFloat(price);
        //if the user specified a category
        if (handlerInput.requestEnvelope.request.intent.slots.category.value !== undefined) {
            for (var i in dinnerMenu) {
                if (dinnerMenu[i].category.toLowerCase() == handlerInput.requestEnvelope.request.intent.slots.category.value.toLowerCase()) {
                    itemsInCategory.push(dinnerMenu[i]);
                }
            }
            //if the user wants under, add everything <
            if (overUnder.toLowerCase() === "under") {
                for (var i in itemsInCategory) {
                    if (itemsInCategory[i].price <= price) {
                        itemName = itemsInCategory[i].name;
                        say += itemName + ", ";
                    }
                }
            }
            //if the user wants over, add everything >
            if (overUnder.toLowerCase() === "over") {
                for (var i in itemsInCategory) {
                    if (itemsInCategory[i].price >= price) {
                        itemName = itemsInCategory[i].name;
                        say += itemName + ", ";
                    }
                }
            }
        }
        //otherwise the user didn't specify a category
        else {
            //if the user wants under, add everything <
            if (overUnder.toLowerCase() === "under") {
                for (var i in dinnerMenu) {
                    if (dinnerMenu[i].price <= price) {
                        itemName = dinnerMenu[i].name;
                        say += itemName + ", ";
                    }
                }
            }

            //if the user wants over, add everything >
            if (overUnder.toLowerCase() === "over") {
                for (var i in dinnerMenu) {
                    if (dinnerMenu[i].price >= price) {
                        itemName = dinnerMenu[i].name;
                        say += itemName + ", ";
                    }
                }
            }

        }
        //if we didn't find anything over or under the price
        if (say == '') {
            say = "There's nothing " + overUnder.toString() + " " + price.toString();

        }

        return responseBuilder
            .speak(say)
            .reprompt(say)
            .getResponse();
    }
};


//written by Amazon default.
const AMAZON_FallbackIntent_Handler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

        let previousSpeech = getPreviousSpeechOutput(sessionAttributes);

        return responseBuilder
            .speak('Sorry I didnt catch what you said, ' + stripSpeak(previousSpeech.outputSpeech))
            .reprompt(stripSpeak(previousSpeech.reprompt))
            .getResponse();
    },
};

//written by Amazon default.
const AMAZON_CancelIntent_Handler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.CancelIntent';
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();


        let say = 'Okay! What can I do for you?';

        return responseBuilder
            .speak(say)
            .getResponse();
    },
};

//written by Amazon default.
const AMAZON_HelpIntent_Handler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

        let intents = getCustomIntents();
        let sampleIntent = randomElement(intents);

        let say = ' ';

        say += ' Here something you can ask me: read menu, get the price or description an item, add something to your order, get the price of your order, filter items by price or allergen, and clear or place your order ';

        return responseBuilder
            .speak(say)
            .reprompt('try again, ' + say)
            .getResponse();
    },
};

//written by Amazon default.
const AMAZON_StopIntent_Handler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.StopIntent';
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();


        let say = 'Okay! What can I do for you?';

        return responseBuilder
            .speak(say)
            .getResponse();
    },
};

//written by Amazon default.
const AMAZON_NavigateHomeIntent_Handler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.NavigateHomeIntent';
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

        let say = 'Hello from AMAZON.NavigateHomeIntent. ';


        return responseBuilder
            .speak(say)
            .reprompt('try again, ' + say)
            .getResponse();
    },
};

//ReadMenu_Handler: will read back the items in a category or entire menu.
//Author: Alexa Development team.
const ReadMenu_Handler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'ReadMenu';
    },
    async handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();


        let slotStatus = '';
        let resolvedSlot;

        let slotValues = getSlotValues(request.intent.slots);

        var catString = await listOfCategories();
        var say = '';

        say = "Here are the categories on the menu: " + catString + ". Try requesting a certain category to be read.";


        // getSlotValues returns .heardAs, .resolved, and .isValidated for each slot, according to request slot status codes ER_SUCCESS_MATCH, ER_SUCCESS_NO_MATCH, or traditional simple request slot without resolutions

        //   SLOT: category 
        if (slotValues.category.ERstatus === 'ER_SUCCESS_MATCH') {

            let foundItems = [];

            //loop through the menu searching for items in the specified category
            for (var i = 0; i < dinnerMenu.length; i++) {
                let item = dinnerMenu[i].name.toString();
                if (foundItems.includes(item) == false && dinnerMenu[i].category.toLowerCase() === slotValues.category.resolved.toLowerCase()) {
                    foundItems.push(item);
                }
            }
            if (foundItems.length > 0) {
                say = "Here are the " + slotValues.category.heardAs + " I found: " + foundItems.join(', ').trim();
            }
            else {
                say = "I found no " + slotValues.category.heardAs + " items";
            }
        };

        if (slotValues.category.ERstatus === 'ER_SUCCESS_NO_MATCH') {

            let foundItems = [];

            //loop through the menu searching for items in the specified category
            for (var i = 0; i < dinnerMenu.length; i++) {
                let item = dinnerMenu[i].name.toString();
                if (foundItems.includes(item) == false && dinnerMenu[i].category.toLowerCase() === slotValues.category.heardAs.toLowerCase()) {
                    foundItems.push(item);
                }
            }
            if (foundItems.length > 0) {
                say = "Here are the " + slotValues.category.heardAs + " I found: " + foundItems.join(', ').trim();
            }
            else {
                say = "I found no " + slotValues.category.heardAs + " items";
            }
        };

        return responseBuilder
            .speak(say)
            .reprompt(say)
            .getResponse()
    }
};


//Pricing_Handler: Gets the price of a slotValue.
//Author: Jack,Max.
const Pricing_Handler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'Pricing';
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

        let slotValues = getSlotValues(request.intent.slots);
        let say = '';

        let slotStatus = '';
        let resolvedSlot;
        say = "$" + getPrice(findItem(slotValues.item.heardAs));


        if (slotValues.category.ERstatus === 'ER_SUCCESS_MATCH') {
            say = dinnerMenu.filter(item => item.category.toLowerCase() === slotValues.category.resolved).map(item => {
                return item.name + " is $" + item.price;
            }).join(", ");
        }
        if (slotValues.category.ERstatus === 'ER_SUCCESS_NO_MATCH') {
            var elseMenu = dinnerMenu.filter(item => item.category.toLowerCase() === slotValues.category.heardAs).map(item => {
                return item.name + " is $" + item.price;
            }).join(", ");
            say = elseMenu.length > 0 ? elseMenu : "I found no " + slotValues.category.heardAs + " items";
        }

        return responseBuilder
            .speak(say)
            .reprompt(say)
            .getResponse();
    },
};

//GetDescription_Handler: Gets the price of an item.
//Author: Jack,Max.
const GetDescription_Handler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'GetDescription';
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

        let slotValues = getSlotValues(request.intent.slots);
        let say = '';

        let slotStatus = '';
        let resolvedSlot;
        //calls the getDescription function with the item that was said
        say = getDescription(findItem(slotValues.item.heardAs));

        return responseBuilder
            .speak(say)
            .reprompt(say)
            .getResponse();
    },
};


//BuildOrder_Handler: builds up an order to send to the chef.
//Author: Zack, Max.
const BuildOrder_Handler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'BuildOrder';
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

        let slotValues = getSlotValues(request.intent.slots);
        let say = 'Please finish your item addition request with: to my order';
        let slotStatus = '';
        let resolvedSlot;

        //if we get a success match, call findItem with the item stated, and ask for modifications
        if (slotValues.item.ERstatus === 'ER_SUCCESS_MATCH') {
            currentItem = findItem(slotValues.item.resolved);
            currentItem.mod = "";
            say = "Would you like to add any modifications to " + currentItem.name + "?"
        }
        //if we don't get a success match, check if the heardas is valid, then call findItem with the item stated, and ask for modifications        
        if (slotValues.item.ERstatus === 'ER_SUCCESS_NO_MATCH') {
            if (findItem(slotValues.item.heardAs) != undefined) {
                currentItem = findItem(slotValues.item.heardAs);
                currentItem.mod = "";
                say = "Would you like to add any modifications to " + currentItem.name + "?"

            }
            else {
                say = "I could not find " + slotValues.item.heardAs + " on the menu."
            }
        }

        return responseBuilder
            .speak(say)
            .reprompt(say)
            .getResponse();
    },
};

//ModifyItem_Handler: Adds a modification to the items in an order.
//Author: Max
const ModifyItem_Handler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'ModifyItem';
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

        let slotValues = getSlotValues(request.intent.slots);
        let say = '';

        let slotStatus = '';
        let resolvedSlot;


        if (currentItem.mod === undefined || currentItem.mod === "") {
            currentItem.mod = slotValues.mod.heardAs;
        }
        else {
            currentItem.mod += " and " + slotValues.mod.heardAs;
        }
        say = "You added " + slotValues.mod.heardAs + " to " + currentItem.name + ". Would you like to make any additional modifications?";


        return responseBuilder
            .speak(say)
            .reprompt(say)
            .getResponse();
    },
};


//PlaceOrder_Handler: Reads off current order and asks for confirmation.
//Author: Max
const PlaceOrder_Handler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'PlaceOrder';
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

        let say = "Your order consists of " + readCurrentOrder() + " . Are you ready to send your order to the kitchen?";


        return responseBuilder
            .speak(say)
            .reprompt(say)
            .getResponse();
    },
};

//PriceOfOrder_Handler:iterates through the current order and gives the total price.
//Author:Jack,Max.
const PriceOfOrder_Handler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'PriceOfOrder';
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

        let currentPrice = 0;
        currentOrder.forEach(item => {
            currentPrice += item.price;
        });

        let say = "The current price of your order is $" + currentPrice.toFixed(2);


        return responseBuilder
            .speak(say)
            .reprompt(say)
            .getResponse();
    },
};

//ReadCurrentOrder_Handler:Reads back the number of items in the current order.
//Author:Jack, Max.
const ReadCurrentOrder_Handler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'ReadCurrentOrder';
    },
    async handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

        let say = readCurrentOrder();

        return responseBuilder
            .speak(say)
            .reprompt(say)
            .getResponse();
    },
};

//RestaurantRegistration_Handler: Ellicit the restuarant id for registration
//Author: Ben
const RestaurantRegistration_Handler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'RestaurantRegistration';
    },
    async handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

        let slotValues = getSlotValues(request.intent.slots);
        let say = '';

        let slotStatus = '';
        let resolvedSlot;

        restaurantID = slotValues.restaurantID.heardAs;
        if (restaurantID == undefined || isNaN(restaurantID) || parseInt(restaurantID) <= 0) {
            say = "The restaurant I.D. you used is invalid. Please relaunch Auto Garcon and try a different restaurant I.D.";
            return responseBuilder
                .speak(say)
                .withShouldEndSession(true)
                .getResponse();
        }

        await fetchRestaurantName(restaurantID).then(result => {
            restaurantName = result.restaurantName;
        })

        // this checks if the restaurant exists
        if (restaurantName == null || restaurantName == undefined) {
            return responseBuilder
                .speak("The restaurant I.D. you used is invalid. Please relaunch Auto Garcon and try a different restaurant I.D.")
                .withShouldEndSession(true)
                .getResponse();
        }

        say = "You said restaurant " + restaurantID + ". What table number would you like to register to?";

        return responseBuilder
            .addElicitSlotDirective('tableNumber', {
                name: 'TableRegistration',
                confirmationStatus: 'NONE',
                slots: {}
            })
            .speak(say)
            .reprompt(say)
            .getResponse();
    },
};

// TableRegistration_Handler: Ellicit the table number for registration
//Author: Ben
const TableRegistration_Handler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'TableRegistration';
    },
    async handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

        let slotValues = getSlotValues(request.intent.slots);
        let say = '';

        let slotStatus = '';
        let resolvedSlot;

        tableNum = slotValues.tableNumber.heardAs;
        if (tableNum == undefined || isNaN(tableNum) || parseInt(tableNum) <= 0) {

            return responseBuilder
                .speak("The table number you used is invalid. Please relaunch Auto Garcon and try a different table number.")
                .withShouldEndSession(true)
                .getResponse();
        }

        var found = false;

        await fetchTables(restaurantID).then(result => {
            for (let i = 0; i < result.tables.length; i++) {
                if (result.tables[i].tableNumber == parseInt(tableNum)) {
                    found = true;
                }
            }
        })

        if (found == false) {
            return responseBuilder
                .speak("The table number you used is invalid. Please relaunch Auto Garcon and try a different table number.")
                .withShouldEndSession(true)
                .getResponse();
        }

        say = "Registering to " + restaurantName + " table number " + tableNum + ". Please relaunch Auto Garcon.";

        // register these to the database
        var registerEndpoint = "/api/restaurant/" + restaurantID + "/tables/" + tableNum + "/register"
        await httpsPost(registerEndpoint, { "alexaID": alexaID });

        return responseBuilder
            .speak(say)
            .reprompt(say)
            .withShouldEndSession(true)
            .getResponse();
    },
};

//ClearOrder_Handler: Deletes all items in the current order.
//Author:Jack, Max.
const ClearOrder_Handler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'ClearOrder';
    },
    async handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        let say = '';
        if (request.intent.confirmationStatus !== "DENIED") {
            currentOrder = [];
            say = "Successfully cleared your order";
            var customer = { "customerID": customerID };
            var newOrderPath = '/api/restaurant/' + restaurantID + '/tables/' + tableNum + '/order/new';
            await httpsPost(newOrderPath, customer);
        } else {
            say = "Your order is still intact. What else can I do for you?"
        }

        return responseBuilder
            .speak(say)
            .reprompt(say)
            .getResponse();
    },
};

//RemoveItem_Handler:Removes an item from the current order.
//Author:Jack, Max.
const RemoveItem_Handler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'RemoveItem';
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

        let slotValues = getSlotValues(request.intent.slots);
        let say = '';

        let slotStatus = '';
        let resolvedSlot;


        if (slotValues.item.ERstatus === 'ER_SUCCESS_MATCH') {

            if (removeFromOrder(findItem(slotValues.item.resolved))) {
                say = "successfully removed " + slotValues.item.heardAs + " from order";
            } else {
                say = "I could not find " + slotValues.item.heardAs + " in your order";
            }
        }
        if (slotValues.item.ERstatus === 'ER_SUCCESS_NO_MATCH') {
            //removeFromOrder(findItem(slotValues.item.heardAs));
            if (removeFromOrder(findItem(slotValues.item.heardAs))) {
                say = "successfully removed " + slotValues.item.heardAs + " from order";
            } else {
                say = "I could not find " + slotValues.item.heardAs + " in your order";
            }
            //slotStatus += 'which did not match any slot value. ';
            console.log('***** consider adding "' + slotValues.item.heardAs + '" to the custom slot type used by slot item! ');
        }



        say += slotStatus;


        return responseBuilder
            .speak(say)
            .reprompt(say)
            .getResponse();
    },
};

// LaunchRequest_Handler: fetches data and begins user interaction
//written by Amazon default and Ben
const LaunchRequest_Handler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'LaunchRequest';
    },
    async handle(handlerInput) {

        const responseBuilder = handlerInput.responseBuilder;
        let say = '';

        // get alexa id
        //alexaID = handlerInput.requestEnvelope.context.System.device.deviceId.toString();
        alexaID = "48";

        var isRegistered = true;
        // get restaurant id
        await fetchRestaurant(alexaID).then(async result => {
            if (result.restaurantID != null) {
                // get resturantID and table number
                // the device is registered
                restaurantID = result.restaurantID;
                tableNum = result.tableNumber;
                // clear the local order
                currentOrder = [];
                if (result.currentOrder == null || result.currentOrder == undefined) {
                    say = "Please scan the Q.R. code and try again.";
                    return responseBuilder
                        .speak(say)
                        .reprompt(say)
                        .withShouldEndSession(true)
                        .getResponse();
                }
                customerID = result.currentOrder.customerID;
                // get the restaurant name
                await fetchRestaurantName(restaurantID).then(result => {
                    restaurantName = result.restaurantName;
                });

                say = 'Hello and welcome to ' + restaurantName + '!';

                if (result.currentOrder.orderItems.length > 0) {
                    // there is an old order
                    // populate the current order; match object information
                    for (let i = 0; i < result.currentOrder.orderItems.length; ++i) {
                        currentOrder.push(result.currentOrder.orderItems[i]);
                    }

                    say += ' There is an unfinished order. Would you like to resume this order?';
                }
                else {
                    say += ' Say help to hear some options.';
                }
            }
            else {
                isRegistered = false;
            }
        });

        if (isRegistered == false) {
            // the device is not registered
            return responseBuilder
                .addElicitSlotDirective('restaurantID', {
                    name: 'RestaurantRegistration',
                    confirmationStatus: 'NONE',
                    slots: {}
                })
                .speak('The device does not appear to be registered. What restaurant I.D. would you like to register it to?')
                .reprompt('I did not catch that. What restaurant I.D. would you like to register it to?')
                .getResponse()
        }

        // get data
        await fetchData(restaurantID).then(result => {
            for (var i = 0; i < result.length; i++) {
                for (var j = 0; j < result[i].menuItems.length; j++) {
                    if (!dinnerMenu.includes(result[i].menuItems[j])) {
                        dinnerMenu.push(result[i].menuItems[j]);
                    }
                    for (var k = 0; k < currentOrder.length; ++k) {
                        if (result[i].menuItems[j].menuID == currentOrder[k].menuID && result[i].menuItems[j].itemID == currentOrder[k].menuItemID) {
                            let comments = "";
                            if (currentOrder[k].comments != "Default OrderItem" && currentOrder[k].comments != "") {
                                comments = currentOrder[k].comments;
                            }
                            currentOrder[k] = JSON.parse(JSON.stringify(result[i].menuItems[j]));
                            currentOrder[k].mod = comments;
                        }
                    }
                };
            };
        });

        return responseBuilder
            .speak(say)
            .reprompt(say)
            .getResponse();
    }
};

//written by Amazon default
const SessionEndedHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);
        return handlerInput.responseBuilder.getResponse();
    }
};

//written by Amazon default.
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        const request = handlerInput.requestEnvelope.request;

        var say = 'Sorry, an error occurred. Please relaunch the device.';

        return handlerInput.responseBuilder
            .speak(say)
            .reprompt(say)
            .getResponse();
    }
};

//AMAZON_YesIntent_Handler:Gets "yes" responses and redirects from what was the previous intent
//Author: Max
const AMAZON_YesIntent_Handler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.YesIntent';
    },
    async handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

        let say = 'You said Yes. ';
        let previousIntent = getPreviousIntent(sessionAttributes);
        say += previousIntent

        //direct to ModifyItem to get the modification
        if (previousIntent == "BuildOrder" && !handlerInput.requestEnvelope.session.new) {
            say = 'What modifications would you like to make? ';
            return responseBuilder
                .addElicitSlotDirective('mod', {
                    name: 'ModifyItem',
                    confirmationStatus: 'NONE'
                })
                .speak(say)
                .reprompt(say)
                .getResponse();
        }

        //loop back to ModifyItem to get the additional modification
        if (previousIntent == "ModifyItem" && !handlerInput.requestEnvelope.session.new) {
            say = 'What other modifications would you like to make? ';
            return responseBuilder
                .addElicitSlotDirective('mod', {
                    name: 'ModifyItem',
                    confirmationStatus: 'NONE'
                })
                .speak(say)
                .reprompt(say)
                .getResponse();
        }

        //no additional modification so direct to place order
        if (previousIntent == "AMAZON.NoIntent" && !handlerInput.requestEnvelope.session.new) {
            say = ' ';
            return responseBuilder
                .addDelegateDirective({
                    name: 'PlaceOrder',
                    confirmationStatus: 'NONE'
                })
                .speak(say)
                .reprompt(say)
                .getResponse();
        }

        if (previousIntent == "PlaceOrder" && !handlerInput.requestEnvelope.session.new) {
            // send the order
            var submitOrderPath = '/api/restaurant/' + restaurantID + '/tables/' + tableNum + '/order/submit';
            await httpsGet(submitOrderPath);
            say = 'Order confirmed and sent to kitchen.';
            // clear the order
            currentOrder = [];

            return responseBuilder
                .speak(say + " Thank you for your order. Scan the Q.R. code to start a new order.")
                .reprompt(say)
                .withShouldEndSession(true)
                .getResponse();
        }

        //continue with previous order
        if (previousIntent == "LaunchRequest" && !handlerInput.requestEnvelope.session.new) {
            say = "Ok. Lets resume your order.";
            return responseBuilder
                .speak(say)
                .reprompt(say)
                .getResponse();
        }

        return responseBuilder
            .speak(say)
            .reprompt(say)
            .getResponse();
    },
};

//AMAZON_NoIntent_Handler:Gets "no" responses and redirects from what was the previous intent
//Author: Max
const AMAZON_NoIntent_Handler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.NoIntent';
    },
    async handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

        let say = 'You said No. ';
        let previousIntent = getPreviousIntent(sessionAttributes);

        //no modification, add the item to the order
        if (previousIntent == "BuildOrder" && !handlerInput.requestEnvelope.session.new) {
            addToOrder(currentItem);
            say = "Okay. Successfully added " + currentItem.name + " to order.";
            say += " Are you ready to place your order?";

        }

        //no more modification, add teh item to the order
        if (previousIntent == "ModifyItem" && !handlerInput.requestEnvelope.session.new) {
            addToOrder(currentItem);
            say = "Okay. Successfully added " + currentItem.name + " with " + currentItem.mod + " to order."
            say += " Are you ready to place your order?";
        }

        //customer not ready to place order yet
        if (previousIntent == "AMAZON.NoIntent" && !handlerInput.requestEnvelope.session.new) {
            say = 'Okay. What else can I do for you?';
        }

        //customer does not want to confirm their order placement
        if (previousIntent == "PlaceOrder" && !handlerInput.requestEnvelope.session.new) {
            // say += 'Your last intent was ' + previousIntent + '. ';
            say = "Okay. Feel free to continue modifying your order. Just say Place Order when you're ready to send it to the kitchen."
        }

        //customer does not want to continue previous order
        if (previousIntent == "LaunchRequest" && !handlerInput.requestEnvelope.session.new) {
            say = "Ok. Lets start a new order";
            currentOrder = [];
            // update the db
            var customer = { "customerID": customerID };
            var newOrderPath = '/api/restaurant/' + restaurantID + '/tables/' + tableNum + '/order/new';
            await httpsPost(newOrderPath, customer);
        }

        return responseBuilder
            .speak(say)
            .reprompt(say)
            .getResponse();
    },
};

// 2. Constants ===========================================================================

// Here you can define static data, to be used elsewhere in your code.  For example: 
//    const myString = "Hello World";
//    const myArray  = [ "orange", "grape", "strawberry" ];
//    const myObject = { "city": "Boston",  "state":"Massachusetts" };

const APP_ID = undefined;  // TODO replace with your Skill ID (OPTIONAL).

// 3.  Helper Functions ===================================================================
//written by Amazon default.
function capitalize(myString) {

    return myString.replace(/(?:^|\s)\S/g, function (a) { return a.toUpperCase(); });
}
//written by Amazon default.
function randomElement(myArray) {
    return (myArray[Math.floor(Math.random() * myArray.length)]);
}

//written by Amazon default.
function stripSpeak(str) {
    return (str.replace('<speak>', '').replace('</speak>', ''));
}



//written by Amazon default.
function getSlotValues(filledSlots) {
    const slotValues = {};

    Object.keys(filledSlots).forEach((item) => {
        const name = filledSlots[item].name;

        if (filledSlots[item] &&
            filledSlots[item].resolutions &&
            filledSlots[item].resolutions.resolutionsPerAuthority[0] &&
            filledSlots[item].resolutions.resolutionsPerAuthority[0].status &&
            filledSlots[item].resolutions.resolutionsPerAuthority[0].status.code) {
            switch (filledSlots[item].resolutions.resolutionsPerAuthority[0].status.code) {
                case 'ER_SUCCESS_MATCH':
                    slotValues[name] = {
                        heardAs: filledSlots[item].value,
                        resolved: filledSlots[item].resolutions.resolutionsPerAuthority[0].values[0].value.name,
                        ERstatus: 'ER_SUCCESS_MATCH'
                    };
                    break;
                case 'ER_SUCCESS_NO_MATCH':
                    slotValues[name] = {
                        heardAs: filledSlots[item].value,
                        resolved: '',
                        ERstatus: 'ER_SUCCESS_NO_MATCH'
                    };
                    break;
                default:
                    break;
            }
        } else {
            slotValues[name] = {
                heardAs: filledSlots[item].value,
                resolved: '',
                ERstatus: ''
            };
        }
    }, this);

    return slotValues;
}
//written by Amazon default.
function supportsDisplay(handlerInput) // returns true if the skill is running on a device with a display (Echo Show, Echo Spot, etc.) 
{                                      //  Enable your skill for display as shown here: https://alexa.design/enabledisplay 
    const hasDisplay =
        handlerInput.requestEnvelope.context &&
        handlerInput.requestEnvelope.context.System &&
        handlerInput.requestEnvelope.context.System.device &&
        handlerInput.requestEnvelope.context.System.device.supportedInterfaces &&
        handlerInput.requestEnvelope.context.System.device.supportedInterfaces.Display;

    return hasDisplay;
}
//written by Amazon default.
function getCustomIntents() {
    const modelIntents = model.interactionModel.languageModel.intents;

    let customIntents = [];


    for (let i = 0; i < modelIntents.length; i++) {

        if (modelIntents[i].name.substring(0, 7) != "AMAZON." && modelIntents[i].name !== "LaunchRequest") {
            customIntents.push(modelIntents[i]);
        }
    }
    return customIntents;
}
//written by Amazon default.
function getSampleUtterance(intent) {

    return randomElement(intent.samples);

}
//written by Amazon default.
function getPreviousIntent(attrs) {

    if (attrs.history && attrs.history.length > 1) {
        return attrs.history[attrs.history.length - 2].IntentRequest;

    } else {
        return false;
    }

}
//written by Amazon default.
function getPreviousSpeechOutput(attrs) {

    if (attrs.lastSpeechOutput && attrs.history.length > 1) {
        return attrs.lastSpeechOutput;

    } else {
        return false;
    }

}
//written by Amazon default.
const InitMemoryAttributesInterceptor = {
    process(handlerInput) {
        let sessionAttributes = {};
        if (handlerInput.requestEnvelope.session['new']) {

            sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

            let memoryAttributes = getMemoryAttributes();

            if (Object.keys(sessionAttributes).length === 0) {

                Object.keys(memoryAttributes).forEach(function (key) {  // initialize all attributes from global list 

                    sessionAttributes[key] = memoryAttributes[key];

                });

            }
            handlerInput.attributesManager.setSessionAttributes(sessionAttributes);


        }
    }
};
//written by Amazon default.
const RequestHistoryInterceptor = {
    process(handlerInput) {

        const thisRequest = handlerInput.requestEnvelope.request;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

        let history = sessionAttributes['history'] || [];

        let IntentRequest = {};
        if (thisRequest.type === 'IntentRequest') {

            let slots = [];

            IntentRequest = {
                'IntentRequest': thisRequest.intent.name
            };

            if (thisRequest.intent.slots) {

                for (let slot in thisRequest.intent.slots) {
                    let slotObj = {};
                    slotObj[slot] = thisRequest.intent.slots[slot].value;
                    slots.push(slotObj);
                }

                IntentRequest = {
                    'IntentRequest': thisRequest.intent.name,
                    'slots': slots
                };

            }

        } else {
            IntentRequest = { 'IntentRequest': thisRequest.type };
        }
        if (history.length > maxHistorySize - 1) {
            history.shift();
        }
        history.push(IntentRequest);

        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

    }

};



//written by Amazon default.
const RequestPersistenceInterceptor = {
    process(handlerInput) {

        if (handlerInput.requestEnvelope.session['new']) {

            return new Promise((resolve, reject) => {

                handlerInput.attributesManager.getPersistentAttributes()

                    .then((sessionAttributes) => {
                        sessionAttributes = sessionAttributes || {};


                        sessionAttributes['launchCount'] += 1;

                        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

                        handlerInput.attributesManager.savePersistentAttributes()
                            .then(() => {
                                resolve();
                            })
                            .catch((err) => {
                                reject(err);
                            });
                    });

            });

        } // end session['new'] 
    }
};

//written by Amazon default.
const ResponseRecordSpeechOutputInterceptor = {
    process(handlerInput, responseOutput) {

        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        let lastSpeechOutput = {
            "outputSpeech": responseOutput.outputSpeech.ssml,
            "reprompt": responseOutput.reprompt.outputSpeech.ssml
        };

        sessionAttributes['lastSpeechOutput'] = lastSpeechOutput;

        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

    }
};
//written by Amazon default.
const ResponsePersistenceInterceptor = {
    process(handlerInput, responseOutput) {

        const ses = (typeof responseOutput.shouldEndSession == "undefined" ? true : responseOutput.shouldEndSession);

        if (ses || handlerInput.requestEnvelope.request.type == 'SessionEndedRequest') { // skill was stopped or timed out 

            let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

            sessionAttributes['lastUseTimestamp'] = new Date(handlerInput.requestEnvelope.request.timestamp).getTime();

            handlerInput.attributesManager.setPersistentAttributes(sessionAttributes);

            return new Promise((resolve, reject) => {
                handlerInput.attributesManager.savePersistentAttributes()
                    .then(() => {
                        resolve();
                    })
                    .catch((err) => {
                        reject(err);
                    });

            });

        }

    }
};



// 4. Exports handler function and setup ===================================================
const skillBuilder = Alexa.SkillBuilders.custom();
exports.handler = skillBuilder
    .addRequestHandlers(
        AMAZON_FallbackIntent_Handler,
        AMAZON_CancelIntent_Handler,
        AMAZON_HelpIntent_Handler,
        AMAZON_StopIntent_Handler,
        AMAZON_NavigateHomeIntent_Handler,
        AMAZON_YesIntent_Handler,
        AMAZON_NoIntent_Handler,
        ReadMenu_Handler,
        Pricing_Handler,
        GetDescription_Handler,
        BuildOrder_Handler,
        PlaceOrder_Handler,
        PriceOfOrder_Handler,
        ReadCurrentOrder_Handler,
        RemoveItem_Handler,
        FilterByPrice_Handler,
        AllergenFilter_Handler,
        ModifyItem_Handler,
        ClearOrder_Handler,
        LaunchRequest_Handler,
        SessionEndedHandler,
        RestaurantRegistration_Handler,
        TableRegistration_Handler,
        Shush_Handler
    )
    .addErrorHandlers(ErrorHandler)
    .addRequestInterceptors(InitMemoryAttributesInterceptor)
    .addRequestInterceptors(RequestHistoryInterceptor)

    // .addResponseInterceptors(ResponseRecordSpeechOutputInterceptor)

    // .addRequestInterceptors(RequestPersistenceInterceptor)
    // .addResponseInterceptors(ResponsePersistenceInterceptor)

    // .withTableName("askMemorySkillTable")
    // .withAutoCreateTable(true)

    .lambda();


// End of Skill code -------------------------------------------------------------
// Static Language Model for reference

const model = {
    "interactionModel": {
        "languageModel": {
            "invocationName": "auto garcon",
            "modelConfiguration": {
                "fallbackIntentSensitivity": {
                    "level": "LOW"
                }
            },
            "intents": [
                {
                    "name": "AMAZON.FallbackIntent",
                    "samples": []
                },
                {
                    "name": "AMAZON.CancelIntent",
                    "samples": []
                },
                {
                    "name": "AMAZON.HelpIntent",
                    "samples": []
                },
                {
                    "name": "AMAZON.StopIntent",
                    "samples": []
                },
                {
                    "name": "AMAZON.NavigateHomeIntent",
                    "samples": []
                },
                {
                    "name": "ReadMenu",
                    "slots": [
                        {
                            "name": "category",
                            "type": "category"
                        }
                    ],
                    "samples": [
                        "what kind of grub do you got",
                        "give me the grub for the day",
                        "read the {category} menu",
                        "read the {category}",
                        "what do you have for {category}",
                        "what are your {category}",
                        "read me the {category} options",
                        "read me the {category} menu",
                        "read me the {category}",
                        "what's on the menu",
                        "read me the menu",
                        "read menu"
                    ]
                },
                {
                    "name": "Pricing",
                    "slots": [
                        {
                            "name": "item",
                            "type": "item"
                        },
                        {
                            "name": "category",
                            "type": "category"
                        }
                    ],
                    "samples": [
                        "how much does a {item} cost",
                        "how much are your {category}",
                        "how much is {item}",
                        "how much does {item} cost",
                        "what's the price of {item}"
                    ]
                },
                {
                    "name": "BuildOrder",
                    "slots": [
                        {
                            "name": "item",
                            "type": "item"
                        }
                    ],
                    "samples": [
                        "order a {item}",
                        "add the {item} to order",
                        "add a {item} to order",
                        "add the {item} to my order",
                        "add a {item} to my order",
                        "add {item} to my order",
                        "add {item} to order",
                        "order {item}"
                    ]
                },
                {
                    "name": "PlaceOrder",
                    "slots": [],
                    "samples": [
                        "place my order",
                        "send my order",
                        "send order to kitchen",
                        "place order"
                    ]
                },
                {
                    "name": "PriceOfOrder",
                    "slots": [],
                    "samples": [
                        "what's the total",
                        "how much does this cost",
                        "what's the cost",
                        "how much is all this",
                        "how much is everything",
                        "what is my total at",
                        "how much is my total",
                        "what's the total cost",
                        "total cost",
                        "how much does my food cost",
                        "how much is my meal",
                        "what's my total",
                        "order price",
                        "current price",
                        "what is the current price of my order"
                    ]
                },
                {
                    "name": "ReadCurrentOrder",
                    "slots": [],
                    "samples": [
                        "what am I ordering",
                        "what's my order",
                        "read the order",
                        "read me my order",
                        "read me back my order",
                        "what is in the order",
                        "what items are in the order",
                        "what items are in my order",
                        "what is my order",
                        "what's in my order"
                    ]
                },
                {
                    "name": "RemoveItem",
                    "slots": [
                        {
                            "name": "item",
                            "type": "item"
                        }
                    ],
                    "samples": [
                        "take off {item} from my order",
                        "take off {item}",
                        "take off the {item} from my order",
                        "remove {item} from my order",
                        "remove the {item} from my order",
                        "I don't want {item}",
                        "get rid of {item}",
                        "delete {item}",
                        "remove {item}",
                        "remove {item} from order"
                    ]
                },
                {
                    "name": "FilterByPrice",
                    "slots": [
                        {
                            "name": "overUnder",
                            "type": "overUnder"
                        },
                        {
                            "name": "price",
                            "type": "price"
                        },
                        {
                            "name": "category",
                            "type": "category"
                        }
                    ],
                    "samples": [
                        "get me the {category} {overUnder} {price}",
                        "what {category} are {overUnder} {price}",
                        "what items are {overUnder} {price}",
                        "get me the items {overUnder} {price}",
                        "test FilterByPrice {price}",
                        "what are the items {overUnder} {price}"
                    ]
                },
                {
                    "name": "AllergenFilter",
                    "slots": [
                        {
                            "name": "allergen",
                            "type": "allergen",
                            "samples": [
                                "vegan"
                            ]
                        },
                        {
                            "name": "IsIsnot",
                            "type": "IsIsnot"
                        }
                    ],
                    "samples": [
                        "get me everything that {IsIsnot} {allergen}",
                        "what {IsIsnot} {allergen}",
                        "filter based on {allergen}"
                    ]
                },
                {
                    "name": "GetDescription",
                    "slots": [
                        {
                            "name": "item",
                            "type": "item"
                        }
                    ],
                    "samples": [
                        "tell me about the {item}",
                        "what is in the {item}",
                        "what is on the {item}",
                        "what's on the {item}",
                        "get description of {item}",
                        "what's on a {item}",
                        "what is the {item}",
                        "what's in the {item}",
                        "what is in {item}",
                        "what is on {item}",
                        "describe {item}",
                        "tell me about {item}"
                    ]
                },
                {
                    "name": "ModifyItem",
                    "slots": [
                        {
                            "name": "mod",
                            "type": "AMAZON.Food"
                        }
                    ],
                    "samples": [
                        "can I get {mod}",
                        "I want {mod}",
                        "I want to add {mod}"
                    ]
                },
                {
                    "name": "ClearOrder",
                    "slots": [],
                    "samples": [
                        "clear my order",
                        "start my order over",
                        "scratch everything",
                        "clear everything",
                        "clear my current order",
                        "clear order"
                    ]
                },
                {
                    "name": "AMAZON.YesIntent",
                    "samples": []
                },
                {
                    "name": "AMAZON.NoIntent",
                    "samples": []
                },
                {
                    "name": "RestaurantRegistration",
                    "slots": [
                        {
                            "name": "restaurantID",
                            "type": "AMAZON.NUMBER"
                        }
                    ],
                    "samples": [
                        "register it to restaurant {restaurantID}",
                        "restaurant number {restaurantID}",
                        "restaurant {restaurantID}"
                    ]
                },
                {
                    "name": "TableRegistration",
                    "slots": [
                        {
                            "name": "tableNumber",
                            "type": "AMAZON.NUMBER"
                        }
                    ],
                    "samples": [
                        "register to table number {tableNumber}",
                        "table number {tableNumber}",
                        "table {tableNumber}"
                    ]
                },
                {
                    "name": "Shush",
                    "slots": [],
                    "samples": [
                        "callado",
                        "shh",
                        "sh"
                    ]
                }
            ],
            "types": [
                {
                    "name": "category",
                    "values": [
                        {
                            "name": {
                                "value": "Appetizers"
                            }
                        },
                        {
                            "name": {
                                "value": "Chicken,Seafood and Pasta"
                            }
                        },
                        {
                            "name": {
                                "value": "Steak and Ribs"
                            }
                        },
                        {
                            "name": {
                                "value": "Salads and Soups"
                            }
                        },
                        {
                            "name": {
                                "value": "Sides"
                            }
                        },
                        {
                            "name": {
                                "value": "Breakfast"
                            }
                        },
                        {
                            "name": {
                                "value": "Pancakes"
                            }
                        },
                        {
                            "name": {
                                "value": "Omelettes"
                            }
                        },
                        {
                            "name": {
                                "value": "Add-On"
                            }
                        },
                        {
                            "name": {
                                "value": "Fajitas"
                            }
                        },
                        {
                            "name": {
                                "value": "Chicken Crispers"
                            }
                        },
                        {
                            "name": {
                                "value": "Chicken and Seafood"
                            }
                        },
                        {
                            "name": {
                                "value": "Appetizer",
                                "synonyms": [
                                    "apps"
                                ]
                            }
                        },
                        {
                            "name": {
                                "value": "Burgers",
                                "synonyms": [
                                    "burger"
                                ]
                            }
                        }
                    ]
                },
                {
                    "name": "item",
                    "values": [
                        {
                            "name": {
                                "value": "Crispy Mango Habanero Crispers"
                            }
                        },
                        {
                            "name": {
                                "value": "Crispy Buffalo Bleu Crispers"
                            }
                        },
                        {
                            "name": {
                                "value": "Honey Chipotle Crispers and Waffles"
                            }
                        },
                        {
                            "name": {
                                "value": "Crispy Honey Chipotle Chicken Crispers"
                            }
                        },
                        {
                            "name": {
                                "value": "Crispy Chicken Crispers"
                            }
                        },
                        {
                            "name": {
                                "value": "Ancho Salmon"
                            }
                        },
                        {
                            "name": {
                                "value": "Spicy Shrimp Tacos"
                            }
                        },
                        {
                            "name": {
                                "value": "Chipotle Shrimp Fresh Mex Bowl"
                            }
                        },
                        {
                            "name": {
                                "value": "Chipotle Chicken Fresh Mex Bowl"
                            }
                        },
                        {
                            "name": {
                                "value": "Cajun Shrimp Pasta"
                            }
                        },
                        {
                            "name": {
                                "value": "Cajun Chicken Pasta"
                            }
                        },
                        {
                            "name": {
                                "value": "Black Bean and Veggie Fajitas"
                            }
                        },
                        {
                            "name": {
                                "value": "Mushroom Jack Chicken Fajitas"
                            }
                        },
                        {
                            "name": {
                                "value": "Carnitas Fajitas"
                            }
                        },
                        {
                            "name": {
                                "value": "Southern Smokehouse Burger"
                            }
                        },
                        {
                            "name": {
                                "value": "Mushroom Swiss Burger"
                            }
                        },
                        {
                            "name": {
                                "value": "Queso Burger"
                            }
                        },
                        {
                            "name": {
                                "value": "Fried Pickles"
                            }
                        },
                        {
                            "name": {
                                "value": "Skillet Queso"
                            }
                        },
                        {
                            "name": {
                                "value": "Southwestern Eggrolls"
                            }
                        },
                        {
                            "name": {
                                "value": "Tripple Dipper"
                            }
                        },
                        {
                            "name": {
                                "value": "3 Pancakes"
                            }
                        },
                        {
                            "name": {
                                "value": "Hash Browns"
                            }
                        },
                        {
                            "name": {
                                "value": "Buttered Toast"
                            }
                        },
                        {
                            "name": {
                                "value": "Fresh Mushrooms"
                            }
                        },
                        {
                            "name": {
                                "value": "Avocado"
                            }
                        },
                        {
                            "name": {
                                "value": "Ham"
                            }
                        },
                        {
                            "name": {
                                "value": "Bacon"
                            }
                        },
                        {
                            "name": {
                                "value": "Cheddar Cheese"
                            }
                        },
                        {
                            "name": {
                                "value": "American Cheese"
                            }
                        },
                        {
                            "name": {
                                "value": "Vegetable Omelette"
                            }
                        },
                        {
                            "name": {
                                "value": "Bacon Temptation Omelette"
                            }
                        },
                        {
                            "name": {
                                "value": "Colorado Omelette"
                            }
                        },
                        {
                            "name": {
                                "value": "Chicken Fajita Omelette"
                            }
                        },
                        {
                            "name": {
                                "value": "Big Steak Omelette"
                            }
                        },
                        {
                            "name": {
                                "value": "Spicy Poblano Omelette"
                            }
                        },
                        {
                            "name": {
                                "value": "Country Fried Steak and Eggs"
                            }
                        },
                        {
                            "name": {
                                "value": "Sirloin Tips and Eggs"
                            }
                        },
                        {
                            "name": {
                                "value": "Split Decision Breakfast"
                            }
                        },
                        {
                            "name": {
                                "value": "Breakfast Sampler"
                            }
                        },
                        {
                            "name": {
                                "value": "Mexican Churro Pancakes"
                            }
                        },
                        {
                            "name": {
                                "value": "Italian Cannoli Pancakes"
                            }
                        },
                        {
                            "name": {
                                "value": "Cupcake Pancakes"
                            }
                        },
                        {
                            "name": {
                                "value": "Scratch Made Belgian Waffle Platter"
                            }
                        },
                        {
                            "name": {
                                "value": "French Toast Platter"
                            }
                        },
                        {
                            "name": {
                                "value": "Turkey Sausage"
                            }
                        },
                        {
                            "name": {
                                "value": "Ham N Cheese"
                            }
                        },
                        {
                            "name": {
                                "value": "Meat N Potatoes"
                            }
                        },
                        {
                            "name": {
                                "value": "The Everything"
                            }
                        },
                        {
                            "name": {
                                "value": "Granny's Country"
                            }
                        },
                        {
                            "name": {
                                "value": "Mashed Potatoes"
                            }
                        },
                        {
                            "name": {
                                "value": "Lemon Butter Broccoli"
                            }
                        },
                        {
                            "name": {
                                "value": "Coleslaw"
                            }
                        },
                        {
                            "name": {
                                "value": "Seasoned Fries"
                            }
                        },
                        {
                            "name": {
                                "value": "Caesar Salad"
                            }
                        },
                        {
                            "name": {
                                "value": "Caesar Salad With Grilled Chicken"
                            }
                        },
                        {
                            "name": {
                                "value": "White Cheddar Broccoli Cheese Soup"
                            }
                        },
                        {
                            "name": {
                                "value": "Center Cut Sirloin and Crispy Shrimp"
                            }
                        },
                        {
                            "name": {
                                "value": "Center Cut Serloin"
                            }
                        },
                        {
                            "name": {
                                "value": "Big Ribs Whiskey Glazed"
                            }
                        },
                        {
                            "name": {
                                "value": "Fish and Chips"
                            }
                        },
                        {
                            "name": {
                                "value": "Fried Shrimp"
                            }
                        },
                        {
                            "name": {
                                "value": "Crispy Chicken Tenders"
                            }
                        },
                        {
                            "name": {
                                "value": "Signature Whiskey Glazed Chicken"
                            }
                        },
                        {
                            "name": {
                                "value": "Chicken Parmesan Pasta"
                            }
                        },
                        {
                            "name": {
                                "value": "Cajun Shrimp and Chicken Pasta"
                            }
                        },
                        {
                            "name": {
                                "value": "Cheeseburger"
                            }
                        },
                        {
                            "name": {
                                "value": "Bacon Cheesburger"
                            }
                        },
                        {
                            "name": {
                                "value": "Green Bean Fries"
                            }
                        },
                        {
                            "name": {
                                "value": "Traditional Wings"
                            }
                        },
                        {
                            "name": {
                                "value": "Pan Seared Pot Stickers"
                            }
                        },
                        {
                            "name": {
                                "value": "Boneless Wings"
                            }
                        },
                        {
                            "name": {
                                "value": "Firecracker Wrap"
                            }
                        },
                        {
                            "name": {
                                "value": "Chicken Caesar Wrap"
                            }
                        },
                        {
                            "name": {
                                "value": "Bacon Chicken Chipotle Wrap"
                            }
                        },
                        {
                            "name": {
                                "value": "Bacon Chicken Ranch Wrap"
                            }
                        },
                        {
                            "name": {
                                "value": "Cheese Curds"
                            }
                        },
                        {
                            "name": {
                                "value": "Mini Tacos"
                            }
                        },
                        {
                            "name": {
                                "value": "Black Bean Burger"
                            }
                        },
                        {
                            "name": {
                                "value": "Cowboy Burger"
                            }
                        },
                        {
                            "name": {
                                "value": "California Burger"
                            }
                        },
                        {
                            "name": {
                                "value": "Classic Hamburger"
                            }
                        },
                        {
                            "name": {
                                "value": "Double Burger"
                            }
                        },
                        {
                            "name": {
                                "value": "Turkey Burger"
                            }
                        },
                        {
                            "name": {
                                "value": "Tex-Mex Burger"
                            }
                        },
                        {
                            "name": {
                                "value": "Peanut Butter Bacon"
                            }
                        },
                        {
                            "name": {
                                "value": "Gouda Bacon Burger"
                            }
                        },
                        {
                            "name": {
                                "value": "Caesar Wrap"
                            }
                        },
                        {
                            "name": {
                                "value": "Zesty Melt"
                            }
                        },
                        {
                            "name": {
                                "value": "Quesadilla"
                            }
                        },
                        {
                            "name": {
                                "value": "Blooming Onion"
                            }
                        },
                        {
                            "name": {
                                "value": "Onion Rings"
                            }
                        },
                        {
                            "name": {
                                "value": "French Fries"
                            }
                        },
                        {
                            "name": {
                                "value": "Nachos"
                            }
                        },
                        {
                            "name": {
                                "value": "Chicken Strips"
                            }
                        },
                        {
                            "name": {
                                "value": "Teriaki Wings"
                            }
                        },
                        {
                            "name": {
                                "value": "Samurai Wings"
                            }
                        },
                        {
                            "name": {
                                "value": "Traditional Tots"
                            }
                        },
                        {
                            "name": {
                                "value": "Ranch Tots"
                            }
                        },
                        {
                            "name": {
                                "value": "Cajun Tots"
                            }
                        },
                        {
                            "name": {
                                "value": "Buffalo Strips"
                            }
                        },
                        {
                            "name": {
                                "value": "Mozzarella Sticks"
                            }
                        },
                        {
                            "name": {
                                "value": "Cheese Quesadilla"
                            }
                        },
                        {
                            "name": {
                                "value": "Chicken Quesadilla"
                            }
                        },
                        {
                            "name": {
                                "value": "Loaded Nachos"
                            }
                        },
                        {
                            "name": {
                                "value": "Grilled Cheese"
                            }
                        },
                        {
                            "name": {
                                "value": "Caprese Grilled Cheese"
                            }
                        },
                        {
                            "name": {
                                "value": "Chicken Avocado Panini"
                            }
                        },
                        {
                            "name": {
                                "value": "Chicken Parmesan Panini"
                            }
                        },
                        {
                            "name": {
                                "value": "Italian Salad"
                            }
                        },
                        {
                            "name": {
                                "value": "Bacon Chicken Ranch Salad"
                            }
                        },
                        {
                            "name": {
                                "value": "Bacon Chicken Chipotle Salad"
                            }
                        },
                        {
                            "name": {
                                "value": "Chicken Caesar Salad"
                            }
                        },
                        {
                            "name": {
                                "value": "Mandarin Chicken Salad"
                            }
                        },
                        {
                            "name": {
                                "value": "Firecracker Salad"
                            }
                        },
                        {
                            "name": {
                                "value": "Mandarin Chicken Wrap"
                            }
                        },
                        {
                            "name": {
                                "value": "House Salad"
                            }
                        },
                        {
                            "name": {
                                "value": "Pork Carnitas Street Tacos"
                            }
                        },
                        {
                            "name": {
                                "value": "Beef Barbacoa Street Tacos"
                            }
                        }
                    ]
                },
                {
                    "name": "overUnder",
                    "values": [
                        {
                            "name": {
                                "value": "under",
                                "synonyms": [
                                    "up to",
                                    "below",
                                    "less than"
                                ]
                            }
                        },
                        {
                            "name": {
                                "value": "over",
                                "synonyms": [
                                    "just over",
                                    "above",
                                    "more than"
                                ]
                            }
                        }
                    ]
                },
                {
                    "name": "price",
                    "values": [
                        {
                            "name": {
                                "value": "fifteen dollars"
                            }
                        },
                        {
                            "name": {
                                "value": "one dollar",
                                "synonyms": [
                                    "a dollar"
                                ]
                            }
                        },
                        {
                            "name": {
                                "value": "5 dollars"
                            }
                        },
                        {
                            "name": {
                                "value": "nine and a half dollars",
                                "synonyms": [
                                    "9.50",
                                    "$9.50"
                                ]
                            }
                        },
                        {
                            "name": {
                                "value": "ten dollars",
                                "synonyms": [
                                    "10",
                                    "10 dollars",
                                    "$10"
                                ]
                            }
                        }
                    ]
                },
                {
                    "name": "allergen",
                    "values": [
                        {
                            "name": {
                                "value": "GLUTEN",
                                "synonyms": [
                                    "gluten"
                                ]
                            }
                        },
                        {
                            "name": {
                                "value": "PORK",
                                "synonyms": [
                                    "pork"
                                ]
                            }
                        },
                        {
                            "name": {
                                "value": "MEAT",
                                "synonyms": [
                                    "meat"
                                ]
                            }
                        },
                        {
                            "name": {
                                "value": "DAIRY",
                                "synonyms": [
                                    "dairy"
                                ]
                            }
                        },
                        {
                            "name": {
                                "value": "NUTS",
                                "synonyms": [
                                    "nuts"
                                ]
                            }
                        }
                    ]
                },
                {
                    "name": "AMAZON.Food",
                    "values": [
                        {
                            "name": {
                                "value": "no ketchup"
                            }
                        },
                        {
                            "name": {
                                "value": "extra ketchup"
                            }
                        },
                        {
                            "name": {
                                "value": "ketchup"
                            }
                        },
                        {
                            "name": {
                                "value": "no pickles"
                            }
                        },
                        {
                            "name": {
                                "value": "no onions"
                            }
                        },
                        {
                            "name": {
                                "value": "extra mushrooms"
                            }
                        },
                        {
                            "name": {
                                "value": "extra pickles"
                            }
                        },
                        {
                            "name": {
                                "value": "double meat"
                            }
                        },
                        {
                            "name": {
                                "value": "extra bacon"
                            }
                        },
                        {
                            "name": {
                                "value": "extra onions"
                            }
                        },
                        {
                            "name": {
                                "value": "extra cheese"
                            }
                        },
                        {
                            "name": {
                                "value": "raw"
                            }
                        },
                        {
                            "name": {
                                "value": "well done"
                            }
                        },
                        {
                            "name": {
                                "value": "medium rare"
                            }
                        },
                        {
                            "name": {
                                "value": "rare"
                            }
                        }
                    ]
                },
                {
                    "name": "mods",
                    "values": [
                        {
                            "name": {
                                "value": "extra ketchup"
                            }
                        },
                        {
                            "name": {
                                "value": "add mayonnaise"
                            }
                        },
                        {
                            "name": {
                                "value": "no ketchup"
                            }
                        },
                        {
                            "name": {
                                "value": "ketchup"
                            }
                        },
                        {
                            "name": {
                                "value": "add ketchup"
                            }
                        },
                        {
                            "name": {
                                "value": "no onions"
                            }
                        },
                        {
                            "name": {
                                "value": "extra onions"
                            }
                        },
                        {
                            "name": {
                                "value": "no pickles"
                            }
                        },
                        {
                            "name": {
                                "value": "extra pickles"
                            }
                        },
                        {
                            "name": {
                                "value": "no cheese"
                            }
                        },
                        {
                            "name": {
                                "value": "extra cheese"
                            }
                        }
                    ]
                },
                {
                    "name": "IsIsnot",
                    "values": [
                        {
                            "name": {
                                "value": "isn't",
                                "synonyms": [
                                    "is not",
                                    "doesn't contain",
                                    "does not contain"
                                ]
                            }
                        },
                        {
                            "name": {
                                "value": "is",
                                "synonyms": [
                                    "contains",
                                    "is",
                                    "does contain"
                                ]
                            }
                        }
                    ]
                }
            ]
        },
        "dialog": {
            "intents": [
                {
                    "name": "AllergenFilter",
                    "delegationStrategy": "SKILL_RESPONSE",
                    "confirmationRequired": false,
                    "prompts": {},
                    "slots": [
                        {
                            "name": "allergen",
                            "type": "allergen",
                            "confirmationRequired": false,
                            "elicitationRequired": true,
                            "prompts": {
                                "elicitation": "Elicit.Slot.458766584741.717883134057"
                            }
                        },
                        {
                            "name": "IsIsnot",
                            "type": "IsIsnot",
                            "confirmationRequired": false,
                            "elicitationRequired": false,
                            "prompts": {}
                        }
                    ]
                },
                {
                    "name": "ReadMenu",
                    "confirmationRequired": false,
                    "prompts": {},
                    "slots": [
                        {
                            "name": "category",
                            "type": "category",
                            "confirmationRequired": false,
                            "elicitationRequired": false,
                            "prompts": {}
                        }
                    ]
                },
                {
                    "name": "ClearOrder",
                    "delegationStrategy": "SKILL_RESPONSE",
                    "confirmationRequired": true,
                    "prompts": {
                        "confirmation": "Confirm.Intent.1294309823697"
                    },
                    "slots": []
                },
                {
                    "name": "PlaceOrder",
                    "confirmationRequired": false,
                    "prompts": {},
                    "slots": []
                },
                {
                    "name": "RestaurantRegistration",
                    "confirmationRequired": false,
                    "prompts": {},
                    "slots": [
                        {
                            "name": "restaurantID",
                            "type": "AMAZON.NUMBER",
                            "confirmationRequired": false,
                            "elicitationRequired": false,
                            "prompts": {}
                        }
                    ]
                },
                {
                    "name": "TableRegistration",
                    "confirmationRequired": false,
                    "prompts": {},
                    "slots": [
                        {
                            "name": "tableNumber",
                            "type": "AMAZON.NUMBER",
                            "confirmationRequired": false,
                            "elicitationRequired": false,
                            "prompts": {}
                        }
                    ]
                }
            ],
            "delegationStrategy": "ALWAYS"
        },
        "prompts": [
            {
                "id": "Elicit.Slot.458766584741.717883134057",
                "variations": [
                    {
                        "type": "PlainText",
                        "value": "please give an allergen to filter by"
                    }
                ]
            },
            {
                "id": "Elicit.Slot.918377438504.1303097264628",
                "variations": [
                    {
                        "type": "PlainText",
                        "value": "Which category of the menu would you like me to read?"
                    }
                ]
            },
            {
                "id": "Confirm.Intent.1294309823697",
                "variations": [
                    {
                        "type": "PlainText",
                        "value": "Are you sure you would like to clear your current order?"
                    }
                ]
            },
            {
                "id": "Elicit.Slot.796532620091.1385443888808",
                "variations": [
                    {
                        "type": "PlainText",
                        "value": "The device does not appear to be registered. What restaurant I.D. would you like to register it to?"
                    }
                ]
            },
            {
                "id": "Confirm.Slot.796532620091.1385443888808",
                "variations": [
                    {
                        "type": "PlainText",
                        "value": "I heard restuarant number {restaurantID} . Is that correct?"
                    }
                ]
            },
            {
                "id": "Confirm.Slot.55843681209.364300331197",
                "variations": [
                    {
                        "type": "PlainText",
                        "value": "I heard you say {restaurantID} . Is that correct?"
                    }
                ]
            },
            {
                "id": "Elicit.Slot.55843681209.364300331197",
                "variations": [
                    {
                        "type": "PlainText",
                        "value": "What restaurant number would you like to register?"
                    }
                ]
            },
            {
                "id": "Elicit.Slot.739606836541.880541492200",
                "variations": [
                    {
                        "type": "PlainText",
                        "value": "What table number would you like to register this device to?"
                    }
                ]
            },
            {
                "id": "Confirm.Slot.739606836541.880541492200",
                "variations": [
                    {
                        "type": "PlainText",
                        "value": "I heard table number {tableNumber} . Is that correct?"
                    }
                ]
            }
        ]
    }
};