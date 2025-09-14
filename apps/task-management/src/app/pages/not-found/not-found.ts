import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Location } from '@angular/common';
import { NbButtonModule, NbCardModule, NbLayoutModule } from '@nebular/theme';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [NbLayoutModule, NbCardModule, NbButtonModule, RouterModule],
  templateUrl: './not-found.html',
  styleUrl: './not-found.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFound {
  private readonly location = inject(Location);

  goBack(): void {
    this.location.back();
  }
}
