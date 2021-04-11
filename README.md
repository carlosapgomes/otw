# OurTeamWork (OTW)

This project helps a group of users to collect data securely and keep it
in sync with a Google spreadsheet.

## Prerequisites

### Clone this project

Clone this project and `cd` into its folder.

Create a file `config/otwConfig.json` (see the example in that folder) and
set the `projectOwner` and `appAdmin` email addresses.

### Firebase project

Create a new firebase project.

Create a `config/firebaseAppConfig.json`file and set all the Firebase config
options (see `config/firebaseAppConfig-example.json` for the required fields).

Download the project adminsdk service account key and save it to
`config/otw-firebase-serviceaccount.json`.

In the project's console, create a new service account with 'Reader' role.
Take note of the service account email address (a Google spreadsheet shall be
shared with this address before adding any data). Download this service
account key and save it in the local file `config/otw-hgrs-sheets.json`.

Enable the Sheets API in the GCP console page for the newly created project.

### Sendgrid account

Create a free Sendgrid account and download its API key.

In the project folder add this key to the functions environment variables:

`firebase functions:config:set sendgrid.apikey="your-sendgrid-api-key"`

Add `appAdmin` email address as a verified sender in the Sendgrid control
panel (Sender Authentication menu option).

## Deploy

`firebase deploy`

## Before first access

From the project root folder, create the first admin user with the command:

`node createAdmin.js`

## Quickstart

To get started:

```bash
npm init @open-wc
# requires node 10 & npm 6 or higher
```

## Scripts

- `start` runs your app for development, reloading on file changes
- `start:build` runs your app after it has been built using the build command
- `build` builds your app and outputs it in your `dist` directory
- `test` runs your test suite with Web Test Runner
- `lint` runs the linter for your project

## Tooling configs

For most of the tools, the configuration is in the `package.json` to reduce the amount of files in your project.

If you customize the configuration a lot, you can consider moving them to individual files.
