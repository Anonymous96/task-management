import {
  ChangeDetectionStrategy,
  Component,
  signal,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { logout, getCurrentUser } from '@loginsvi/infrastructure';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar implements OnInit {
  currentUser = signal<{ username: string; loginTime: string } | null>(null);

  constructor(private router: Router) {}

  ngOnInit() {
    this.currentUser.set(getCurrentUser());
  }

  onLogout() {
    if (confirm('Are you sure you want to logout?')) {
      logout();
      this.router.navigate(['/auth/login']);
    }
  }
}
