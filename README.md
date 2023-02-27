# <img src="https://heythisischris.com/favicon.png" style="width:50px;margin-bottom:-10px;" /> hey, this is chris
### Portfolio website built with SvelteKit
![License](https://img.shields.io/github/license/heythisischris/heythisischris-api)
![Dependencies](https://img.shields.io/librariesio/github/heythisischris/heythisischris-api)
![Status](https://img.shields.io/website?label=Status&url=https%3A%2F%2Fapi.heythisischris.com)  
### [Website](https://heythisischris.com) • [API](https://api.heythisischris.com) • [Docs](https://docs.heythisischris.com)

## What is this?
It's the backend repository for my portfolio website.

## Quick overview of the stack
Currently, my portfolio website is split into two parts:
1. SvelteKit single page application for the frontend
2. Node.js API served through AWS Lambda

## Get up and running!
This API is based on AWS Lambda. Currently, I don't have any fancy Severless, Terraform, or CDK scripts to provision the necessary resources. However, if you create a Lambda function with the Node.js v18 runtime and call it "heythisischris", you can run the following script in your terminal in the project root (this will upload the zipped Node.js package).
```
npm install
zip -r lambda.zip *
aws lambda update-function-code --function-name heythisischris --zip-file \"fileb://lambda.zip\" > /dev/null
rm -f lambda.zip
```

## License
Licensed under the MIT License
