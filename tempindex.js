// Lambda Function code for Alexa.
// Paste this into your index.js file. 
//Testing functionality

const Alexa = require("ask-sdk-core");
const https = require("https");

const jsonDinnerMenu = require("./dinner_menu.json")
const jsonDrinkMenu = require("./drink_menu.json")
const invocationName = "auto garcon";

// Session Attributes 
//   Alexa will track attributes for you, by default only during the lifespan of your session.
//   The history[] array will track previous request(s), used for contextual Help/Yes/No handling.
//   Set up DynamoDB persistence to have the skill save and reload these attributes between skill sessions.

/////////////////////////////////////////////////////////////////////////////////////////////
//THIS IS GETTING A LIST OF CATEGORIES
function jsonParser(stringValue) {

   var string = JSON.stringify(stringValue);
   var objectValue = JSON.parse(string);
   return objectValue;
}

const dinnerMenu = jsonParser(jsonDinnerMenu);
const drinkMenu = jsonParser(jsonDrinkMenu);

//for our build order functionality
var currentOrder = [];
var categories = [];
var catIndex = 0;
//ListOfCategories:fills the categories array with the appropriate category 
//Author:Max
function ListOfCategories() {
    for (var i = 0; i < dinnerMenu.items.length; i++) {
        if (categories.length == 0) {
            categories[catIndex] = dinnerMenu.items[i].category;
            catIndex += 1;
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

//FindItem:this will return an object based on a text string match with the name of the item
//Author:Max
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

//GetPrice: returns the price of an item
//Author: Max
function GetPrice(itemObject){
    return itemObject.price;
}
//GetPrice: returns the price of an item
//Author: Ben
function GetPrice(itemObject){
    return itemObject.description;
}
//AddToOrder: adds item to current order
//Author:Max
function AddToOrder(itemObject){
    currentOrder.push(itemObject);
}
//RemoveFromOrder: removes an item from the current order
//Author: Jack,Max
function RemoveFromOrder(itemObject){
    let newOrder = []
    for (let i = 0; i < currentOrder.length; i++) {
        if (currentOrder[i] !== itemObject) {
            newOrder.push(currentOrder[i])
        }
    }
    let result = currentOrder !== newOrder;
    currentOrder = newOrder
    return result;
}
//ReadCurrentOrder: reads back the current order
//Author: Jack,Max
function ReadCurrentOrder(){
    let say = "";
    if(currentOrder.length == 0){
        say = "There are currently no items in your order";
    }
    else{
        for(var i =0; i < currentOrder.length; i++){
            say += currentOrder[i].name + ", ";
        }
    }
    return say;
}
/////////////////////////////////////////////////////////////////////////////////
//END GET LIST OF CATEGORIES

//Amazon default function
function getMemoryAttributes() {   const memoryAttributes = {
       "history":[],

        // The remaining attributes will be useful after DynamoDB persistence is configured
       "launchCount":0,
       "lastUseTimestamp":0,

       "lastSpeechOutput":{},
       "nextIntent":[]

       // "favoriteColor":"",
       // "name":"",
       // "namePronounce":"",
       // "email":"",
       // "mobileNumber":"",
       // "city":"",
       // "state":"",
       // "postcode":"",
       // "birthday":"",
       // "bookmark":0,
       // "wishlist":[],
   };
   return memoryAttributes;
};

const maxHistorySize = 30; // remember only latest 20 intents 


// 1. Intent Handlers =============================================
const AllergenFilter_Handler = {
  canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'AllergenFilter' ;
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        let say = "";
        let allergen = "";
        if (handlerInput.requestEnvelope.request.intent.slots.allergen === undefined) {
            say = 'Allergen not identified';
        } else {
            allergen = handlerInput.requestEnvelope.request.intent.slots.allergen.value;
        }
        
        for(var i in dinnerMenu.items){
            for(var j in dinnerMenu.items[i].allergens){
                if(dinnerMenu.items[i].allergens[j] === allergen.toLowerCase()){
                    say+=dinnerMenu.items[i].name + ", ";    
                }
            }
        }
        
        return responseBuilder
            .speak(say)
            .reprompt('try again, ' + say)
            .getResponse();
    },
};
const FilterByPrice_Handler = {
   canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'FilterByPrice' ;
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        let say = "";
        let overUnder = "";
        let price = '';
        if (handlerInput.requestEnvelope.request.intent.slots.overUnder === undefined) {
            say = 'overUnder not identified';
        } else {
            overUnder = handlerInput.requestEnvelope.request.intent.slots.overUnder.value;
        }
        
        if (handlerInput.requestEnvelope.request.intent.slots.price === undefined) {
            say = 'price not identified';
        } else {
            price = handlerInput.requestEnvelope.request.intent.slots.price.value.substring(1);
        }
        price = parseFloat(price);
        if(overUnder.toLowerCase() === "under"){
            for(var i in dinnerMenu.items){
                    if(dinnerMenu.items[i].price <= price){
                        say+=dinnerMenu.items[i].name + ", ";    
                    }
            }
            for(var i in drinkMenu.items){
                    if(drinkMenu.items[i].price <= price){
                        say+=drinkMenu.items[i].name + ", ";    
                    }
            }
        }
        
        
        if(overUnder.toLowerCase() === "over"){
            for(var i in dinnerMenu.items){
                    if(dinnerMenu.items[i].price >= price){
                        say+=dinnerMenu.items[i].name + ", ";    
                    }
            }
            for(var i in drinkMenu.items){
                    if(drinkMenu.items[i].price >= price){
                        say+=drinkMenu.items[i].name + ", ";    
                    }
            }
            
        }
        return responseBuilder
            .speak(say)
            .reprompt('try again, ' + say)
            .getResponse();
    },
};


//written by Amazon default.
const AMAZON_FallbackIntent_Handler =  {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.FallbackIntent' ;
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
const AMAZON_CancelIntent_Handler =  {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.CancelIntent' ;
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();


        let say = 'Okay, talk to you later! ';

        return responseBuilder
            .speak(say)
            .withShouldEndSession(true)
            .getResponse();
    },
};

//written by Amazon default.
const AMAZON_HelpIntent_Handler =  {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.HelpIntent' ;
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

        let intents = getCustomIntents();
        let sampleIntent = randomElement(intents);

        let say = 'You asked for help. '; 

        say += ' Here something you can ask me, ' + getSampleUtterance(sampleIntent);

        return responseBuilder
            .speak(say)
            .reprompt('try again, ' + say)
            .getResponse();
    },
};

