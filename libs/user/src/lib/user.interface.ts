export interface User {
  id: number;
  name: string;
  createdDate: Date;
  modifiedDate: Date;
  assignedTaskId?: number;
}

export interface CreateUserRequest {
  name: string;
}

export interface UpdateUserRequest {
  id: number;
  name: string;
}

export interface UserWithTask {
  id: number;
  name: string;
  createdDate: Date;
  modifiedDate: Date;
  assignedTask?: {
    id: number;
    name: string;
    state: string;
    createdDate: Date;
    modifiedDate: Date;
  };
}

export interface UserFilters {
  searchText?: string;
  hasAssignedTask?: boolean;
}

export interface UserStatistics {
  total: number;
  withAssignedTasks: number;
  withoutAssignedTasks: number;
}
