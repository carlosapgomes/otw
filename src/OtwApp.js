/* eslint-disable lit-a11y/anchor-is-valid */
import { installRouter } from 'pwa-helpers/router.js';
import { LitElement, html } from 'lit-element';
import { classMap } from 'lit-html/directives/class-map.js';
import { templateLogin } from './templateLogin.js';
import { firebaseAppConfig } from '../config/firebaseAppConfig.js';

let auth = null;
let db = null;

export class OtwApp extends LitElement {
  // use lightDOM
  createRenderRoot() {
    return this;
  }

  static get properties() {
    return {
      title: { type: String },
      _page: { type: String },
      _burgerActive: { type: Boolean },
      _user: { type: Object },
      _loggedIn: { type: Boolean },
      _isAdmin: { type: Boolean },
      _toggleModal: { type: Boolean },
      _modalMsg: { type: String },
      _spinnerHidden: { type: Boolean },
      _procedures: { type: Array },
      _showProcedureForm: { type: Boolean },
      _currentProcedure: { type: Object },
      _currentProceduresDate: { type: String },
      _adminDropDownOpen: { type: Boolean },
      _users: { type: Array },
      _showUserForm: { type: Boolean },
      _currentEditUser: { type: Object },
      _toggleResetPwModal: { type: Boolean },
      _doctors: { type: Array },
      _showDoctorForm: { type: Boolean },
      _currentEditDoctor: { type: Object },
      _proceduresTypes: { type: Array },
      _showProcTypeForm: { type: Boolean },
      _currentEditProcType: { type: Object },
    };
  }

  constructor() {
    super();
    this._page = 'home';
    this._burgerActive = false;
    this._user = null;
    this._loggedIn = false;
    this._isAdmin = false;
    this._toggleModal = false;
    this._modalMsg = '';
    this._procedures = null;
    this._spinnerHidden = true;
    this._showProcedureForm = false;
    this._currentProcedure = {};
    this._currentProceduresDate = '';
    this._adminDropDownOpen = false;
    this._users = [];
    this._currentEditUser = {};
    this._showUserForm = false;
    this._toggleResetPwModal = false;
    this._doctors = [];
    this._showDoctorForm = false;
    this._currentEditDoctor = {};
    this._proceduresTypes = [];
    this._showProcTypeForm = false;
    this._currentEditProcType = {};
    this.auth = null;
    this.db = null;
  }

