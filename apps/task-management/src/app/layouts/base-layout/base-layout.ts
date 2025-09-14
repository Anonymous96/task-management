import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from '../../shared/header/header';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';

@Component({
  selector: 'app-base-layout',
  imports: [RouterOutlet, Header, Sidebar, Footer],
  templateUrl: './base-layout.html',
  styleUrl: './base-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseLayout {}
