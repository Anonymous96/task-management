import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { login } from '@loginsvi/infrastructure';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  standalone: true,
})
export class Login {
  // Form signals
  username = signal('');
  password = signal('');
  errorMessage = signal('');
  isLoading = signal(false);

  constructor(private router: Router) {}

  updateUsername(event: Event) {
    const username = (event.target as HTMLInputElement).value;
    this.username.set(username);
  }

  updatePassword(event: Event) {
    const password = (event.target as HTMLInputElement).value;
    this.password.set(password);
  }

  onSubmit() {
    if (!this.username().trim() || !this.password().trim()) {
      this.errorMessage.set('Please enter both username and password');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    // Simulate a small delay
    setTimeout(() => {
      const success = login(this.username(), this.password());

      if (success) {
        console.log('Login successful');
        this.router.navigate(['/']);
      } else {
        this.errorMessage.set('Invalid credentials. Try: admin/admin');
      }

      this.isLoading.set(false);
    }, 500);
  }

  // Helper for demo
  fillDemoCredentials() {
    this.username.set('admin');
    this.password.set('admin');
  }
}
