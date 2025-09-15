import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../../shared/sidebar/sidebar';
import {
  NbLayoutModule,
  NbSidebarService,
  NbActionsModule,
  NbSidebarModule,
} from '@nebular/theme';

@Component({
  selector: 'app-base-layout',
  imports: [
    RouterOutlet,
    Sidebar,
    NbLayoutModule,
    NbActionsModule,
    NbSidebarModule,
  ],
  templateUrl: './base-layout.html',
  styleUrl: './base-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseLayout {
  constructor(private sidebarService: NbSidebarService) {
    console.log(this.sidebarService);
  }

  toggle(event: Event) {
    event.stopPropagation();
    this.sidebarService.toggle();
  }
}
