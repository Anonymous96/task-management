import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, finalize, combineLatest } from 'rxjs';
import {
  Task,
  TaskState,
  TaskService,
  CreateTaskRequest,
  UpdateTaskRequest,
} from '@loginsvi/task';
import { User, UserService } from '@loginsvi/user';

@Component({
  selector: 'app-tasks',
  imports: [CommonModule, FormsModule],
  templateUrl: './tasks.html',
  styleUrl: './tasks.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Tasks implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  tasks: Task[] = [];
  users: User[] = [];
  isCreating = false;
  editingTaskId: number | null = null;
  isLoading = false;
  assigningTaskId: number | null = null;

  newTask: {
    name: string;
    description: string;
    state: TaskState;
    assignedUserId?: number;
  } = {
    name: '',
    description: '',
    state: 'in queue',
  };

  editingTask: Task | null = null;

  constructor(
    private taskService: TaskService,
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) {}

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
    this.isLoading = true;

    // Load both tasks and users for assignment management
    combineLatest([
      this.taskService.getAllTasks(),
      this.userService.getAllUsers(),
    ])
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: ([tasks, users]) => {
          this.tasks = tasks;
          this.users = users;
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
    this.editingTaskId = null;
    this.assigningTaskId = null;
    this.newTask = {
      name: '',
      description: '',
      state: 'in queue',
    };
    this.cdr.markForCheck();
  }

  cancelCreating() {
    this.isCreating = false;
    this.newTask = {
      name: '',
      description: '',
      state: 'in queue',
    };
    this.cdr.markForCheck();
  }

  createTask() {
    if (
      this.taskService.validateTask(this.newTask.name, this.newTask.description)
    ) {
      this.isLoading = true;
      const request: CreateTaskRequest = {
        name: this.newTask.name,
        description: this.newTask.description,
        state: this.newTask.state,
        assignedUserId: this.newTask.assignedUserId,
      };

      this.taskService
        .createTask(request)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            this.isLoading = false;
            this.cdr.markForCheck();
          })
        )
        .subscribe({
          next: (createdTask) => {
            console.log('Task created successfully:', createdTask);
            // If user was assigned, update user service
            if (this.newTask.assignedUserId) {
              this.userService
                .assignTaskToUser(this.newTask.assignedUserId, createdTask.id)
                .pipe(takeUntil(this.destroy$))
                .subscribe();
            }
            this.cancelCreating();
          },
          error: (error) => {
            console.error('Error creating task:', error);
            alert('Error creating task. Please try again.');
          },
        });
    }
  }

  startEditing(task: Task) {
    this.editingTaskId = task.id;
    this.isCreating = false;
    this.assigningTaskId = null;
    this.editingTask = { ...task };
    this.cdr.markForCheck();
  }

  cancelEditing() {
    this.editingTaskId = null;
    this.editingTask = null;
    this.cdr.markForCheck();
  }

  updateTask() {
    if (
      this.editingTask &&
      this.taskService.validateTask(
        this.editingTask.name,
        this.editingTask.description
      )
    ) {
      this.isLoading = true;
      const request: UpdateTaskRequest = {
        id: this.editingTask.id,
        name: this.editingTask.name,
        description: this.editingTask.description,
        state: this.editingTask.state,
        assignedUserId: this.editingTask.assignedUserId,
      };

      this.taskService
        .updateTask(request)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            this.isLoading = false;
            this.cdr.markForCheck();
          })
        )
        .subscribe({
          next: (updatedTask) => {
            if (updatedTask) {
              console.log('Task updated successfully:', updatedTask);
              this.cancelEditing();
            } else {
              alert('Task not found.');
            }
          },
          error: (error) => {
            console.error('Error updating task:', error);
            alert('Error updating task. Please try again.');
          },
        });
    }
  }

  deleteTask(taskId: number) {
    const task = this.tasks.find((t) => t.id === taskId);

    if (task?.assignedUserId) {
      // Unassign user first
      this.userService
        .unassignTaskFromUser(task.assignedUserId)
        .pipe(takeUntil(this.destroy$))
        .subscribe();
    }

    if (confirm('Are you sure you want to delete this task?')) {
      this.isLoading = true;
      this.taskService
        .deleteTask(taskId)
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
              console.log('Task deleted successfully');
            } else {
              alert('Task not found.');
            }
          },
          error: (error) => {
            console.error('Error deleting task:', error);
            alert('Error deleting task. Please try again.');
          },
        });
    }
  }

  // User Assignment Methods
  startAssigning(taskId: number) {
    this.assigningTaskId = taskId;
    this.editingTaskId = null;
    this.isCreating = false;
    this.cdr.markForCheck();
  }

  cancelAssigning() {
    this.assigningTaskId = null;
    this.cdr.markForCheck();
  }

  assignUserToTask(taskId: number, userId: number) {
    const user = this.users.find((u) => u.id === userId);
    const task = this.tasks.find((t) => t.id === taskId);

    // Validation: Check if user already has a task in progress
    if (user?.assignedTaskId) {
      const existingTask = this.tasks.find((t) => t.id === user.assignedTaskId);
      if (existingTask?.state === 'in progress') {
        alert(
          'This user already has a task in progress. Complete it first before assigning a new one.'
        );
        return;
      }
    }

    // Validation: Check task state
    if (task?.state === 'done') {
      alert('Cannot assign user to a completed task.');
      return;
    }

    this.isLoading = true;

    // Update both task and user
    combineLatest([
      this.taskService.assignUserToTask(taskId, userId),
      this.userService.assignTaskToUser(userId, taskId),
    ])
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: ([taskSuccess, userSuccess]) => {
          if (taskSuccess && userSuccess) {
            console.log('User assigned to task successfully');
            this.cancelAssigning();
          } else {
            alert('Error assigning user to task. Please try again.');
          }
        },
        error: (error) => {
          console.error('Error assigning user to task:', error);
          alert('Error assigning user to task. Please try again.');
        },
      });
  }

  unassignUserFromTask(taskId: number) {
    const task = this.tasks.find((t) => t.id === taskId);

    if (!task?.assignedUserId) {
      return;
    }

    if (confirm('Are you sure you want to unassign the user from this task?')) {
      this.isLoading = true;

      combineLatest([
        this.taskService.unassignUserFromTask(taskId),
        this.userService.unassignTaskFromUser(task.assignedUserId),
      ])
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            this.isLoading = false;
            this.cdr.markForCheck();
          })
        )
        .subscribe({
          next: ([taskSuccess, userSuccess]) => {
            if (taskSuccess && userSuccess) {
              console.log('User unassigned from task successfully');
            } else {
              alert('Error unassigning user from task. Please try again.');
            }
          },
          error: (error) => {
            console.error('Error unassigning user from task:', error);
            alert('Error unassigning user from task. Please try again.');
          },
        });
    }
  }

  // Helper Methods
  getAssignedUser(task: Task): User | undefined {
    if (!task.assignedUserId) return undefined;
    return this.users.find((user) => user.id === task.assignedUserId);
  }

  getUserName(task: Task): string {
    const user = this.getAssignedUser(task);
    return user ? user.name : 'Unassigned';
  }

  getAvailableUsers(): User[] {
    return this.users.filter((user) => !user.assignedTaskId);
  }

  canAssignUser(task: Task): boolean {
    return task.state !== 'done';
  }

  getStateClass(state: TaskState): string {
    return this.taskService.getStateClass(state);
  }

  formatDate(date: Date): string {
    return this.taskService.formatDate(date);
  }
}
