let fs = require('fs');
let prevMenu = JSON.parse(fs.readFileSync(process.argv[2]).toString());

let result = {
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
        }
      ],
      "types": [
        {
          "name": "category",
          "values": [],
        },
        {
          "name": "item",
          "values": [],
        }
      ]
    }
  }
};

if (prevMenu.length > 0) prevMenu.items = prevMenu.map(menu => menu.menuItems).reduce((acc, val) => acc.concat(val), []);

let categories = prevMenu.items.map(item => item.category);
categories = categories.filter((item, index) => categories.indexOf(item) === index).map(category => {
  return {
    "name": {
      "value": category
    }
  }
});

result.interactionModel.languageModel.types[0].values = categories;

let item = prevMenu.items.map(item => {
  return {
    "name": {
      "value": item.name,
    }
  }
});



result.interactionModel.languageModel.types[1].values = item;
fs.writeFileSync("out.json", JSON.stringify(result, null, "\t"));