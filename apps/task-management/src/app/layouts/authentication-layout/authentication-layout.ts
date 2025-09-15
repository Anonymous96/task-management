import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-authentication-layout',
  imports: [RouterOutlet],
  templateUrl: './authentication-layout.html',
  styleUrl: './authentication-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthenticationLayout {}
