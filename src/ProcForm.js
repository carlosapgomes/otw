import { html, LitElement } from 'lit-element';
import { classMap } from 'lit-html/directives/class-map.js';

export class ProcForm extends LitElement {
  // use lightDOM
  createRenderRoot() {
    return this;
  }

  static get properties() {
    return {
      procedure: { type: Object },
      _dateISO: { type: String },
      activate: { type: Boolean },
      _procedureName: { type: String },
      _date: { type: String },
      _procedureCode: { type: String },
      _patientName: { type: String },
      _doctorName: { type: String },
      _weekDay: { type: Number },
      doctors: { type: Array },
      _doctorsOptions: { type: Array },
      proctypes: { type: Array },
      _procTypesOptions: { type: Array },
    };
  }

  constructor() {
    super();
    this.procedure = {};
    this._procedureName = '';
    this._procedureCode = '';
    this._patientName = '';
    this._date = '';
    this._doctorName = '';
    this._dateISO = '';
    this.activate = false;
    this._weekDay = -1; // 0=sunday, 1=monday ... 6=saturday
    this.doctors = [];
    this._doctorsOptions = [];
    this.proctypes = [];
    this._procTypesOptions = [];
  }

  firstUpdated() {
    const [d] = new Date().toISOString().split('T');
    this._dateISO = d;
    if (this.doctors) {
      this._updateDoctorsList();
    }
    if (this.proctypes) {
      this._updateProcTypesList();
    }
  }

  /**
   * @param {{ has: (arg0: string) => any; }} changedProperties
   */
  updated(changedProperties) {
    if (changedProperties.has('procedure')) {
      if (this.procedure && this.procedure.date) {
        const d = this.procedure.date.split('/');
        this._dateISO = `${d[2]}-${d[1]}-${d[0]}`;
        this._procedureName = this.procedure.procedure;
        this._date = this.procedure.date;
        this._weekDay = this.procedure.weekDay ? this.procedure.weekDay : '';
        this._procedureCode = this.procedure.procCode;
        this._patientName = this.procedure.patientName;
        this._doctorName = this.procedure.doctorName;
        if (this.doctors && this._doctorName) {
          console.log(`updating doctor name to: ${this._doctorName}`);
          // @ts-ignore
          document.getElementById('docOptionsDefault').selected = false;
          for (let i = 0; i < this.doctors.length; i += 1) {
            if (this.doctors[i].name === this._doctorName) {
              // @ts-ignore
              document.getElementById(`docOption${i}`).selected = true;
              break;
            }
          }
        }
      }
      if (this.proctypes && this._procedureName) {
        console.log(`updating proc type to: ${this._procedureName}`);
        // @ts-ignore
        document.getElementById('procOptionsDefault').selected = false;
        for (let i = 0; i < this.proctypes.length; i += 1) {
          if (this.proctypes[i].procedure === this._procedureName) {
            // @ts-ignore
            document.getElementById(`procOption${i}`).selected = true;
            break;
          }
        }
      }
    }
    if (changedProperties.has('doctors')) {
      this._updateDoctorsList();
    }
    if (changedProperties.has('proctypes')) {
      this._updateProcTypesList();
    }
  }

  _updateDoctorsList() {
    this._doctorsOptions = [];
    this._doctorsOptions.push(
      html`
        <option id="docOptionsDefault" value="" selected disabled hidden>
          Escolha
        </option>
      `
    );
    this.doctors.forEach((value, index) => {
      const docOpId = `docOption${index}`;
      this._doctorsOptions.push(html`
        <option id="${docOpId}" value="${value.name}">${value.name}</option>
      `);
    });
  }

  _updateProcTypesList() {
    this._procTypesOptions = [];
    this._procTypesOptions.push(
      html`
        <option id="procOptionsDefault" value="" selected disabled hidden>
          Escolha
        </option>
      `
    );
    this.proctypes.forEach((value, index) => {
      const procOpId = `procOption${index}`;
      this._procTypesOptions.push(html`
        <option id="${procOpId}" value="${index}">${value.procedure}</option>
      `);
    });
  }

