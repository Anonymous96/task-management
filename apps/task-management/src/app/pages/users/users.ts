import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, finalize, combineLatest } from 'rxjs';
import {
  User,
  UserService,
  CreateUserRequest,
  UpdateUserRequest,
} from '@loginsvi/user';
import { Task, TaskService, TaskWithUser } from '@loginsvi/task';

@Component({
  selector: 'app-users',
  imports: [CommonModule, FormsModule],
  templateUrl: './users.html',
  styleUrl: './users.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Users implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Signal-based state
  users = signal<User[]>([]);
  tasks = signal<Task[]>([]);
  isCreating = signal(false);
  editingUserId = signal<number | null>(null);
  isLoading = signal(false);

  // Form state signals
  newUser = signal<{ name: string }>({
    name: '',
  });

  editingUser = signal<User | null>(null);

  // Computed signals
  hasUsers = computed(() => this.users().length > 0);
  hasTasks = computed(() => this.tasks().length > 0);

  usersWithTasks = computed(() =>
    this.users().filter((user) => user.assignedTaskId)
  );

  usersWithoutTasks = computed(() =>
    this.users().filter((user) => !user.assignedTaskId)
  );

  constructor(
    private userService: UserService,
    private taskService: TaskService
  ) {
    // Effect to log state changes (for debugging)
    effect(() => {
      console.log('Users count:', this.users().length);
      console.log('Tasks count:', this.tasks().length);
    });
  }

  ngOnInit() {
    this.loadData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getCurrentDate(): Date {
    return new Date();
  }

  private loadData() {
    this.isLoading.set(true);

    // Load both users and tasks for assignment management
    combineLatest([
      this.userService.getAllUsers(),
      this.taskService.getAllTasks(),
    ])
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading.set(false);
        })
      )
      .subscribe({
        next: ([users, tasks]) => {
          this.users.set(users);
          this.tasks.set(tasks);
        },
        error: (error) => {
          console.error('Error loading data:', error);
        },
      });
  }

  startCreating() {
    this.isCreating.set(true);
    this.editingUserId.set(null);
    this.newUser.set({
      name: '',
    });
  }

  cancelCreating() {
    this.isCreating.set(false);
    this.newUser.set({
      name: '',
    });
  }

  createUser() {
    const userData = this.newUser();
    if (this.userService.validateUser(userData.name)) {
      this.isLoading.set(true);
      const request: CreateUserRequest = {
        name: userData.name,
      };

      this.userService
        .createUser(request)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            this.isLoading.set(false);
          })
        )
        .subscribe({
          next: (createdUser) => {
            console.log('User created successfully:', createdUser);
            this.cancelCreating();
          },
          error: (error) => {
            console.error('Error creating user:', error);
            alert('Error creating user. Please try again.');
          },
        });
    }
  }

  startEditing(user: User) {
    this.editingUserId.set(user.id);
    this.isCreating.set(false);
    this.editingUser.set({ ...user });
  }

  cancelEditing() {
    this.editingUserId.set(null);
    this.editingUser.set(null);
  }

  updateUser() {
    const user = this.editingUser();
    if (user && this.userService.validateUser(user.name)) {
      this.isLoading.set(true);
      const request: UpdateUserRequest = {
        id: user.id,
        name: user.name,
      };

      this.userService
        .updateUser(request)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            this.isLoading.set(false);
          })
        )
        .subscribe({
          next: (updatedUser) => {
            if (updatedUser) {
              console.log('User updated successfully:', updatedUser);
              this.cancelEditing();
            } else {
              alert('User not found.');
            }
          },
          error: (error) => {
            console.error('Error updating user:', error);
            alert('Error updating user. Please try again.');
          },
        });
    }
  }

  deleteUser(userId: number) {
    const user = this.users().find((u) => u.id === userId);

    if (user?.assignedTaskId) {
      alert(
        'Cannot delete user with assigned task. Please unassign the task first.'
      );
      return;
    }

    if (confirm('Are you sure you want to delete this user?')) {
      this.isLoading.set(true);
      this.userService
        .deleteUser(userId)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            this.isLoading.set(false);
          })
        )
        .subscribe({
          next: (success) => {
            if (success) {
              console.log('User deleted successfully');
            } else {
              alert('User not found or has assigned task.');
            }
          },
          error: (error) => {
            console.error('Error deleting user:', error);
            alert('Error deleting user. Please try again.');
          },
        });
    }
  }

  // Task assignment methods
  getAssignedTask(user: User): Task | undefined {
    if (!user.assignedTaskId) return undefined;
    return this.tasks().find((task) => task.id === user.assignedTaskId);
  }

  getTaskName(user: User): string {
    const task = this.getAssignedTask(user);
    return task ? task.name : 'No task assigned';
  }

  getTaskState(user: User): string {
    const task = this.getAssignedTask(user);
    return task ? task.state : '';
  }

  getTaskStateClass(user: User): string {
    const task = this.getAssignedTask(user);
    if (!task) return '';
    return this.taskService.getStateClass(task.state);
  }

  formatDate(date: Date): string {
    return this.userService.formatDate(date);
  }

  // Signal update methods for template two-way binding
  updateNewUserName(event: Event) {
    const name = (event.target as HTMLInputElement).value;
    this.newUser.update((user) => ({ ...user, name }));
  }

  updateEditingUserName(event: Event) {
    const name = (event.target as HTMLInputElement).value;
    this.editingUser.update((user) => (user ? { ...user, name } : null));
  }
}
