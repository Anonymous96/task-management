import {
  ChangeDetectionStrategy,
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

  // Signal-based state
  tasks = signal<Task[]>([]);
  users = signal<User[]>([]);
  isCreating = signal(false);
  editingTaskId = signal<number | null>(null);
  isLoading = signal(false);
  assigningTaskId = signal<number | null>(null);

  // Form state signals
  newTask = signal<{
    name: string;
    description: string;
    state: TaskState;
    assignedUserId?: number;
  }>({
    name: '',
    description: '',
    state: 'in queue',
  });

  editingTask = signal<Task | null>(null);

  // Computed signals
  availableUsers = computed(() =>
    this.users().filter((user) => !user.assignedTaskId)
  );

  hasUsers = computed(() => this.users().length > 0);
  hasTasks = computed(() => this.tasks().length > 0);

  constructor(
    private taskService: TaskService,
    private userService: UserService
  ) {
    // Effect to log state changes (for debugging)
    effect(() => {
      console.log('Tasks count:', this.tasks().length);
      console.log('Users count:', this.users().length);
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

    // Load both tasks and users for assignment management
    combineLatest([
      this.taskService.getAllTasks(),
      this.userService.getAllUsers(),
    ])
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading.set(false);
        })
      )
      .subscribe({
        next: ([tasks, users]) => {
          this.tasks.set(tasks);
          this.users.set(users);
        },
        error: (error) => {
          console.error('Error loading data:', error);
        },
      });
  }

  startCreating() {
    this.isCreating.set(true);
    this.editingTaskId.set(null);
    this.assigningTaskId.set(null);
    this.newTask.set({
      name: '',
      description: '',
      state: 'in queue',
    });
  }

  cancelCreating() {
    this.isCreating.set(false);
    this.newTask.set({
      name: '',
      description: '',
      state: 'in queue',
    });
  }

  createTask() {
    const taskData = this.newTask();
    if (this.taskService.validateTask(taskData.name, taskData.description)) {
      this.isLoading.set(true);
      const request: CreateTaskRequest = {
        name: taskData.name,
        description: taskData.description,
        state: taskData.state,
        assignedUserId: taskData.assignedUserId,
      };

      this.taskService
        .createTask(request)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            this.isLoading.set(false);
          })
        )
        .subscribe({
          next: (createdTask) => {
            console.log('Task created successfully:', createdTask);
            // If user was assigned, update user service
            if (taskData.assignedUserId) {
              this.userService
                .assignTaskToUser(taskData.assignedUserId, createdTask.id)
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
    this.editingTaskId.set(task.id);
    this.isCreating.set(false);
    this.assigningTaskId.set(null);
    this.editingTask.set({ ...task });
  }

  cancelEditing() {
    this.editingTaskId.set(null);
    this.editingTask.set(null);
  }

  updateTask() {
    const task = this.editingTask();
    if (task && this.taskService.validateTask(task.name, task.description)) {
      this.isLoading.set(true);
      const request: UpdateTaskRequest = {
        id: task.id,
        name: task.name,
        description: task.description,
        state: task.state,
        assignedUserId: task.assignedUserId,
      };

      this.taskService
        .updateTask(request)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            this.isLoading.set(false);
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
    const task = this.tasks().find((t) => t.id === taskId);

    if (task?.assignedUserId) {
      // Unassign user first
      this.userService
        .unassignTaskFromUser(task.assignedUserId)
        .pipe(takeUntil(this.destroy$))
        .subscribe();
    }

    if (confirm('Are you sure you want to delete this task?')) {
      this.isLoading.set(true);
      this.taskService
        .deleteTask(taskId)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            this.isLoading.set(false);
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
    this.assigningTaskId.set(taskId);
    this.editingTaskId.set(null);
    this.isCreating.set(false);
  }

  cancelAssigning() {
    this.assigningTaskId.set(null);
  }

  assignUserToTask(taskId: number, userId: number) {
    const user = this.users().find((u) => u.id === userId);
    const task = this.tasks().find((t) => t.id === taskId);

    // Validation: Check if user already has a task in progress
    if (user?.assignedTaskId) {
      const existingTask = this.tasks().find(
        (t) => t.id === user.assignedTaskId
      );
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

    this.isLoading.set(true);

    // Update both task and user
    combineLatest([
      this.taskService.assignUserToTask(taskId, userId),
      this.userService.assignTaskToUser(userId, taskId),
    ])
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading.set(false);
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
    const task = this.tasks().find((t) => t.id === taskId);

    if (!task?.assignedUserId) {
      return;
    }

    if (confirm('Are you sure you want to unassign the user from this task?')) {
      this.isLoading.set(true);

      combineLatest([
        this.taskService.unassignUserFromTask(taskId),
        this.userService.unassignTaskFromUser(task.assignedUserId),
      ])
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            this.isLoading.set(false);
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
    return this.users().find((user) => user.id === task.assignedUserId);
  }

  getUserName(task: Task): string {
    const user = this.getAssignedUser(task);
    return user ? user.name : 'Unassigned';
  }

  getAvailableUsers(): User[] {
    return this.availableUsers();
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

  // Signal update methods for template two-way binding
  updateNewTaskName(event: Event) {
    const name = (event.target as HTMLInputElement).value;
    this.newTask.update((task) => ({ ...task, name }));
  }

  updateNewTaskDescription(event: Event) {
    const description = (event.target as HTMLTextAreaElement).value;
    this.newTask.update((task) => ({ ...task, description }));
  }

  updateNewTaskState(event: Event) {
    const state = (event.target as HTMLSelectElement).value as TaskState;
    this.newTask.update((task) => ({ ...task, state }));
  }

  updateNewTaskAssignedUser(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    const assignedUserId = value ? +value : undefined;
    this.newTask.update((task) => ({ ...task, assignedUserId }));
  }

  updateEditingTaskName(event: Event) {
    const name = (event.target as HTMLInputElement).value;
    this.editingTask.update((task) => (task ? { ...task, name } : null));
  }

  updateEditingTaskDescription(event: Event) {
    const description = (event.target as HTMLTextAreaElement).value;
    this.editingTask.update((task) => (task ? { ...task, description } : null));
  }

  updateEditingTaskState(event: Event) {
    const state = (event.target as HTMLSelectElement).value as TaskState;
    this.editingTask.update((task) => (task ? { ...task, state } : null));
  }

  updateEditingTaskAssignedUser(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    const assignedUserId = value ? +value : undefined;
    this.editingTask.update((task) =>
      task ? { ...task, assignedUserId } : null
    );
  }
}
