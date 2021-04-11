// import * as readline from "readline";
const readline = require('readline');
// import * as admin from "firebase-admin";
const admin = require('firebase-admin');
// import * as serviceAccount from "./config/otw-firebase-serviceaccount.js";
const serviceAccount = require('./config/otw-firebase-serviceaccount.json');
// import * as firebaseAppConfig from "./config/firebaseAppConfig.js";
const firebaseAppConfig = require('./config/firebaseAppConfig.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: firebaseAppConfig.databaseURL,
});

function validateEmail(e) {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(e).toLowerCase());
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
let email;
let name;
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
      name = n;
      // rl.write(name);
      rl.close();
    } else {
      // eslint-disable-next-line no-console
      console.log('Invalid user name');
      process.exit(1);
    }
  });
});
rl.on('close', () => {
  // eslint-disable-next-line no-console
  console.log('email: ', email);
  // eslint-disable-next-line no-console
  console.log('name: ', name);
  const ref = admin.database().ref();
  const newKey = ref.child('users').push().key;
  const newUser = {
    email,
    name,
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
