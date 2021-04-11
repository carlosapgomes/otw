const { google } = require('googleapis');
// import service account key
const key = require('../config/otw-hgrs-sheets.json');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
exports.authenticate = async () => {
  const auth = new google.auth.JWT(
    key.client_email,
    null,
    key.private_key,
    SCOPES,
    null
  );
  return auth;
};