  firstUpdated() {
    installRouter(location => this._locationChanged(location));

    // add event listeners
    document.getElementById('loginactionbtn').addEventListener('click', e => {
      e.preventDefault();
      // @ts-ignore
      if (document.getElementById('loginform').reportValidity()) {
        this._handleSignIn();
      }
    });
    document.getElementById('resetpw').addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      this._toggleResetPwModal = true;
    });

    // add data store event listeners

    // Procedures
    this.addEventListener(
      'update-procedures-list',
      this._updateTodayProceduresList
    );
    this.addEventListener(
      'update-procedures-list-by-date',
      this._updateProceduresListByDate
    );
    this.addEventListener('edit-procedure', this._editProcedure);
    this.addEventListener('add-procedure', this._loadShowProcForm);
    this.addEventListener('save-proctype-form', this._saveProcedure);
    this.addEventListener('close-proctype-form', () => {
      this._currentProcedure = null;
      this._showProcedureForm = false;
    });

    // Users
    this.addEventListener('update-users-list', this._updateUsersList);
    this.addEventListener('edit-user', this._editUser);
    this.addEventListener('add-user', this._loadShowUserForm);
    this.addEventListener('save-user-form', this._saveUser);
    this.addEventListener('close-user-form', () => {
      this._currentEditUser = null;
      this._showUserForm = false;
    });

    // doctors
    this.addEventListener('update-doctors-list', this._updateDoctorsList);
    this.addEventListener('edit-doctor', this._editDoctor);
    this.addEventListener('add-doctor', this._loadShowDoctorForm);
    this.addEventListener('save-doctor-form', this._saveDoctor);
    this.addEventListener('close-doctor-form', () => {
      this._currentEditDoctor = null;
      this._showDoctorForm = false;
    });

    // procedures types
    this.addEventListener(
      'update-procedures-types-list',
      this._updateProcTypesList
    );
    this.addEventListener('edit-procedure-type', this._editProcType);
    this.addEventListener('add-procedure-type', this._loadShowProcTypeForm);
    this.addEventListener('save-procedure-type-form', this._saveProcType);
    this.addEventListener('close-procedure-type-form', () => {
      this._currentEditProcType = null;
      this._showProcTypeForm = false;
    });

    // add spinner event listeners
    // dynamically load otw-spinner if neccessary
    this.addEventListener('show-spinner', () => {
      if (typeof customElements.get('otw-spinner') === 'undefined') {
        import('./otw-spinner.js').then(() => {
          this._spinnerHidden = false;
        });
      } else {
        this._spinnerHidden = false;
      }
    });
    this.addEventListener('hide-spinner', () => {
      this._spinnerHidden = true;
    });

    // scroll to the bottom when password input has focus
    // to avoid covering by android keyboard
    document.getElementById('password').addEventListener('focus', e => {
      // @ts-ignore
      const rect = e.target.getBoundingClientRect();
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      const topPos = rect.top + scrollTop;
      window.scrollTo(0, topPos);
    });
    this._initFirebase();
  }

  // eslint-disable-next-line class-methods-use-this
  async _loadFirebase() {
    // dynamically load firebase
    const firebase = await import('firebase/app');
    await import('firebase/auth');
    await import('firebase/database');
    try {
      // initialize firebase
      firebase.default.initializeApp(firebaseAppConfig);
    } catch (err) {
      // we skip the "already exists" message which is
      // not an actual error when we're hot-reloading
      if (!/already exists/.test(err.message)) {
        // eslint-disable-next-line no-console
        console.error('Firebase initialization error', err.stack);
      }
    }
    return [firebase.default.auth(), firebase.default.database()];
  }

  async _initFirebase() {
    // Listening for auth state changes.
    if (!auth && !db) {
      [auth, db] = await this._loadFirebase();
    }
    auth.onAuthStateChanged(user => {
      if (user) {
        this._spinnerHidden = false;
        // User is signed in.
        this._user = {};
        this._loggedIn = true;
        this._user.displayName = user.displayName;
        this._user.email = user.email;
        this._user.emailVerified = user.emailVerified;
        this._user.photoURL = user.photoURL;
        this._user.isAnonymous = user.isAnonymous;
        this._user.uid = user.uid;
        this._user.providerData = user.providerData;
        // console.log(this._loggedIn);
        // console.log(JSON.stringify(user, null, 2));
        // console.log('get user claims');
        auth.currentUser
          .getIdTokenResult()
          // @ts-ignore
          .then(idTokenResult => {
            // @ts-ignore
            if (!idTokenResult.claims.email_verified) {
              auth.signOut();
              this._modalMsg =
                'Seu email ainda não foi confirmado. Verifique sua caixa postal.';
              this._toggleModal = true;
              return;
            }
            if (!idTokenResult.claims.isEnabled) {
              auth.signOut();
              this._modalMsg =
                'Sua conta está bloqueada neste aplicativo. Contacte o admininstrador.';
              this._toggleModal = true;
              return;
            }
            this._user.isEnabled = idTokenResult.claims.isEnabled;
            // Confirm if user is an Admin.
            // @ts-ignore
            if (typeof idTokenResult.claims.isAdmin !== 'undefined') {
              this._isAdmin = idTokenResult.claims.isAdmin;
            } else {
              this._isAdmin = false;
            }
            if (this._page === 'loginview') {
              window.location.href = '/procsview';
            }
            this._clearLoginFields();
            this._spinnerHidden = true;
            db.ref(`metadata/${user.uid}`).on('value', snap => {
              if (snap.exists()) {
                const { revokeTime } = snap.val();
                const utc = Date.parse(idTokenResult.authTime) / 1000;
                if (utc < revokeTime) {
                  this._modalMsg =
                    'Sua conta foi bloqueada neste aplicativo. Contacte o admininstrador.';
                  this._toggleModal = true;
                }
              }
            });
          })
          .catch(e => {
            // eslint-disable-next-line no-console
            console.log(e);
          });
      } else {
        // User is signed out.
        this._user = null;
        this._loggedIn = false;
      }
    });
  }

  // data store event handlers

  // Procedures
  _loadShowProcForm() {
    // dynamically load proc-form if neccessary
    if (typeof customElements.get('proc-form') === 'undefined') {
      import('./proc-form.js').then(() => {
        this._showProcedureForm = true;
      });
    } else {
      this._showProcedureForm = true;
    }
  }

  _updateProceduresListByDate(e) {
    // eslint-disable-next-line no-console
    // console.log(e.detail);
    this._updateProceduresList(e.detail);
  }

  _updateTodayProceduresList() {
    const today = new Date().toLocaleDateString('pt-BR'); // date string formated as 'DD/MM/YYYY'
    this._updateProceduresList(today);
  }

  _updateProceduresList(date) {
    if (!db) {
      // wait 2 seconds and retry
      window.setTimeout(() => {
        this.dispatchEvent(new CustomEvent('update-procedures-list'));
      }, 2000);
      return;
    }
    // clear procedures list
    this._procedures = [];
    this.dispatchEvent(new CustomEvent('show-spinner'));
    db.ref('procedures')
      .orderByChild('date')
      .equalTo(date)
      .once('value')
      .then(snapshot => {
        if (snapshot.exists()) {
          // eslint-disable-next-line prefer-const
          let procs = [];
          snapshot.forEach(child => {
            let proc = {};
            proc = child.val();
            proc.key = child.key;
            procs.push(proc);
          });
          this._procedures = [...procs];
          const d = date.split('/');
          this._currentProceduresDate = `${d[2]}-${d[1]}-${d[0]}`;
          // // eslint-disable-next-line no-console
          // console.log(this._currentProceduresDate);
          // // eslint-disable-next-line no-console
          // console.log(JSON.stringify(this._procedures, null, 2));
        }
        this._spinnerHidden = true;
      })
      .catch(() => {
        this._spinnerHidden = true;
      });
  }

  // eslint-disable-next-line class-methods-use-this
  _editProcedure(e) {
    // eslint-disable-next-line no-console
    // console.log(JSON.stringify(e.detail, null, 2));
    this._currentProcedure = { ...e.detail };
    // eslint-disable-next-line no-console
    // console.log(this._currentProcedure);
    this._loadShowProcForm();
  }

  _saveProcedure(e) {
    // console.log(JSON.stringify(e, null, 2));
    const proc = {
      ...e.detail,
      user: this._user.displayName,
      uid: this._user.uid,
    };
    let procRef;
    if (proc.key) {
      // get current procedure db reference
      procRef = db.ref(`/procedures/${proc.key}`);
      // update local procedures array
      this._procedures = this._procedures.map(p => {
        if (p.key === proc.key) {
          return { ...proc };
        }
        return p;
      });
    } else {
      // get a new procedure reference from DB
      const { key } = db.ref('/procedures').push();
      procRef = db.ref(`/procedures/${key}`);
      proc.key = key;
      // add procedure to local procedures array
      this._procedures = [proc, ...this._procedures];
    }
    proc.key = null;
    this._spinnerHidden = false;
    procRef
      .set(proc)
      .then(() => {
        this._spinnerHidden = true;
        this._modalMsg = 'Procedimento gravado com sucesso!';
        this._toggleModal = true;
      })
      // eslint-disable-next-line no-shadow
      .catch(e => {
        this._spinnerHidden = true;
        this._modalMsg = 'Erro ao gravar o procedimento.';
        this._toggleModal = true;
        // eslint-disable-next-line no-console
        console.log(e);
      });
  }

  // Users
  _loadShowUserForm() {
    // dynamically load user-form if neccessary
    if (typeof customElements.get('user-form') === 'undefined') {
      import('./user-form.js').then(() => {
        this._showUserForm = true;
      });
    } else {
      this._showUserForm = true;
    }
  }

  _updateUsersList() {
    if (this._isAdmin && this._user.isEnabled) {
      // clear users list
      this._users = [];
      // eslint-disable-next-line no-console
      console.log('updating users list ...');
      this.dispatchEvent(new CustomEvent('show-spinner'));
      db.ref('users')
        .orderByChild('displayName')
        .once('value')
        .then(snapshot => {
          if (snapshot.exists()) {
            // eslint-disable-next-line prefer-const
            let users = [];
            snapshot.forEach(child => {
              let u = {};
              u = child.val();
              u.key = child.key;
              users.push(u);
            });
            this._users = [...users];
          }
          this._spinnerHidden = true;
        })
        .catch(() => {
          this._spinnerHidden = true;
        });
    }
  }

  _editUser(e) {
    // eslint-disable-next-line no-console
    // console.log(JSON.stringify(e.detail, null, 2));
    this._currentEditUser = { ...e.detail };
    // eslint-disable-next-line no-console
    // console.log(this._currentEditUser);
    this._loadShowUserForm();
  }

  _saveUser(e) {
    if (this._isAdmin && this._user.isEnabled) {
      // console.log(JSON.stringify(e, null, 2));
      this.dispatchEvent(new CustomEvent('show-spinner'));
      const u = { ...e.detail, adminName: this._user.displayName };
      let userRef;
      if (u.key) {
        // get current procedure db reference
        userRef = db.ref(`/users/${u.key}`);
        // update local procedures array
        this._users = this._users.map(usr => {
          if (usr.key === u.key) {
            return { ...u };
          }
          return usr;
        });
        // console.log(JSON.stringify(this._users, null, 2));
      } else {
        // get a new user reference from DB
        const { key } = db.ref('/users').push();
        userRef = db.ref(`/users/${key}`);
        u.key = key;
        // add user to local users array
        this._users = [u, ...this._users];
        // this.requestUpdate();
      }
      u.key = null;
      userRef
        .set(u)
        .then(() => {
          this._spinnerHidden = true;
          this._modalMsg = 'Usuário gravado com sucesso!';
          this._toggleModal = true;
        })
        // eslint-disable-next-line no-shadow
        .catch(e => {
          this._spinnerHidden = true;
          this._modalMsg = 'Erro ao gravar/atualizar usuário.';
          this._toggleModal = true;
          // eslint-disable-next-line no-console
          console.log(e);
        });
    }
  }

  // Doctors
  _loadShowDoctorForm() {
    // dynamically load doctor-form if neccessary
    if (typeof customElements.get('doctor-form') === 'undefined') {
      import('./doctor-form.js').then(() => {
        this._showDoctorForm = true;
      });
    } else {
      this._showDoctorForm = true;
    }
  }

  _updateDoctorsList() {
    if (!db) {
      // wait 2 seconds and retry
      window.setTimeout(() => {
        this.dispatchEvent(new CustomEvent('update-doctors-list'));
      }, 2000);
      return;
    }
    // clear doctors list
    this._doctors = [];
    // eslint-disable-next-line no-console
    // console.log('updating doctors list ...');
    this.dispatchEvent(new CustomEvent('show-spinner'));
    db.ref('doctors')
      .orderByChild('name')
      .once('value')
      .then(snapshot => {
        if (snapshot.exists()) {
          // eslint-disable-next-line prefer-const
          let doctors = [];
          snapshot.forEach(child => {
            let d = {};
            d = child.val();
            d.key = child.key;
            doctors.push(d);
          });
          this._doctors = [...doctors];
        }
        // console.log(JSON.stringify(this._doctors, null, 2));
        this._spinnerHidden = true;
      })
      .catch(e => {
        // eslint-disable-next-line no-console
        console.log(e);
        this._spinnerHidden = true;
      });
  }

  _editDoctor(e) {
    // eslint-disable-next-line no-console
    // console.log(JSON.stringify(e.detail, null, 2));
    this._currentEditDoctor = { ...e.detail };
    // eslint-disable-next-line no-console
    // console.log(this._currentEditDoctor);
    this._loadShowDoctorForm();
  }

  _saveDoctor(e) {
    this.dispatchEvent(new CustomEvent('show-spinner'));
    const d = { ...e.detail, adminName: this._user.displayName };
    let doctorRef;
    if (d.key) {
      // get current procedure db reference
      doctorRef = db.ref(`/doctors/${d.key}`);
      // update local procedures array
      this._doctors = this._doctors.map(doc => {
        if (doc.key === d.key) {
          return { ...d };
        }
        return doc;
      });
    } else {
      // get a new doctor reference from DB
      const { key } = db.ref('/doctors').push();
      doctorRef = db.ref(`/doctors/${key}`);
      d.key = key;
      // add doctor to local doctors array
      this._doctors = [d, ...this._doctors];
    }
    d.key = null;
    doctorRef
      .set(d)
      .then(() => {
        this._spinnerHidden = true;
        this._modalMsg = 'Médico gravado com sucesso!';
        this._toggleModal = true;
      })
      // eslint-disable-next-line no-shadow
      .catch(e => {
        this._spinnerHidden = true;
        this._modalMsg = 'Erro ao gravar/atualizar médico.';
        this._toggleModal = true;
        // eslint-disable-next-line no-console
        console.log(e);
      });
  }

  // Procedures Types
  _loadShowProcTypeForm() {
    // dynamically load procedure-type-form if neccessary
    if (typeof customElements.get('proctype-form') === 'undefined') {
      import('./proctype-form.js').then(() => {
        this._showProcTypeForm = true;
      });
    } else {
      this._showProcTypeForm = true;
    }
  }

  _updateProcTypesList() {
    if (!db) {
      // wait 2 seconds and retry
      window.setTimeout(() => {
        this.dispatchEvent(new CustomEvent('update-procedures-types-list'));
      }, 2000);
      return;
    }
    // clear procedures types list
    this._proceduresTypes = [];
    // eslint-disable-next-line no-console
    // console.log('updating procedures types list ...');
    this.dispatchEvent(new CustomEvent('show-spinner'));
    db.ref('procedurestypes')
      .orderByChild('procedure')
      .once('value')
      .then(snapshot => {
        if (snapshot.exists()) {
          // eslint-disable-next-line prefer-const
          let procedures = [];
          snapshot.forEach(child => {
            let p = {};
            p = child.val();
            p.key = child.key;
            procedures.push(p);
          });
          this._proceduresTypes = [...procedures];
        }
        // console.log(JSON.stringify(this._doctors, null, 2));
        this._spinnerHidden = true;
      })
      .catch(e => {
        // eslint-disable-next-line no-console
        console.log(e);
        this._spinnerHidden = true;
      });
  }

  _editProcType(e) {
    // eslint-disable-next-line no-console
    // console.log(JSON.stringify(e.detail, null, 2));
    this._currentEditProcType = { ...e.detail };
    // eslint-disable-next-line no-console
    // console.log(this._currentEditProcType);
    this._loadShowProcTypeForm();
  }

  _saveProcType(e) {
    this.dispatchEvent(new CustomEvent('show-spinner'));
    const p = { ...e.detail, adminName: this._user.displayName };
    let procTypeRef;
    if (p.key) {
      // get current procedure db reference
      procTypeRef = db.ref(`/procedurestypes/${p.key}`);
      // update local procedures array
      this._proceduresTypes = this._proceduresTypes.map(proc => {
        if (proc.key === p.key) {
          return { ...p };
        }
        return proc;
      });
    } else {
      // get a new proctype reference from DB
      const { key } = db.ref('/procedurestypes').push();
      procTypeRef = db.ref(`/procedurestypes/${key}`);
      p.key = key;
      // add procType to local proceduresTypes array
      this._proceduresTypes = [p, ...this._proceduresTypes];
    }
    p.key = null;
    procTypeRef
      .set(p)
      .then(() => {
        this._spinnerHidden = true;
        this._modalMsg = 'Tipo de procedimento com sucesso!';
        this._toggleModal = true;
      })
      // eslint-disable-next-line no-shadow
      .catch(e => {
        this._spinnerHidden = true;
        this._modalMsg = 'Erro ao gravar/atualizar tipo de procedimento.';
        this._toggleModal = true;
        // eslint-disable-next-line no-console
        console.log(e);
      });
  }

  // clear login input fields
  // eslint-disable-next-line class-methods-use-this
  _clearLoginFields() {
    // clear input fields
    // @ts-ignore
    document.getElementById('email').value = '';
    // @ts-ignore
    document.getElementById('password').value = '';
  }

  _locationChanged(location) {
    const path = window.decodeURIComponent(location.pathname);
    const page = path === '/' ? 'home' : path.slice(1);
    this._loadPage(page);
  }

  /**
   *
   *
   * @param {string} page
   * @memberof NefroMain
   */
  _loadPage(page) {
    switch (page) {
      case 'procsview':
        if (typeof customElements.get('procs-view') === 'undefined') {
          import('./procs-view.js').catch(e => {
            // eslint-disable-next-line no-console
            console.log(e);
          });
        } else {
          this.dispatchEvent(new CustomEvent('update-procedures-list'));
        }
        break;
      case 'usersview':
        if (typeof customElements.get('users-view') === 'undefined') {
          import('./users-view.js').catch(e => {
            // eslint-disable-next-line no-console
            console.log(e);
          });
        } else {
          this.dispatchEvent(new CustomEvent('update-users-list'));
        }
        break;
      case 'doctorsview':
        if (typeof customElements.get('doctors-view') === 'undefined') {
          import('./doctors-view.js').catch(e => {
            // eslint-disable-next-line no-console
            console.log(e);
          });
        } else {
          this.dispatchEvent(new CustomEvent('update-doctors-list'));
        }
        break;
      case 'procedurestypesview':
        if (typeof customElements.get('proctypes-view') === 'undefined') {
          import('./proctypes-view.js').catch(e => {
            // eslint-disable-next-line no-console
            console.log(e);
          });
        } else {
          this.dispatchEvent(new CustomEvent('update-procedures-types-list'));
        }
        break;
      default:
      // eslint-disable-next-line no-param-reassign
      // page = 'view404';
    }
    this._page = page;
  }

  _navBarBurgerClicked() {
    this._burgerActive = !this._burgerActive;
  }

  // eslint-disable-next-line class-methods-use-this
  _handleSignIn() {
    if (auth.currentUser) {
      auth.signOut();
    } else {
      // @ts-ignore
      const email = document.getElementById('email').value;
      // @ts-ignore
      const password = document.getElementById('password').value;
      if (email.length < 4) {
        this._modalMsg = 'Por favor, forneça um endereço de email.';
        this._toggleModal = true;
        return;
      }
      if (password.length < 4) {
        this._modalMsg = 'Por favor, insira uma senha.';
        this._toggleModal = true;
        return;
      }
      // Sign in with email and pass.
      auth.signInWithEmailAndPassword(email, password).catch(error => {
        // Handle Errors here.
        const errorCode = error.code;
        const errorMessage = error.message;
        switch (errorCode) {
          case 'auth/wrong-password':
            this._modalMsg = 'Senha ou login incorretos.';
            this._toggleModal = true;
            break;
          case 'auth/user-not-found':
            this._modalMsg = 'Senha ou login incorretos.';
            this._toggleModal = true;
            break;
          case 'auth/user-disabled':
            this._modalMsg =
              'Essa conta está bloqueada. Contacte o administrador.';
            this._toggleModal = true;
            break;
          default:
            this._modalMsg =
              'Houve algum problema com o login. Contacte o administrador.';
            this._toggleModal = true;
            // eslint-disable-next-line no-console
            console.log(errorMessage);
            break;
        }
      });
    }
  }

  // eslint-disable-next-line class-methods-use-this
  _logoutClicked() {
    this._burgerActive = false;
    db.ref(`metadata/${this._user.uid}`).off('value');
    auth.signOut();
  }

  /**
   * @param {{ preventDefault: () => void; }} e
   */
  _resetPassword(e) {
    e.preventDefault();
    // @ts-ignore
    if (document.getElementById('resetpw-form').reportValidity()) {
      this._spinnerHidden = false;
      // @ts-ignore
      const email = document.getElementById('pwreset-email').value;
      auth.languageCode = 'pt-BR';
      auth
        .sendPasswordResetEmail(email)
        .then(() => {
          // Email sent.
          this._toggleResetPwModal = false;
          this._spinnerHidden = false;
          this._modalMsg = `Um email com instruções para configuração da senha foi enviado para ${email}. Verifique sua caixa postal.`;
          this._toggleModal = true;
        })
        .catch(error => {
          if (error.code === 'auth/user-not-found') {
            this._modalMsg = `Um email com instruções para configuração da senha foi enviado para ${email}. Verifique sua caixa postal.`;
            this._toggleModal = true;
          } else {
            // eslint-disable-next-line no-console
            console.log(error);
          }
        });
    }
  }

  render() {
    return html`
      <nav
        id="navbar"
        class="navbar is-primary is-fixed-top"
        role="navigation"
        aria-label="main navigation"
      >
        <div class="navbar-brand">
          <a
            class="navbar-item has-text-black"
            href="#"
            style="font-weight:bold;"
          >
            OurTeam.Work
          </a>

          <a
            role="button"
            class="navbar-burger burger ${classMap({
              'is-active': this._burgerActive,
            })}"
            id="navbarburger"
            aria-label="menu"
            aria-expanded="false"
            data-target="navbarBasicMenu"
            @click="${this._navBarBurgerClicked}"
            @keydown="${this._navBarBurgerClicked}"
          >
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
          </a>
        </div>

        <div
          id="navbarBasicMenu"
          class="navbar-menu ${classMap({ 'is-active': this._burgerActive })}"
        >
          <div
            class="navbar-start ${classMap({ 'is-hidden': !this._loggedIn })}"
          >
            <a
              class="navbar-item"
              href="/procsview"
              @click="${() => {
                this._burgerActive = false;
              }}"
            >
              Procedimentos
            </a>

            <div
              id="adminmenu"
              class="navbar-item has-dropdown ${classMap({
                'is-hidden': !this._isAdmin,
                'is-active': this._adminDropDownOpen,
              })}"
            >
              <a
                class="navbar-link"
                @click="${() => {
                  this._adminDropDownOpen = !this._adminDropDownOpen;
                }}"
                @keydown="${() => {
                  this._adminDropDownOpen = !this._adminDropDownOpen;
                }}"
              >
                Admin
              </a>

              <div class="navbar-dropdown is-boxed">
                <a
                  class="navbar-item"
                  href="/usersview"
                  @click="${() => {
                    this._adminDropDownOpen = false;
                    this._burgerActive = false;
                  }}"
                >
                  Usuários
                </a>
                <a
                  class="navbar-item"
                  href="/doctorsview"
                  @click="${() => {
                    this._adminDropDownOpen = false;
                    this._burgerActive = false;
                  }}"
                >
                  Médicos
                </a>
                <a
                  class="navbar-item"
                  href="/procedurestypesview"
                  @click="${() => {
                    this._adminDropDownOpen = false;
                    this._burgerActive = false;
                  }}"
                >
                  Tipos de Procedimentos
                </a>
              </div>
            </div>
          </div>

          <div class="navbar-end">
            <div class="navbar-item">
              <div class="buttons">
                <a
                  id="logoutbtn"
                  href="/home"
                  class="button is-light ${classMap({
                    'is-hidden': !this._loggedIn,
                  })}"
                  @click="${this._logoutClicked}"
                >
                  Logout
                </a>
                <a
                  id="loginbtn"
                  href="/loginview"
                  class="button is-light ${classMap({
                    'is-hidden': this._loggedIn,
                  })}"
                  @click=${() => {
                    this._burgerActive = false;
                  }}
                >
                  Login
                </a>
              </div>
            </div>
          </div>
        </div>
      </nav>
      <main id="maincontent">
        <section
          id="home"
          class="section container has-text-centered ${classMap({
            'is-hidden': this._page !== 'home',
          })}"
        >
          <div>
            <br />
            <br />
            <br />
            <br />
            <h1 class="title">Cirurgia Vascular: Procedimentos Realizados</h1>
          </div>
        </section>

        <section
          id="loginview"
          class="section ${classMap({
            'is-hidden': this._page !== 'loginview',
          })}"
        >
          ${templateLogin}
        </section>

        <procs-view
          id="procsview"
          class="${classMap({
            'is-hidden': this._page !== 'procsview',
          })}"
          .procedures="${this._procedures}"
          .date="${this._currentProceduresDate}"
        ></procs-view>
        <users-view
          id="usersview"
          .users="${this._users}"
          class="${classMap({
            'is-hidden': this._page !== 'usersview',
          })}"
        ></users-view>
        <doctors-view
          id="doctorsview"
          .doctors="${this._doctors}"
          class="${classMap({
            'is-hidden': this._page !== 'doctorsview',
          })}"
        >
        </doctors-view>
        <proctypes-view
          id="procedurestypesview"
          .procedures="${this._proceduresTypes}"
          class="${classMap({
            'is-hidden': this._page !== 'procedurestypesview',
          })}"
        ></proctypes-view>
      </main>
      <footer
        class="navbar is-fixed-bottom
    is-dark has-text-centered is-vcentered"
      >
        <div class="column">&copy; <small>CG 2021</small></div>
      </footer>
      <div
        id="modalmsg"
        class="modal ${classMap({ 'is-active': this._toggleModal })}"
      >
        <div
          class="modal-background"
          @click="${() => {
            this._toggleModal = false;
          }}"
          @keydown="${() => {
            this._toggleModal = false;
          }}"
        ></div>
        <div class="modal-content">
          <div class="box container has-text-centered">${this._modalMsg}</div>
        </div>
        <button
          class="modal-close is-large"
          @click="${() => {
            this._toggleModal = false;
          }}"
          @keydown="${() => {
            this._toggleModal = false;
          }}"
          aria-label="close"
        ></button>
      </div>

      <div
        id="resetpwmodal"
        class="modal ${classMap({ 'is-active': this._toggleResetPwModal })}"
      >
        <div
          class="modal-background"
          @click="${() => {
            this._toggleResetPwModal = false;
          }}"
          @keydown="${() => {
            this._toggleResetPwModal = false;
          }}"
        ></div>
        <div class="modal-content">
          <div class="box container has-text-centered">
            <form id="resetpw-form">
              <div class="field">
                <label class="label has-text-left" for="email">Email:</label>
                <p class="control has-icons-left has-icons-right">
                  <input
                    class="input"
                    id="pwreset-email"
                    type="email"
                    placeholder="nome@example.com"
                  />
                  <span class="icon is-small is-left">
                    <svg
                      id="i-mail"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 32 32"
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentcolor"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                    >
                      <path d="M2 26 L30 26 30 6 2 6 Z M2 6 L16 16 30 6" />
                    </svg>
                  </span>
                  <span class="icon is-small is-right">
                    <svg
                      id="i-checkmark"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 32 32"
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentcolor"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                    >
                      <path d="M2 20 L12 28 30 4" />
                    </svg>
                  </span>
                </p>
              </div>
              <div class="field">
                <p class="control">
                  <button
                    id="pwreset-ok"
                    class="button is-success has-text-black"
                    @click="${this._resetPassword}"
                  >
                    OK
                  </button>
                </p>
              </div>
            </form>
          </div>
        </div>
        <button
          class="modal-close is-large"
          @click="${() => {
            this._toggleResetPwModal = false;
          }}"
          aria-label="close"
        ></button>
      </div>

      <proc-form
        class="${classMap({ 'is-hidden': !this._showProcedureForm })}"
        ?activate="${this._showProcedureForm}"
        .procedure="${this._currentProcedure}"
        .doctors="${this._doctors}"
        .proctypes="${this._proceduresTypes}"
      ></proc-form>
      <user-form
        class="${classMap({ 'is-hidden': !this._showUserForm })}"
        ?activate="${this._showUserForm}"
        .user="${this._currentEditUser}"
      ></user-form>
      <doctor-form
        class="${classMap({ 'is-hidden': !this._showDoctorForm })}"
        ?activate="${this._showDoctorForm}"
        .doctor="${this._currentEditDoctor}"
      ></doctor-form>
      <proctype-form
        class="${classMap({ 'is-hidden': !this._showProcTypeForm })}"
        ?activate="${this._showProcTypeForm}"
        .proceduretype="${this._currentEditProcType}"
      ></proctype-form>
      <otw-spinner
        class="${classMap({ 'is-hidden': this._spinnerHidden })}"
      ></otw-spinner>
    `;
  }
}
