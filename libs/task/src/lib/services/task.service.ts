import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, tap, of, catchError } from 'rxjs';
import {
  Task,
  TaskState,
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskFilters,
  TaskStatistics,
} from '../models/task.interface';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private readonly STORAGE_KEY = 'tasks';
  private readonly NEXT_ID_KEY = 'tasks_next_id';

  private tasksSubject = new BehaviorSubject<Task[]>([]);
  public tasks$ = this.tasksSubject.asObservable();

  private nextId = 1;

  constructor() {
    this.loadFromStorage();
  }

  getAllTasks(): Observable<Task[]> {
    return this.tasks$;
  }

  getTaskById(id: number): Observable<Task | undefined> {
    return this.tasks$.pipe(
      map((tasks) => tasks.find((task) => task.id === id))
    );
  }

  createTask(request: CreateTaskRequest): Observable<Task> {
    const task: Task = {
      id: this.nextId++,
      name: request.name.trim(),
      description: request.description.trim(),
      state: request.state,
      createdDate: new Date(),
      modifiedDate: new Date(),
    };

    const currentTasks = this.tasksSubject.value;
    const updatedTasks = [...currentTasks, task];

    return this.updateTasksState(updatedTasks).pipe(
      map(() => task),
      tap(() => this.saveNextId()),
      catchError((error) => {
        console.error('Error creating task:', error);
        throw error;
      })
    );
  }

  updateTask(request: UpdateTaskRequest): Observable<Task | null> {
    const currentTasks = this.tasksSubject.value;
    const taskIndex = currentTasks.findIndex((task) => task.id === request.id);

    if (taskIndex === -1) {
      return of(null);
    }

    const updatedTask: Task = {
      ...currentTasks[taskIndex],
      name: request.name.trim(),
      description: request.description.trim(),
      state: request.state,
      modifiedDate: new Date(),
    };

    const updatedTasks = [...currentTasks];
    updatedTasks[taskIndex] = updatedTask;

    return this.updateTasksState(updatedTasks).pipe(
      map(() => updatedTask),
      catchError((error) => {
        console.error('Error updating task:', error);
        throw error;
      })
    );
  }

  deleteTask(id: number): Observable<boolean> {
    const currentTasks = this.tasksSubject.value;
    const filteredTasks = currentTasks.filter((task) => task.id !== id);

    if (filteredTasks.length === currentTasks.length) {
      return of(false);
    }

    return this.updateTasksState(filteredTasks).pipe(
      map(() => true),
      catchError((error) => {
        console.error('Error deleting task:', error);
        return of(false);
      })
    );
  }

  deleteAllTasks(): Observable<boolean> {
    return this.updateTasksState([]).pipe(
      map(() => true),
      catchError((error) => {
        console.error('Error deleting all tasks:', error);
        return of(false);
      })
    );
  }

  importTasks(tasks: Task[]): Observable<Task[]> {
    const maxId = Math.max(0, ...tasks.map((task) => task.id));
    this.nextId = maxId + 1;

    return this.updateTasksState(tasks).pipe(
      map(() => tasks),
      tap(() => this.saveNextId()),
      catchError((error) => {
        console.error('Error importing tasks:', error);
        throw error;
      })
    );
  }

  filterTasks(filters: TaskFilters): Observable<Task[]> {
    return this.tasks$.pipe(
      map((tasks) => {
        let filteredTasks = tasks;

        if (filters.state) {
          filteredTasks = filteredTasks.filter(
            (task) => task.state === filters.state
          );
        }

        if (filters.searchText) {
          const searchLower = filters.searchText.toLowerCase();
          filteredTasks = filteredTasks.filter(
            (task) =>
              task.name.toLowerCase().includes(searchLower) ||
              task.description.toLowerCase().includes(searchLower)
          );
        }

        return filteredTasks;
      })
    );
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  }

  getStateClass(state: TaskState): string {
    switch (state) {
      case 'in queue':
        return 'state-queue';
      case 'in progress':
        return 'state-progress';
      case 'done':
        return 'state-done';
      default:
        return '';
    }
  }

  validateTask(name: string, description: string): boolean {
    return name.trim().length > 0 && description.trim().length > 0;
  }

  private updateTasksState(tasks: Task[]): Observable<Task[]> {
    try {
      this.saveToStorage(tasks);
      this.tasksSubject.next(tasks);
      return of(tasks);
    } catch (error) {
      console.error('Error updating tasks state:', error);
      throw error;
    }
  }

  private loadFromStorage(): void {
    try {
      const storedTasks = localStorage.getItem(this.STORAGE_KEY);
      const storedNextId = localStorage.getItem(this.NEXT_ID_KEY);

      if (storedTasks) {
        const tasks: Task[] = JSON.parse(storedTasks).map((task: any) => ({
          ...task,
          createdDate: new Date(task.createdDate),
          modifiedDate: new Date(task.modifiedDate),
        }));
        this.tasksSubject.next(tasks);
      } else {
        this.loadInitialTasks();
      }

      if (storedNextId) {
        this.nextId = parseInt(storedNextId, 10);
      } else {
        this.nextId =
          Math.max(1, ...this.tasksSubject.value.map((task) => task.id)) + 1;
      }
    } catch (error) {
      console.error('Error loading from storage:', error);
      this.loadInitialTasks();
    }
  }

  private saveToStorage(tasks: Task[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
      console.error('Error saving to storage:', error);
      throw error;
    }
  }

  private saveNextId(): void {
    try {
      localStorage.setItem(this.NEXT_ID_KEY, this.nextId.toString());
    } catch (error) {
      console.error('Error saving next ID:', error);
    }
  }

  private loadInitialTasks(): void {
    const initialTasks: Task[] = [
      {
        id: 1,
        name: 'Setup project structure',
        description:
          'Create the initial project structure and configure development environment',
        createdDate: new Date('2024-01-15'),
        modifiedDate: new Date('2024-01-15'),
        state: 'done',
      },
      {
        id: 2,
        name: 'Implement user authentication',
        description:
          'Add login and registration functionality with proper validation',
        createdDate: new Date('2024-01-16'),
        modifiedDate: new Date('2024-01-18'),
        state: 'in progress',
      },
      {
        id: 3,
        name: 'Design database schema',
        description:
          'Plan and implement the database structure for the application',
        createdDate: new Date('2024-01-17'),
        modifiedDate: new Date('2024-01-17'),
        state: 'in queue',
      },
    ];

    this.nextId = Math.max(...initialTasks.map((task) => task.id)) + 1;
    this.saveToStorage(initialTasks);
    this.saveNextId();
    this.tasksSubject.next(initialTasks);
  }

  assignUserToTask(taskId: number, userId: number): Observable<boolean> {
    const currentTasks = this.tasksSubject.value;
    const taskIndex = currentTasks.findIndex((task) => task.id === taskId);

    if (taskIndex === -1) {
      return of(false);
    }

    const task = currentTasks[taskIndex];

    if (task.state === 'done') {
      console.warn('Cannot assign user to completed task');
      return of(false);
    }

    const updatedTask: Task = {
      ...task,
      assignedUserId: userId,
      state: task.state === 'in queue' ? 'in progress' : task.state,
      modifiedDate: new Date(),
    };

    const updatedTasks = [...currentTasks];
    updatedTasks[taskIndex] = updatedTask;

    return this.updateTasksState(updatedTasks).pipe(
      map(() => true),
      catchError((error) => {
        console.error('Error assigning user to task:', error);
        return of(false);
      })
    );
  }

  unassignUserFromTask(taskId: number): Observable<boolean> {
    const currentTasks = this.tasksSubject.value;
    const taskIndex = currentTasks.findIndex((task) => task.id === taskId);

    if (taskIndex === -1) {
      return of(false);
    }

    const task = currentTasks[taskIndex];

    const updatedTask: Task = {
      ...task,
      assignedUserId: undefined,
      state: task.state === 'in progress' ? 'in queue' : task.state,
      modifiedDate: new Date(),
    };

    const updatedTasks = [...currentTasks];
    updatedTasks[taskIndex] = updatedTask;

    return this.updateTasksState(updatedTasks).pipe(
      map(() => true),
      catchError((error) => {
        console.error('Error unassigning user from task:', error);
        return of(false);
      })
    );
  }
}
