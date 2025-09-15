export interface Task {
  id: number;
  name: string;
  description: string;
  createdDate: Date;
  modifiedDate: Date;
  state: TaskState;
  assignedUserId?: number;
}

export type TaskState = 'in queue' | 'in progress' | 'done';

export interface CreateTaskRequest {
  name: string;
  description: string;
  state: TaskState;
  assignedUserId?: number;
}

export interface UpdateTaskRequest {
  id: number;
  name: string;
  description: string;
  state: TaskState;
  assignedUserId?: number;
}

export interface TaskFilters {
  state?: TaskState;
  searchText?: string;
  assignedUserId?: number;
  unassigned?: boolean;
}

export interface TaskStatistics {
  total: number;
  inQueue: number;
  inProgress: number;
  done: number;
  assigned: number;
  unassigned: number;
}

export interface TaskWithUser {
  id: number;
  name: string;
  description: string;
  createdDate: Date;
  modifiedDate: Date;
  state: TaskState;
  assignedUser?: {
    id: number;
    name: string;
  };
}

export interface AssignTaskRequest {
  taskId: number;
  userId: number;
}

export interface UnassignTaskRequest {
  taskId: number;
}
