import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Task {
  id: number;
  name: string;
  description: string;
  createdDate: Date;
  modifiedDate: Date;
  state: 'in queue' | 'in progress' | 'done';
}

@Component({
  selector: 'app-tasks',
  imports: [CommonModule, FormsModule],
  templateUrl: './tasks.html',
  styleUrl: './tasks.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Tasks implements OnInit {
  tasks: Task[] = [];
  isCreating = false;
  editingTaskId: number | null = null;

  newTask: Omit<Task, 'id' | 'createdDate' | 'modifiedDate'> = {
    name: '',
    description: '',
    state: 'in queue',
  };

  editingTask: Task | null = null;

  ngOnInit() {
    this.loadTasks();
  }

  getCurrentDate(): Date {
    return new Date();
  }

  private loadTasks() {
    // Simulate loading tasks (in real app, this would be an API call)
    this.tasks = [
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
  }

  startCreating() {
    this.isCreating = true;
    this.editingTaskId = null;
    this.newTask = {
      name: '',
      description: '',
      state: 'in queue',
    };
  }

  cancelCreating() {
    this.isCreating = false;
    this.newTask = {
      name: '',
      description: '',
      state: 'in queue',
    };
  }

  createTask() {
    if (this.newTask.name.trim() && this.newTask.description.trim()) {
      const task: Task = {
        id: Math.max(0, ...this.tasks.map((t) => t.id)) + 1,
        name: this.newTask.name.trim(),
        description: this.newTask.description.trim(),
        state: this.newTask.state,
        createdDate: new Date(),
        modifiedDate: new Date(),
      };

      this.tasks.push(task);
      this.cancelCreating();
    }
  }

  startEditing(task: Task) {
    this.editingTaskId = task.id;
    this.isCreating = false;
    this.editingTask = { ...task };
  }

  cancelEditing() {
    this.editingTaskId = null;
    this.editingTask = null;
  }

  updateTask() {
    if (
      this.editingTask &&
      this.editingTask.name.trim() &&
      this.editingTask.description.trim()
    ) {
      const index = this.tasks.findIndex((t) => t.id === this.editingTask!.id);
      if (index !== -1) {
        this.editingTask.modifiedDate = new Date();
        this.tasks[index] = { ...this.editingTask };
        this.cancelEditing();
      }
    }
  }

  deleteTask(taskId: number) {
    if (confirm('Are you sure you want to delete this task?')) {
      this.tasks = this.tasks.filter((task) => task.id !== taskId);
    }
  }

  getStateClass(state: Task['state']): string {
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

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  }
}
