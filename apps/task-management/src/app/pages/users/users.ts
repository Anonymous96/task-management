import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  OnDestroy,
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

  users: User[] = [];
  tasks: Task[] = [];
  isCreating = false;
  editingUserId: number | null = null;
  isLoading = false;

  newUser: { name: string } = {
    name: '',
  };

  editingUser: User | null = null;

  constructor(
    private userService: UserService,
    private taskService: TaskService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadData() {
    this.isLoading = true;

    // Load both users and tasks for assignment management
    combineLatest([
      this.userService.getAllUsers(),
      this.taskService.getAllTasks(),
    ])
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: ([users, tasks]) => {
          this.users = users;
          this.tasks = tasks;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error loading data:', error);
          this.cdr.markForCheck();
        },
      });
  }

  startCreating() {
    this.isCreating = true;
    this.editingUserId = null;
    this.newUser = {
      name: '',
    };
    this.cdr.markForCheck();
  }

  cancelCreating() {
    this.isCreating = false;
    this.newUser = {
      name: '',
    };
    this.cdr.markForCheck();
  }

  createUser() {
    if (this.userService.validateUser(this.newUser.name)) {
      this.isLoading = true;
      const request: CreateUserRequest = {
        name: this.newUser.name,
      };

      this.userService
        .createUser(request)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            this.isLoading = false;
            this.cdr.markForCheck();
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
    this.editingUserId = user.id;
    this.isCreating = false;
    this.editingUser = { ...user };
    this.cdr.markForCheck();
  }

  cancelEditing() {
    this.editingUserId = null;
    this.editingUser = null;
    this.cdr.markForCheck();
  }

  updateUser() {
    if (
      this.editingUser &&
      this.userService.validateUser(this.editingUser.name)
    ) {
      this.isLoading = true;
      const request: UpdateUserRequest = {
        id: this.editingUser.id,
        name: this.editingUser.name,
      };

      this.userService
        .updateUser(request)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            this.isLoading = false;
            this.cdr.markForCheck();
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
    const user = this.users.find((u) => u.id === userId);

    if (user?.assignedTaskId) {
      alert(
        'Cannot delete user with assigned task. Please unassign the task first.'
      );
      return;
    }

    if (confirm('Are you sure you want to delete this user?')) {
      this.isLoading = true;
      this.userService
        .deleteUser(userId)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            this.isLoading = false;
            this.cdr.markForCheck();
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
    return this.tasks.find((task) => task.id === user.assignedTaskId);
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

  getCurrentDate(): Date {
    return new Date();
  }

  formatDate(date: Date): string {
    return this.userService.formatDate(date);
  }
}
