// import * as readline from "readline";
const readline = require('readline');
const admin = require('firebase-admin');
const serviceAccount = require('./config/otw-firebase-serviceaccount.json');
const otwConfig = require('./config/otwConfig.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: otwConfig.databaseURL,
});

function validateEmail(e) {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(e).toLowerCase());
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
let email = '';
let displayName = '';
let phoneNumber = '';
let isEnabled = false;
let isAdmin = false;
rl.question('Email address: ', e => {
  if (validateEmail(e)) {
    email = e;
    // rl.write(email);
  } else {
    // eslint-disable-next-line no-console
    console.log('Invalid email address');
    process.exit(1);
  }
  rl.question('User name ', n => {
    if (n.length >= 3) {
      displayName = n;
      // rl.write(name);
      rl.close();
    } else {
      // eslint-disable-next-line no-console
      console.log('Invalid user name');
      process.exit(1);
    }
    rl.question('Phone number: ', phone => {
      if (phone.length > 7) {
        phoneNumber = phone;
      } else {
        // eslint-disable-next-line no-console
        console.log('Invalid phone number');
        process.exit(1);
      }
      rl.question('Is enabled (y/n)? ', enabled => {
        switch (String(enabled).toLowerCase()) {
          case 'y':
            isEnabled = true;
            break;
          case 'n':
            isEnabled = false;
            break;
          default:
            // eslint-disable-next-line no-console
            console.log('Invalid answer');
            process.exit(1);
        }
        rl.question('Is admin (y/n)? ', adm => {
          switch (String(adm).toLowerCase()) {
            case 'y':
              isAdmin = true;
              break;
            case 'n':
              isAdmin = false;
              break;
            default:
              // eslint-disable-next-line no-console
              console.log('Invalid answer');
              process.exit(1);
          }
        });
      });
    });
  });
});
rl.on('close', () => {
  // eslint-disable-next-line no-console
  console.log('email: ', email);
  // eslint-disable-next-line no-console
  console.log('name: ', displayName);
  // eslint-disable-next-line no-console
  console.log('phone: ', phoneNumber);
  // eslint-disable-next-line no-console
  console.log('isEnabled: ', isEnabled);
  // eslint-disable-next-line no-console
  console.log('isAdmin: ', isAdmin);
  const ref = admin.database().ref();
  const newKey = ref.child('users').push().key;
  const newUser = {
    email,
    displayName,
    phoneNumber,
    isEnabled,
    isAdmin,
  };
  ref
    .child('users')
    .child(newKey)
    .set(newUser, e => {
      if (!e) {
        // eslint-disable-next-line no-console
        console.log('User added');
        process.exit(0);
      } else {
        // eslint-disable-next-line no-console
        console.log(e);
        process.exit(0);
      }
    });
});
