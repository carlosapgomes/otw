// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions

const { google } = require('googleapis');
const admin = require('firebase-admin');
const functions = require('firebase-functions');
const sgMail = require('@sendgrid/mail');
const authGSheets = require('./authGSheets.js');
const otwConfig = require('./otwConfig.json');

const characters =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const generateString = length => {
  let result = new String();
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

sgMail.setApiKey(functions.config().sendgrid.apikey);
try {
  admin.initializeApp();
} catch (e) {
  console.log('fb adin is initialized');
}
const newPhoneNumber = () => {
  const phoneNumberGenerated = String(
    Math.floor(Math.random() * 900000000000000) + 100000000000000
  );
  return phoneNumberGenerated.padStart(15, '0');
};
// on new user added by admin
exports.addNewUser = functions
  .runWith({
    timeoutSeconds: 60,
    memory: '256MB',
  })
  .database.ref('/users/{uid}')
  .onCreate(async snapshot => {
    // Grab the current value of what was written to the Realtime Database.
    const u = snapshot.val();
    if (!u.email || !u.displayName) {
      console.log('bad user data, operation cancelled');
      return null;
    }
    if (!u.phoneNumber) {
      u.phoneNumber = `+${newPhoneNumber()}`;
    } else if (u.phoneNumber.charAt(0) !== '+') {
      u.phoneNumber = `+${u.phoneNumber}`;
    }
    const nu = {
      email: u.email,
      emailVerified: false,
      phoneNumber: u.phoneNumber,
      password: u.password || generateString(30), // random temp password
      displayName: u.displayName,
      disabled: false,
    };
    const customClaims = {
      isAdmin: u.isAdmin || false,
      isEnabled: u.isEnabled || false,
    };
    let user;
    try {
      user = await admin.auth().createUser(nu);
      if (user) {
        //console.log(JSON.stringify(user, null, 2));
        await admin.auth().setCustomUserClaims(user.uid, customClaims);
        const link = await admin.auth().generatePasswordResetLink(user.email, {
          url: otwConfig.authDomain,
        });
        const msg = {
          to: user.email,
          bcc: otwConfig.projectOwner,
          from: otwConfig.appAdmin,
          subject: 'Configuração de senha',
          text: `Prezado usuário,\n sua conta foi adicionada em nosso sistema.\n
              Para configura sua senha basta clicar no seguinte link: ${link} .
              \n\nAtt.\n\n OurTeamWork Manager.`,
        };
        return await sgMail.send(msg);
      }
    } catch (error) {
      console.log(error);
      return null;
    }
    console.log('user created successfully');
    console.log(JSON.stringify(user, null, 2));
    return null;
  });

// on update user
exports.updateUser = functions
  .runWith({
    timeoutSeconds: 60,
    memory: '256MB',
  })
  .database.ref('/users/{uid}')
  .onUpdate(async change => {
    // Grab the current and previous values
    const b = change.before.val();
    const a = change.after.val();
    // console.log(JSON.stringify(p, null, 2));
    // console.log(JSON.stringify(u, null, 2));
    let userData;
    try {
      // get current user data (for account details)
      userData = await admin.auth().getUserByEmail(b.email);
      // console.log(JSON.stringify(userData));
    } catch (error) {
      console.log('Could not obtain user account data');
    }

    if (!b.email || !a.displayName) {
      console.log('bad user data, operation cancelled');
      return null;
    }
    if (!b.phoneNumber) {
      a.phoneNumber = `+${newPhoneNumber()}`;
    } else if (a.phoneNumber.charAt(0) !== '+') {
      a.phoneNumber = `+${a.phoneNumber}`;
    }

    const updatedUser = {
      email: b.email,
      emailVerified: userData.emailVerified,
      phoneNumber: a.phoneNumber,
      displayName: a.displayName,
      disabled: !a.isEnabled,
    };
    const customClaims = {
      isAdmin: a.isAdmin || false,
      isEnabled: a.isEnabled || false,
    };

    let user;
    try {
      await admin.auth().setCustomUserClaims(userData.uid, customClaims);
      if (!a.isEnabled) {
        await admin.auth().revokeRefreshTokens(userData.uid);
        const userRecord = await admin.auth().getUser(userData.uid);
        // @ts-ignore
        const utcRevocationTimeSecs =
          new Date(userRecord.tokensValidAfterTime).getTime() / 1000;
        console.log(`revoke time: ${utcRevocationTimeSecs}`);
        await admin
          .database()
          .ref(`metadata/${userData.uid}`)
          .set({ revokeTime: utcRevocationTimeSecs });
      }
      user = await admin.auth().updateUser(userData.uid, updatedUser);
      if (user) {
        console.log(JSON.stringify(user, null, 2));
      }
    } catch (error) {
      console.log(error);
      return null;
    }
    console.log('user updated successfully');
    // console.log(JSON.stringify(user, null, 2));
    return null;
  });

// on new procedure added
exports.addNewProcedure = functions
  .runWith({
    timeoutSeconds: 60,
    memory: '256MB',
  })
  .database.ref('/procedures/{id}')
  .onCreate(async (snapshot, ctx) => {
    const auth = await authGSheets.authenticate();
    if (!auth) {
      console.log('missing auth');
      return null;
    }
    // get spreadsheetId from database
    const ssRef = admin.database().ref('/spreadsheet/sheet1');
    let snap;
    let sheet;
    try {
      snap = await ssRef.get();
      if (snap.exists()) {
        sheet = snap.val();
      }
    } catch (error) {
      console.log(error);
      return null;
    }

    const sheets = google.sheets({ version: 'v4', auth });
    // Grab the current value of what was written to the Realtime Database.
    const p = snapshot.val();
    const row = [
      p.date,
      p.procedure,
      p.procCode,
      p.patientName,
      p.doctorName,
      ctx.params.id,
    ];

    let res;
    try {
      res = await sheets.spreadsheets.values.append({
        spreadsheetId: sheet.ssId,
        range: sheet.name, // Change Sheet1 if your worksheet's name is something else
        valueInputOption: 'USER_ENTERED',
        includeValuesInResponse: true,
        responseValueRenderOption: 'UNFORMATTED_VALUE',
        requestBody: {
          values: [row],
        },
      });
      console.log(JSON.stringify(res.data, null, 2));
      console.log(res.data.updates.updatedData.values[0][0]);
      return null;
    } catch (error) {
      console.log(error);
      return null;
    }
  });

// on new procedure added
exports.updateProcedure = functions
  .runWith({
    timeoutSeconds: 60,
    memory: '256MB',
  })
  .database.ref('/procedures/{id}')
  .onUpdate(async (change, ctx) => {
    const auth = await authGSheets.authenticate();
    if (!auth) {
      console.log('missing auth');
      return null;
    }
    console.log(JSON.stringify(ctx.auth));
    const sheets = google.sheets({ version: 'v4', auth });
    // Grab the current value of what was written to the Realtime Database.
    const p = change.after.val();
    const row = [
      p.date,
      p.procedure,
      p.procCode,
      p.patientName,
      p.doctorName,
      ctx.params.id,
    ];

    // get spreadsheetId from database
    const ssRef = admin.database.ref('/spreadsheet/sheet1');
    let snapshot;
    let sheet;
    try {
      snapshot = await ssRef.get();
      if (snapshot.exists()) {
        sheet = snapshot.val();
      }
    } catch (error) {
      console.log(error);
      return null;
    }

    let res;
    let rowToUpdate;
    //  search for the previoulsy recorded procedure row
    try {
      res = await sheets.spreadsheets.values.update({
        spreadsheetId: sheet.ssId,
        range: `${sheet.name}!Z1`,
        includeValuesInResponse: true,
        responseValueRenderOption: 'UNFORMATTED_VALUE',
        valueInputOption: 'USER_ENTERED',
        fields: 'updatedData',
        requestBody: {
          values: [[`=MATCH("${ctx.params.id}";F:F;0)`]],
        },
      });
      [[rowToUpdate]] = res.data.updatedData.values;
    } catch (error) {
      console.log('Could not obtain the spreadsheet row to be updated.');
      return null;
    }

    try {
      res = await sheets.spreadsheets.values.update({
        spreadsheetId: sheet.ssId,
        range: `${sheet.name}!A${rowToUpdate}:F${rowToUpdate}`,
        valueInputOption: 'USER_ENTERED',
        includeValuesInResponse: true,
        responseValueRenderOption: 'UNFORMATTED_VALUE',
        requestBody: {
          values: [row],
        },
      });
      console.log(JSON.stringify(res.data, null, 2));
      // console.log(res.data.updates.updatedData.values[0][0]);
      return null;
    } catch (error) {
      console.log(error);
      return null;
    }
  });
