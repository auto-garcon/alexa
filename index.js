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

function GetPrice(itemObject){
    return itemObject.price;
}

function AddToOrder(itemObject){
    currentOrder.push(itemObject);
}

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

const maxHistorySize = 20; // remember only latest 20 intents 


// 1. Intent Handlers =============================================

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
            //do based on .heardAs
            slotStatus += 'which did not match any slot value. ';
            console.log('***** consider adding "' + slotValues.item.heardAs + '" to the custom slot type used by slot item! '); 
        }

        //still just for testing if unwanted scripts run
        say += slotStatus;

        return responseBuilder
            .speak(say)
            .reprompt('try again, ' + say)
            .getResponse();
    },
};

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


const LaunchRequest_Handler =  {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'LaunchRequest';
    },
    handle(handlerInput) {
        const responseBuilder = handlerInput.responseBuilder;

        let say = 'hello' + ' and welcome to ' + invocationName + ' ! Say help to hear some options.';

        let skillTitle = capitalize(invocationName);


        return responseBuilder
            .speak(say)
            .reprompt('try again, ' + say)
            .withStandardCard('Welcome!', 
              'Hello!\nThis is a card for your skill, ' + skillTitle,
               welcomeCardImg.smallImageUrl, welcomeCardImg.largeImageUrl)
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

function capitalize(myString) {

     return myString.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); }) ;
}

 
function randomElement(myArray) { 
    return(myArray[Math.floor(Math.random() * myArray.length)]); 
} 
 
function stripSpeak(str) { 
    return(str.replace('<speak>', '').replace('</speak>', '')); 
} 
 
 
 
 
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
 
function getExampleSlotValues(intentName, slotName) { 
 
    let examples = []; 
    let slotType = ''; 
    let slotValuesFull = []; 
 
    let intents = model.interactionModel.languageModel.intents; 
    for (let i = 0; i < intents.length; i++) { 
        if (intents[i].name == intentName) { 
            let slots = intents[i].slots; 
            for (let j = 0; j < slots.length; j++) { 
                if (slots[j].name === slotName) { 
                    slotType = slots[j].type; 
 
                } 
            } 
        } 
         
    } 
    let types = model.interactionModel.languageModel.types; 
    for (let i = 0; i < types.length; i++) { 
        if (types[i].name === slotType) { 
            slotValuesFull = types[i].values; 
        } 
    } 
 
 
    examples.push(slotValuesFull[0].name.value); 
    examples.push(slotValuesFull[1].name.value); 
    if (slotValuesFull.length > 2) { 
        examples.push(slotValuesFull[2].name.value); 
    } 
 
 
    return examples; 
} 
 
function sayArray(myData, penultimateWord = 'and') { 
    let result = ''; 
 
    myData.forEach(function(element, index, arr) { 
 
        if (index === 0) { 
            result = element; 
        } else if (index === myData.length - 1) { 
            result += ` ${penultimateWord} ${element}`; 
        } else { 
            result += `, ${element}`; 
        } 
    }); 
    return result; 
} 
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
 
 
const welcomeCardImg = { 
    smallImageUrl: "https://s3.amazonaws.com/skill-images-789/cards/card_plane720_480.png", 
    largeImageUrl: "https://s3.amazonaws.com/skill-images-789/cards/card_plane1200_800.png" 
 
 
}; 
 
const DisplayImg1 = { 
    title: 'Jet Plane', 
    url: 'https://s3.amazonaws.com/skill-images-789/display/plane340_340.png' 
}; 
const DisplayImg2 = { 
    title: 'Starry Sky', 
    url: 'https://s3.amazonaws.com/skill-images-789/display/background1024_600.png' 
 
}; 
 
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
 
function getSampleUtterance(intent) { 
 
    return randomElement(intent.samples); 
 
} 
 
function getPreviousIntent(attrs) { 
 
    if (attrs.history && attrs.history.length > 1) { 
        return attrs.history[attrs.history.length - 2].IntentRequest; 
 
    } else { 
        return false; 
    } 
 
} 
 
function getPreviousSpeechOutput(attrs) { 
 
    if (attrs.lastSpeechOutput && attrs.history.length > 1) { 
        return attrs.lastSpeechOutput; 
 
    } else { 
        return false; 
    } 
 
} 
 
function timeDelta(t1, t2) { 
 
    const dt1 = new Date(t1); 
    const dt2 = new Date(t2); 
    const timeSpanMS = dt2.getTime() - dt1.getTime(); 
    const span = { 
        "timeSpanMIN": Math.floor(timeSpanMS / (1000 * 60 )), 
        "timeSpanHR": Math.floor(timeSpanMS / (1000 * 60 * 60)), 
        "timeSpanDAY": Math.floor(timeSpanMS / (1000 * 60 * 60 * 24)), 
        "timeSpanDesc" : "" 
    }; 
 
 
    if (span.timeSpanHR < 2) { 
        span.timeSpanDesc = span.timeSpanMIN + " minutes"; 
    } else if (span.timeSpanDAY < 2) { 
        span.timeSpanDesc = span.timeSpanHR + " hours"; 
    } else { 
        span.timeSpanDesc = span.timeSpanDAY + " days"; 
    } 
 
 
    return span; 
 
} 
 
 
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
          "name": "LaunchRequest"
        }
      ],
      "types": [
        {
          "name": "category",
          "values": [
            {
              "name": {
                "value": "baked goods"
              }
            },
            {
              "name": {
                "value": "beers",
                "synonyms": [
                  "beer"
                ]
              }
            },
            {
              "name": {
                "value": "gluten free"
              }
            },
            {
              "name": {
                "value": "vegan",
                "synonyms": [
                  "vegetarian",
                  "meatless"
                ]
              }
            },
            {
              "name": {
                "value": "sides"
              }
            },
            {
              "name": {
                "value": "sandwiches"
              }
            },
            {
              "name": {
                "value": "soups"
              }
            },
            {
              "name": {
                "value": "tests"
              }
            },
            {
              "name": {
                "value": "drinks",
                "synonyms": [
                  "beverages"
                ]
              }
            },
            {
              "name": {
                "value": "desserts"
              }
            },
            {
              "name": {
                "value": "entrees"
              }
            },
            {
              "name": {
                "value": "appetizers",
                "synonyms": [
                  "apps",
                  "starters"
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
                "value": "Pinot noir"
              }
            },
            {
              "name": {
                "value": "Merlot"
              }
            },
            {
              "name": {
                "value": "Summit IPA"
              }
            },
            {
              "name": {
                "value": "Ham's"
              }
            },
            {
              "name": {
                "value": "Corona"
              }
            },
            {
              "name": {
                "value": "Cowboy Burger"
              }
            },
            {
              "name": {
                "value": "Black Bean Burger"
              }
            },
            {
              "name": {
                "value": "Mini Tacos"
              }
            },
            {
              "name": {
                "value": "Cheesecurds"
              }
            },
            {
              "name": {
                "value": "water"
              }
            }
          ]
        }
      ]
    }
  }
};