//written by Amazon default.
const AMAZON_StopIntent_Handler =  {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.StopIntent' ;
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();


        let say = 'Okay, talk to you later! ';

        return responseBuilder
            .speak(say)
            .withShouldEndSession(true)
            .getResponse();
    },
};

//written by Amazon default.
const AMAZON_NavigateHomeIntent_Handler =  {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.NavigateHomeIntent' ;
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
const ReadMenu_Handler =  {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'ReadMenu' ;
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

        let say = "Here's what's on the menu";

        let slotStatus = '';
        let resolvedSlot;

        let slotValues = getSlotValues(request.intent.slots); 

        
        ListOfCategories();
        var catString = ' ';
        for (var j = 0; j < categories.length; j++) {
            catString += categories[j]+ ", ";
        }
        
        // getSlotValues returns .heardAs, .resolved, and .isValidated for each slot, according to request slot status codes ER_SUCCESS_MATCH, ER_SUCCESS_NO_MATCH, or traditional simple request slot without resolutions

        //   SLOT: category 
        
        if (slotValues.category.ERstatus === 'ER_SUCCESS_MATCH') {
            if(slotValues.category.resolved=="drinks"){
                var listOfDrinks = drinkMenu.items.map(item => item.name).join(", ")
 
                say = "Here are the drinks I found: "+ listOfDrinks;
            }
            else{
                var elseMenu = dinnerMenu.items.filter(item => item.category.toLowerCase() === slotValues.category.resolved).map(item => item.name).join(", ");
                say = "Here are the " + slotValues.category.resolved +" I found: "+ elseMenu;
                
            }
        }
        if (slotValues.category.ERstatus === 'ER_SUCCESS_NO_MATCH') {
            //WILL HAVE TO SEE IF WE CAN EVEN FIND A MATCH ON THE MENU OF THE CATEGORY
            var elseMenu = dinnerMenu.items.filter(item => item.category.toLowerCase() === slotValues.category.heardAs).map(item => item.name).join(", ");
            
            if (elseMenu.length > 0) {
                say = "Here are the " + slotValues.category.heardAs +" I found: "+ elseMenu
            } else {
                say = "I found no " + slotValues.category.heardAs + " items";
            }
                
        }
        
        say += slotStatus;


        return responseBuilder
            .speak(say)
            .reprompt('try again, ' + say)
            .getResponse();
    },
};
//Pricing_Handler: Gets the price of a slotValue.
//Author: Jack,Max.
const Pricing_Handler =  {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'Pricing' ;
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
            say = "$"+GetPrice(FindItem(slotValues.item.heardAs));
        }
        if (slotValues.item.ERstatus === 'ER_SUCCESS_NO_MATCH') {
            slotStatus += 'which did not match any slot value. ';
            console.log('***** consider adding "' + slotValues.item.heardAs + '" to the custom slot type used by slot item! '); 
        }


        if (slotValues.category.ERstatus === 'ER_SUCCESS_MATCH') {
            if(slotValues.category.resolved=="drinks"){
                say = drinkMenu.items.map(item => {
                    return item.name + " is $" + item.price;
                }).join(", ");
            }
            else{
                say = dinnerMenu.items.filter(item => item.category.toLowerCase() === slotValues.category.resolved).map(item => {
                    return item.name + " is $" + item.price;
                }).join(", ");
            }
        }
        if (slotValues.category.ERstatus === 'ER_SUCCESS_NO_MATCH') {
            var elseMenu = dinnerMenu.items.filter(item => item.category.toLowerCase() === slotValues.category.heardAs).map(item => {
                    return item.name + " is $" + item.price;
                }).join(", ");
            say = elseMenu.length > 0 ? elseMenu : "I found no " + slotValues.category.heardAs + " items";
        }

        //still just for testing if unwanted scripts run
        say += slotStatus;

        return responseBuilder
            .speak(say)
            .reprompt('try again, ' + say)
            .getResponse();
    },
};

