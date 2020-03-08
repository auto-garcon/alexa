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
                        "add {item} to order",
                        "order {item}"
                    ]
                },
                {
                    "name": "PlaceOrder",
                    "slots": [],
                    "samples": [
                        "send order to kitchen",
                        "place order"
                    ]
                }
            ],
            "types": [
                {
                    "name": "category",
                    "values": [],
                },
                {
                    "name": "items",
                    "values": [],
                }
            ]
        }
    }
}

let categories = prevMenu.items.map(item => item.category);
categories = categories.filter((item, index) => categories.indexOf(item) === index).map(category => {
    return {
        "name": {
            "value": category
        }
    }
});

result.interactionModel.languageModel.types[0].values = categories;

let items = prevMenu.items.map(item => {
    return {
        "name": {
            "value": item.name,
        }
    }
});



result.interactionModel.languageModel.types[1].values = items;
fs.writeFileSync("out.json", JSON.stringify(result, null, "\t"));