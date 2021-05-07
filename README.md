# OurTeamWork (OTW)

This project helps a group of health care workers to collect data about
procedures securely and keep it in sync with a Google spreadsheet.

## Prerequisites

### Clone this project

Clone this project and `cd` into its folder.

Create a file `config/otwConfig.json` (see the example in that folder) and
set the `projectOwner` and `appAdmin` email addresses.

### Firebase project

Create a new firebase project.

Create a `config/firebaseAppConfig.js`file and set all the Firebase config
options (see `config/firebaseAppConfig-example.js` for the required fields).
The Firebase config options can be found in the project console after 
adding a new web app.

Download the project adminsdk service account key and save it to
`config/otw-firebase-serviceaccount.json`.

In the project's console, create a new service account with 'Reader' role.
Take note of the service account email address (a Google spreadsheet shall be
shared with this address before adding any data). Download this service
account key and save it in the local file
`config/otw-sheets-serviceaccount.json`.

Enable the Sheets API in the GCP console page for the newly created project.

Create a Google Spreadsheet with any regular Google account, share it
with the above service account email address with an 'Editor' role.

### Sendgrid account

Create a free Sendgrid account and download its API key.

In the project folder add the API key to the functions environment variables:

`firebase functions:config:set sendgrid.apikey="your-sendgrid-api-key"`

Add `appAdmin` email address as a verified sender in the Sendgrid control
panel (Sender Authentication menu option).

## Deploy

`firebase deploy`

## Before first access

From the project root folder, create the first admin user with the command:

`node addUser.js`

Answer 'y' to `Is enabled?` and to `Is admin?`.

## Quickstart

## Scripts

- `start` runs your app for development, reloading on file changes
- `start:build` runs your app after it has been built using the build command
- `build` builds your app and outputs it in your `dist` directory
- `test` runs your test suite with Web Test Runner
- `lint` runs the linter for your project

