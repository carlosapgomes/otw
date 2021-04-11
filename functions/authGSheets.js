import { google } from 'googleapis';
// import service account key
import * as key from '../otw-hgrs-sheets.json';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
export const authenticate = async () => {
  const auth = new google.auth.JWT(
    key.client_email,
    null,
    key.private_key,
    SCOPES,
    null
  );
  return auth;
};