//BuildOrder_Handler: builds up an order to send to the chef.
//Author: Zack, Max.
const BuildOrder_Handler =  {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'BuildOrder' ;
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
            AddToOrder(FindItem(slotValues.item.resolved));
            say = "successfully added " +slotValues.item.heardAs +" to order";
        }
        if (slotValues.item.ERstatus === 'ER_SUCCESS_NO_MATCH') {
            if(FindItem(slotValues.item.heardAs)!=null){
                AddToOrder(FindItem(slotValues.item.heardAs));
                say = "successfully added " +slotValues.item.heardAs +" to order";
            }
            else{
                say = "I could not find "+slotValues.item.heardAs+ " on the menu"
            }
            //slotStatus += 'which did not match any slot value. ';
            //console.log('***** consider adding "' + slotValues.item.heardAs + '" to the custom slot type used by slot item! '); 
        }

        //still just for testing if unwanted scripts run
        say += slotStatus;

        return responseBuilder
            .speak(say)
            .reprompt('try again, ' + say)
            .getResponse();
    },
};

//PlaceOrder_Handler:Places an order to the chef.
//Author:Alexa Development team.
const PlaceOrder_Handler =  {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'PlaceOrder' ;
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

        let say = 'Hello from PlaceOrder. ';


        return responseBuilder
            .speak(say)
            .reprompt('try again, ' + say)
            .getResponse();
    },
};
//PriceOfOrder_Handler:iterates through the current order and gives the total price.
//Author:Jack,Max.
const PriceOfOrder_Handler =  {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'PriceOfOrder' ;
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        
        let currentPrice = 0;
        currentOrder.forEach(item => {
            currentPrice += item.price;
        });

        let say = "The current price of your order is $" + currentPrice;


        return responseBuilder
            .speak(say)
            .reprompt('try again, ' + say)
            .getResponse();
    },
};

//ReadCurrentOrder_Handler:Reads back the number of items in the current order.
//Author:Jack, Max.
const ReadCurrentOrder_Handler =  {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'ReadCurrentOrder' ;
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

        let say = "you have " + ReadCurrentOrder() +" in your order so far";


        return responseBuilder
            .speak(say)
            .reprompt('try again, ' + say)
            .getResponse();
    },
};

//RemoveItem_Handler:Removes an item from the current order.
//Author:Jack, Max.
const RemoveItem_Handler =  {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'RemoveItem' ;
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
            RemoveFromOrder(FindItem(slotValues.item.heardAs));
            
            if (RemoveFromOrder(slotValues.item.resolved)) {
                say = "successfully removed " +slotValues.item.heardAs +" from order";
            } else {
                say = "I could not find " + slotValues.item.heardAs +" in your order";
            }
        }
        if (slotValues.item.ERstatus === 'ER_SUCCESS_NO_MATCH') {
            slotStatus += 'which did not match any slot value. ';
            console.log('***** consider adding "' + slotValues.item.heardAs + '" to the custom slot type used by slot item! '); 
        }
        
        

        say += slotStatus;


        return responseBuilder
            .speak(say)
            .reprompt('try again, ' + say)
            .getResponse();
    },
};

