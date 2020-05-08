# alexa
Alexa skill that interfaces with the Auto-Garcon application


### Contributing? 
 Submit a pull request. See a tutorial [here](https://zachmsorenson.github.io/tutorials/github)
 
 To notify one of the repository team members of your pull request and have them review/merge it, add them as a "reviewer" on the right hand side of the page. The repository team member from the alexa team is "maximilian98" on github.


### Setting Up from the GitHub Page
First the repository will need to be forked and all scripts will need to be downloaded. An Amazon and Alexa Developer account will need to be created and set up for the restaurant, and a Lambda account will need to be requested and provisioned. 

#### Provisioning Alexa Developer Console
Set up an [Alexa Developer Account](https://www.amazon.com/ap/register?clientContext=133-2623455-2930301&showRememberMe=true&openid.pape.max_auth_age=7200&openid.identity=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&marketPlaceId=ATVPDKIKX0DER&pageId=amzn_dante_us&openid.pape.preferred_auth_policies=Singlefactor&openid.return_to=https%3A%2F%2Fdeveloper.amazon.com%2Falexa%2Fconsole%2Fask&prevRID=C8RQ7F7G90ZGFKMKDK2G&openid.assoc_handle=amzn_dante_us&openid.mode=checkid_setup&prepopulatedLoginId=&failedSignInCount=0&openid.claimed_id=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.ns=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0 ) for the restaurant. After setting up, open the Alexa Developer Console and create a new skill. Name the skill "Auto-Garcon". Select "Custom" as the model to add to the skill and "Provision your own" as the method to host the skill's backend resources. Choose "Start from scratch" as your template option.   

#### Lambda
An [AWS account](https://portal.aws.amazon.com/billing/signup#/start) will also need to be created along with an [Amazon Lambda account](https://aws.amazon.com/lambda/). Click "Get started with AWS Lambda."  

When creating a new Lambda function, "Author from scratch" and name the Function "Auto-Garcon." Following creation copy and paste the index.js script from the GitHub repo into the premade index.js file in the Lambda. Add a new trigger to the Lambda and copy the Alexa Skill ID, which can be found under the "Alexa Skills" page in the Alexa Developer Console. Follow [these instructions](https://docs.aws.amazon.com/lambda/latest/dg/nodejs-package.html) to install npm dependencies onto the Lambda. 

#### Setting Up Developer Console
After the restaurant owner is done setting up all of their menus in the database, these menus will need to be pulled from the database and ran with the transform.js script. This will create the JSON object for creating all the details of the skill. From here, go to the build menu of the developer console, find the JSON Editor on the lefthand side and copy and paste the output from the out.json script. Then save and build the model. This will get the machine learning up and running. From here copy all the JSON and add it to the end of the index.js script under the model variable. Then copy and paste the whole index.js file into your Lambda console. The Lambda ARN will need to be copied and pasted as the endpoint on the Amazon Developer Console. The software is now ready to run Auto-Garcon. 

#### Running transform.js

> node transform.js input.json

This takes in the Auto-Garcon standard JSON menu format, and outputs an alexa compatible JSON object as out.json.

> node transform_net.js https://autogarcon.live/api/restaurant/5/menu

This hits an Auto-Garcon compatible API endpoint, and outputs an alexa compatible JSON object as out_net.json