  _closeForm() {
    // clear form
    this._clearFields();
    // fire event to hide procedure form from parent's view
    this.dispatchEvent(
      new CustomEvent('close-procedure-form', { bubbles: true, composed: true })
    );
  }

  _clearFields() {
    this.procedure = {};
    // @ts-ignore
    document.getElementById('procedure-form').reset();
    this._procedureName = '';
    this._procedureCode = '';
    this._patientName = '';
    const [d] = new Date().toISOString().split('T');
    this._dateISO = d;
    // @ts-ignore
    this._date = '';
    this._doctorName = '';
    this._dateISO = '';
    this._weekDay = -1; // 0=sunday, 1=monday ... 6=saturday
  }

  _saveForm(e) {
    e.preventDefault();
    // @ts-ignore
    if (document.getElementById('procedure-form').reportValidity()) {
      this._handleSaveForm();
    }
  }

  _handleSaveForm() {
    // @ts-ignore
    const proc = this.proctypes[
      document.getElementById('proc-type-select').value
    ];
    this._procedureName = proc.procedure;
    this._procedureCode = proc.code;
    // @ts-ignore
    this._patientName = document.getElementById('patient-name').value;
    // @ts-ignore
    this._doctorName = document.getElementById('proc-doctor-name').value;
    // @ts-ignore
    const d = document.getElementById('date').value.split('-');
    const dt = new Date(`${d} GMT-03:00`);
    this._date = `${d[2]}/${d[1]}/${d[0]}`;
    this._weekDay = dt.getDay();
    const p = {
      procedure: this._procedureName,
      procCode: this._procedureCode,
      patientName: this._patientName,
      doctorName: this._doctorName,
      date: this._date,
      weekDay: this._weekDay,
    };
    if (this.procedure && this.procedure.key) {
      p.key = this.procedure.key;
    }
    // fire event to save/update procedure
    this.dispatchEvent(
      new CustomEvent('save-procedure-form', {
        detail: p,
        bubbles: true,
        composed: true,
      })
    );
    // clear and close form
    this._closeForm();
  }

  render() {
    return html`
      <div class="modal ${classMap({ 'is-active': this.activate })}">
        <div class="modal-background"></div>
        <div class="modal-card">
          <header class="modal-card-head">
            <p class="modal-card-title">Procedimento</p>
            <button
              class="delete"
              aria-label="close"
              @click="${this._closeForm}"
            ></button>
          </header>
          <section class="modal-card-body">
            <form id="procedure-form">
              <div class="field">
                <label class="label">Data</label>
                <input
                  class="input"
                  id="date"
                  type="date"
                  .value="${this._dateISO}"
                />
              </div>
              <div class="field">
                <label class="label">Procedimento</label>
                <div class="control is-expanded">
                  <div class="select is-fullwidth">
                    <select id="proc-type-select" required>
                      ${this._procTypesOptions}
                    </select>
                  </div>
                </div>
              </div>
              <div class="field">
                <label class="label">Paciente</label>
                <input
                  class="input"
                  id="patient-name"
                  type="text"
                  placeholder="Paciente"
                  .value="${this._patientName}"
                  required
                />
              </div>
              <div class="field">
                <label class="label">Médico</label>
                <div class="control is-expanded">
                  <div class="select is-fullwidth">
                    <select id="proc-doctor-name" required>
                      ${this._doctorsOptions}
                    </select>
                  </div>
                </div>
              </div>
            </form>
          </section>
          <footer class="modal-card-foot">
            <button class="button is-success" @click="${this._saveForm}">
              Gravar
            </button>
            <button class="button" @click="${this._closeForm}">Cancelar</button>
          </footer>
        </div>
      </div>
    `;
  }
}