//written by Amazon default.
const LaunchRequest_Handler =  {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'LaunchRequest';
    },
    handle(handlerInput) {
        const responseBuilder = handlerInput.responseBuilder;

        let say = 'hello' + ' and welcome to ' + invocationName + ' ! Say help to hear some options.';



        return responseBuilder
            .speak(say)
            .reprompt('try again, ' + say)
              .getResponse();
    },
};

const SessionEndedHandler =  {
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
const ErrorHandler =  {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        const request = handlerInput.requestEnvelope.request;

        console.log(`Error handled: ${error.message}`);
        // console.log(`Original Request was: ${JSON.stringify(request, null, 2)}`);

        return handlerInput.responseBuilder
            .speak('Sorry, an error occurred.  Please say again.')
            .reprompt('Sorry, an error occurred.  Please say again.')
            .getResponse();
    }
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

     return myString.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); }) ;
}
//written by Amazon default.
function randomElement(myArray) { 
    return(myArray[Math.floor(Math.random() * myArray.length)]); 
} 
 
 //written by Amazon default.
function stripSpeak(str) { 
    return(str.replace('<speak>', '').replace('</speak>', '')); 
} 
 
 
 
 //written by Amazon default.
function getSlotValues(filledSlots) { 
    const slotValues = {}; 
 
    Object.keys(filledSlots).forEach((item) => { 
        const name  = filledSlots[item].name; 
 
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
 
        if(modelIntents[i].name.substring(0,7) != "AMAZON." && modelIntents[i].name !== "LaunchRequest" ) { 
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
        if(handlerInput.requestEnvelope.session['new']) { 
 
            sessionAttributes = handlerInput.attributesManager.getSessionAttributes(); 
 
            let memoryAttributes = getMemoryAttributes(); 
 
            if(Object.keys(sessionAttributes).length === 0) { 
 
                Object.keys(memoryAttributes).forEach(function(key) {  // initialize all attributes from global list 
 
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
        if (thisRequest.type === 'IntentRequest' ) { 
 
            let slots = []; 
 
            IntentRequest = { 
                'IntentRequest' : thisRequest.intent.name 
            }; 
 
            if (thisRequest.intent.slots) { 
 
                for (let slot in thisRequest.intent.slots) { 
                    let slotObj = {}; 
                    slotObj[slot] = thisRequest.intent.slots[slot].value; 
                    slots.push(slotObj); 
                } 
 
                IntentRequest = { 
                    'IntentRequest' : thisRequest.intent.name, 
                    'slots' : slots 
                }; 
 
            } 
 
        } else { 
            IntentRequest = {'IntentRequest' : thisRequest.type}; 
        } 
        if(history.length > maxHistorySize - 1) { 
            history.shift(); 
        } 
        history.push(IntentRequest); 
 
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes); 
 
    } 
 
}; 
 
 
 
 //written by Amazon default.
const RequestPersistenceInterceptor = { 
    process(handlerInput) { 
 
        if(handlerInput.requestEnvelope.session['new']) { 
 
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
            "outputSpeech":responseOutput.outputSpeech.ssml, 
            "reprompt":responseOutput.reprompt.outputSpeech.ssml 
        }; 
 
        sessionAttributes['lastSpeechOutput'] = lastSpeechOutput; 
 
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes); 
 
    } 
}; 
 //written by Amazon default.
const ResponsePersistenceInterceptor = { 
    process(handlerInput, responseOutput) { 
 
        const ses = (typeof responseOutput.shouldEndSession == "undefined" ? true : responseOutput.shouldEndSession); 
 
        if(ses || handlerInput.requestEnvelope.request.type == 'SessionEndedRequest') { // skill was stopped or timed out 
 
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
        ReadMenu_Handler, 
        Pricing_Handler, 
        BuildOrder_Handler, 
        PlaceOrder_Handler, 
        PriceOfOrder_Handler, 
        ReadCurrentOrder_Handler, 
        RemoveItem_Handler,
        FilterByPrice_Handler,
        AllergenFilter_Handler,
        LaunchRequest_Handler, 
        SessionEndedHandler
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
                        "what {category} are on the menu",
                        "what {category} is on the menu",
                        "what {category} do you have",
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
                        "how much are {item}",
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
                        "I'll have a {item}",
                        "order me a {item}",
                        "order me the {item}",
                        "i'd like a {item}",
                        "add {item} to order",
                        "order {item}"
                    ]
                },
                {
                    "name": "PlaceOrder",
                    "slots": [],
                    "samples": [
                        "send the order",
                        "confirm the order",
                        "place the order",
                        "send order to kitchen",
                        "place order"
                    ]
                },
                {
                    "name": "PriceOfOrder",
                    "slots": [],
                    "samples": [
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
                        }
                    ],
                    "samples": [
                        "what are the items {overUnder} {price}",
                        "test FilterByPrice {price}"
                    ]
                },
                {
                    "name": "AllergenFilter",
                    "slots": [
                        {
                            "name": "allergen",
                            "type": "allergen"
                        }
                    ],
                    "samples": [
                        "filter based on {allergen}"
                    ]
                },
                {
                    "name": "LaunchRequest",
                    "slots": [],
                    "samples": []
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
                                "value": "Burgers"
                            }
                        },
                        {
                            "name": {
                                "value": "Burger"
                            }
                        },
                        {
                            "name": {
                                "value": "Wraps"
                            }
                        },
                        {
                            "name": {
                                "value": "Entree"
                            }
                        },
                        {
                            "name": {
                                "value": "Appetizer"
                            }
                        },
                        {
                            "name": {
                                "value": "Wings"
                            }
                        },
                        {
                            "name": {
                                "value": "Paninis"
                            }
                        },
                        {
                            "name": {
                                "value": "Hot Sandwhiches"
                            }
                        },
                        {
                            "name": {
                                "value": "Salads"
                            }
                        },
                        {
                            "name": {
                                "value": "Street Tacos"
                            }
                        }
                    ]
                },
                {
                    "name": "item",
                    "values": [
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
                                "value": "Cowboy"
                            }
                        },
                        {
                            "name": {
                                "value": "California"
                            }
                        },
                        {
                            "name": {
                                "value": "Classic Hamburger"
                            }
                        },
                        {
                            "name": {
                                "value": "Double"
                            }
                        },
                        {
                            "name": {
                                "value": "Turkey"
                            }
                        },
                        {
                            "name": {
                                "value": "Tex-Mex"
                            }
                        },
                        {
                            "name": {
                                "value": "Peanut Butter Bacon"
                            }
                        },
                        {
                            "name": {
                                "value": "Gouda Bacon"
                            }
                        },
                        {
                            "name": {
                                "value": "Cesar Wrap"
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
                                "value": "Chicken Strips"
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
                                "value": "Chicken Avocado"
                            }
                        },
                        {
                            "name": {
                                "value": "Chicken Parmesan"
                            }
                        },
                        {
                            "name": {
                                "value": "Italian"
                            }
                        },
                        {
                            "name": {
                                "value": "Italian"
                            }
                        },
                        {
                            "name": {
                                "value": "Bacon Chicken Ranch"
                            }
                        },
                        {
                            "name": {
                                "value": "Bacon Chicken Chipotle"
                            }
                        },
                        {
                            "name": {
                                "value": "Chicken Caesar"
                            }
                        },
                        {
                            "name": {
                                "value": "Mandarin Chicken"
                            }
                        },
                        {
                            "name": {
                                "value": "Firecracker"
                            }
                        },
                        {
                            "name": {
                                "value": "Bacon Chicken Ranch"
                            }
                        },
                        {
                            "name": {
                                "value": "Bacon Chicken Chipotle"
                            }
                        },
                        {
                            "name": {
                                "value": "Chicken Caesar"
                            }
                        },
                        {
                            "name": {
                                "value": "Mandarin Chicken"
                            }
                        },
                        {
                            "name": {
                                "value": "Firecracker"
                            }
                        },
                        {
                            "name": {
                                "value": "House"
                            }
                        },
                        {
                            "name": {
                                "value": "Pork Carnitas"
                            }
                        },
                        {
                            "name": {
                                "value": "Beef Barbacoa"
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
                                    "less than"
                                ]
                            }
                        },
                        {
                            "name": {
                                "value": "over",
                                "synonyms": [
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
                                "value": "one hundred dollars"
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
                                "value": "vegan"
                            }
                        },
                        {
                            "name": {
                                "value": "gluten free"
                            }
                        }
                    ]
                }
            ]
        }
    }
};