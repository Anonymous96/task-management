import { Component } from '@angular/core';
import { NbButtonModule, NbCardModule, NbIconModule } from '@nebular/theme';

@Component({
  selector: 'app-test-nebular',
  standalone: true,
  imports: [NbButtonModule, NbCardModule, NbIconModule],
  template: `
    <nb-card>
      <nb-card-header>
        <h5>Nebular Test Component</h5>
      </nb-card-header>
      <nb-card-body>
        <p>If you can see this styled card, Nebular is working correctly!</p>
        <button nbButton status="primary">
          <nb-icon icon="checkmark-outline"></nb-icon>
          Primary Button
        </button>
        <button nbButton status="success" style="margin-left: 10px;">
          <nb-icon icon="heart-outline"></nb-icon>
          Success Button
        </button>
      </nb-card-body>
    </nb-card>
  `,
  styles: [
    `
      :host {
        display: block;
        margin: 20px;
      }
    `,
  ],
})
export class TestNebularComponent {}
