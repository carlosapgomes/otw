import { html } from 'lit-html';
import '../src/otw-app.js';

export default {
  title: 'OtwApp',
  component: 'otw-app',
  argTypes: {
    backgroundColor: { control: 'color' },
  },
};

function Template({ title, backgroundColor }) {
  return html`
    <otw-app
      style="--otw-app-background-color: ${backgroundColor || 'white'}"
      .title=${title}
    >
    </otw-app>
  `;
}

export const App = Template.bind({});
App.args = {
  title: 'My app',
};
