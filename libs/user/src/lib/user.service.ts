import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, tap, of, catchError } from 'rxjs';
import { User, CreateUserRequest, UpdateUserRequest } from './user.interface';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly STORAGE_KEY = 'users';
  private readonly NEXT_ID_KEY = 'users_next_id';

  private usersSubject = new BehaviorSubject<User[]>([]);
  public users$ = this.usersSubject.asObservable();

  private nextId = 1;

  constructor() {
    this.loadFromStorage();
  }

  getAllUsers(): Observable<User[]> {
    return this.users$;
  }

  getUserById(id: number): Observable<User | undefined> {
    return this.users$.pipe(
      map((users) => users.find((user) => user.id === id))
    );
  }

  createUser(request: CreateUserRequest): Observable<User> {
    const user: User = {
      id: this.nextId++,
      name: request.name.trim(),
      createdDate: new Date(),
      modifiedDate: new Date(),
    };

    const currentUsers = this.usersSubject.value;
    const updatedUsers = [...currentUsers, user];

    return this.updateUsersState(updatedUsers).pipe(
      map(() => user),
      tap(() => this.saveNextId()),
      catchError((error) => {
        console.error('Error creating user:', error);
        throw error;
      })
    );
  }

  updateUser(request: UpdateUserRequest): Observable<User | null> {
    const currentUsers = this.usersSubject.value;
    const userIndex = currentUsers.findIndex((user) => user.id === request.id);

    if (userIndex === -1) {
      return of(null);
    }

    const updatedUser: User = {
      ...currentUsers[userIndex],
      name: request.name.trim(),
      modifiedDate: new Date(),
    };

    const updatedUsers = [...currentUsers];
    updatedUsers[userIndex] = updatedUser;

    return this.updateUsersState(updatedUsers).pipe(
      map(() => updatedUser),
      catchError((error) => {
        console.error('Error updating user:', error);
        throw error;
      })
    );
  }

  deleteUser(id: number): Observable<boolean> {
    const currentUsers = this.usersSubject.value;
    const userToDelete = currentUsers.find((user) => user.id === id);

    if (userToDelete?.assignedTaskId) {
      console.warn('Cannot delete user with assigned task');
      return of(false);
    }

    const filteredUsers = currentUsers.filter((user) => user.id !== id);

    if (filteredUsers.length === currentUsers.length) {
      return of(false);
    }

    return this.updateUsersState(filteredUsers).pipe(
      map(() => true),
      catchError((error) => {
        console.error('Error deleting user:', error);
        return of(false);
      })
    );
  }

  assignTaskToUser(userId: number, taskId: number): Observable<boolean> {
    const currentUsers = this.usersSubject.value;
    const userIndex = currentUsers.findIndex((user) => user.id === userId);

    if (userIndex === -1) {
      return of(false);
    }

    if (currentUsers[userIndex].assignedTaskId) {
      console.warn('User already has a task assigned');
      return of(false);
    }

    const updatedUser: User = {
      ...currentUsers[userIndex],
      assignedTaskId: taskId,
      modifiedDate: new Date(),
    };

    const updatedUsers = [...currentUsers];
    updatedUsers[userIndex] = updatedUser;

    return this.updateUsersState(updatedUsers).pipe(
      map(() => true),
      catchError((error) => {
        console.error('Error assigning task to user:', error);
        return of(false);
      })
    );
  }

  unassignTaskFromUser(userId: number): Observable<boolean> {
    const currentUsers = this.usersSubject.value;
    const userIndex = currentUsers.findIndex((user) => user.id === userId);

    if (userIndex === -1) {
      return of(false);
    }

    const updatedUser: User = {
      ...currentUsers[userIndex],
      assignedTaskId: undefined,
      modifiedDate: new Date(),
    };

    const updatedUsers = [...currentUsers];
    updatedUsers[userIndex] = updatedUser;

    return this.updateUsersState(updatedUsers).pipe(
      map(() => true),
      catchError((error) => {
        console.error('Error unassigning task from user:', error);
        return of(false);
      })
    );
  }

  getAvailableUsers(): Observable<User[]> {
    return this.users$.pipe(
      map((users) => users.filter((user) => !user.assignedTaskId))
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

  validateUser(name: string): boolean {
    return name.trim().length > 0;
  }

  private updateUsersState(users: User[]): Observable<User[]> {
    try {
      this.saveToStorage(users);
      this.usersSubject.next(users);
      return of(users);
    } catch (error) {
      console.error('Error updating users state:', error);
      throw error;
    }
  }

  private loadFromStorage(): void {
    try {
      const storedUsers = localStorage.getItem(this.STORAGE_KEY);
      const storedNextId = localStorage.getItem(this.NEXT_ID_KEY);

      if (storedUsers) {
        const users: User[] = JSON.parse(storedUsers).map((user: any) => ({
          ...user,
          createdDate: new Date(user.createdDate),
          modifiedDate: new Date(user.modifiedDate),
        }));
        this.usersSubject.next(users);
      } else {
        this.loadInitialUsers();
      }

      if (storedNextId) {
        this.nextId = parseInt(storedNextId, 10);
      } else {
        this.nextId =
          Math.max(1, ...this.usersSubject.value.map((user) => user.id)) + 1;
      }
    } catch (error) {
      console.error('Error loading from storage:', error);
      this.loadInitialUsers();
    }
  }

  private saveToStorage(users: User[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(users));
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

  private loadInitialUsers(): void {
    const initialUsers: User[] = [
      {
        id: 1,
        name: 'John Doe',
        createdDate: new Date('2024-01-10'),
        modifiedDate: new Date('2024-01-10'),
      },
      {
        id: 2,
        name: 'Jane Smith',
        createdDate: new Date('2024-01-12'),
        modifiedDate: new Date('2024-01-12'),
      },
      {
        id: 3,
        name: 'Bob Johnson',
        createdDate: new Date('2024-01-14'),
        modifiedDate: new Date('2024-01-14'),
      },
    ];

    this.nextId = Math.max(...initialUsers.map((user) => user.id)) + 1;
    this.saveToStorage(initialUsers);
    this.saveNextId();
    this.usersSubject.next(initialUsers);
  }
}
