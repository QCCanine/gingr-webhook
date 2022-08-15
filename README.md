# Ginger-Airtable Sync
This application syncs dog data from the Gingr CRM to Airtable, in order to display all relevant animal information in a virtual whiteboard. It is built on top of the `serverless` framework and consists of two components:

1. A function behind API Gateway to receive Webhook events from Gingr
1. A scheduled sync. As Gingr's webhooks are inconsistent as to what actions trigger them, a scheduled sync is needed to reconcile errors.

## Getting Started
Before you begin there are a few steps to take

1. Make sure you have `Node` and `npm` installed. Follow the instructions at https://docs.npmjs.com/downloading-and-installing-node-js-and-npm for details for your operating system.
1. Install the serverless CLI globally with the command `npm i -g serverless`.
1. Install the npm packages with `npm i`. This should create a `.node_modules` folder.
1. Set your AWS credentials. You will need to reach out to dilling123@gmail.com for credentials. Once you have them, set them with `serverless config credentials --provider aws --key xxx --secret xxx`


## Running the Application
Running the application is easy. A few common operations have been pre-configured. For advanced configuration consult the [Serverless API docs](https://www.serverless.com/framework/docs).

1. Run `npm run checkIn` to send a check in event.
1. Run `npm run checkOut` to send a check out event.
1. Run `npm run sync` to run the sync operation.

By default all commands will interact with the [development Airtable base](https://airtable.com/appkIVEko9VyjkIVP/tbl4s792KJxUWCmEJ/viwOyF7PhkNL4emJT?blocks=hide), not the production base, so running these commands is safe and encouraged before pushing any changes.

## Deploying the Application
Deployment is done automatically. Commits to the `main` branch of this repo are automatically deployed, so be sure that you are confident in changes before merging.

## Testing the Gingr API
In order to simplify interacting with the Gingr API for testing purposes, a Thunder API spec has been provided with this repo.

1. If needed, download the `Thunder Client` extension for VSCode.
1. Add your Gingr api key to the Local environment in `Thuder Client (VSCode Sidebar) > Env > Local Env > API_KEY`.

Once that setup is complete, Gingr API routes can be tested in the collections tab of the extension.
