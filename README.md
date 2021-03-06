# OurTeamWork (OTW)

This project helps a group of health care workers to collect data about
procedures securely and keep it in sync with a Google spreadsheet.

## Prerequisites

### Clone this project

Clone this project and `cd` into its folder.

Create a file `functions/otwConfig.json` (see the example in that folder) and
set the `projectOwner` and `appAdmin` email addresses.

### Firebase project

Create a new firebase project.

Create a `config/firebaseAppConfig.js`file and set all the Firebase config
options (see `config/firebaseAppConfig-example.js` for the required fields).
The Firebase config options can be found in the project console after
adding a new web app.

Update `functions/otwConfig.json` with `authDomain` and `databaseURL` from the
file above.

Download the project adminsdk service account key and save it to
`functions/otw-firebase-serviceaccount.json`.

In the project's console, create a new service account with 'Reader' role.
Take note of the service account email address (a Google spreadsheet shall be
shared with this address before adding any data). Create a new key for this
account and save it in the file: `config/otw-sheets-serviceaccount.json`.

Enable the Sheets API in the GCP console page for the newly created project.

Create a Google Spreadsheet with any regular Google account, share it
with the above service account email address, allowing this account to edit
the spreadsheet.

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

Execute `yarn storybook` to test/check each component.

Build the system with: `yarn build`

Update `firebase.json` and change  `hosting.public` to `"dist"`

Deploy functions with `firebase deploy --only functons`

Run locally with `firebase serve --only hosting`

