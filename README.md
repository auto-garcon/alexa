# alexa
Alexa skill that interfaces with the Auto-Garcon application


### Contributing? 
 Submit a pull request. See a tutorial [here](https://zachmsorenson.github.io/tutorials/github)
 
 To notify one of the repository team members of your pull request and have them review/merge it, add them as a "reviewer" on the right hand side of the page. The repository team member from the alexa team is "maximilian98" on github.


### Setting Up from the GitHub Page
First you will need to fork the respository and download all the scripts. You will also need to create an Amazon account for your company and get Lambda provisioning and an Alexa Developer account set up. 

#### Alexa Developer Console
Set up an Alexa Developer Account for your restaurant. After setting up, open the Alexa Developer Console and create a new skill. Name your skill "Auto-Garcon". Select "Custom" as the model to add to your skill and "Provision your own" as the method to host your skill's backend resources. Choose "Start from scratch" as your template option. 

You will also need to [create](https://portal.aws.amazon.com/billing/signup#/start) an AWS account and [setup](https://aws.amazon.com/lambda/) an Amazon Lambda account. Click "Get started with AWS Lambda." ...this is an aws educate account if you are a student. at least that's what we did...
When creating a new Lambda funtion, you will want to "Author from scratch" and name your Function "Auto-Garcon." Following creation you will copy and paste the index.js script into the premade index.js file in the Lambda. You will have to add a new trigger and copy your Alexa Skill ID, which can be found under the "Alexa Skills" page in the alexa developer console.
...somehow install npm dependencies


After the restaurant owner is done setting up all of their menus in the database, these menus will need to be pulled from the database and ran with the transform.js script. This will create the JSON object for creating all the details of your skill. From here you can go to the build menu of the developer console, find the JSON Editor on the lefthand side and copy and paste the output from the out.json script. Then save and build the model. This will get the machine learning up and running. From here copy all the JSON and add it to the end of the index.js script under the model variable. Then copy and paste the whole index.js file into your Lambda console. The Lambde ARN will need to be copied and pasted as the endpoint on the Amazon Developer Console. After all this is done, connect the Raspberry Pi to your company's Amazon account and it should be ready to run Auto-Garcon.

#### Running transform.js

> node transform.js input.json


This will output as out.json.
