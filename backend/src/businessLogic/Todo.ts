import { TodoItem } from "../models/TodoItem";
import { parseUserId } from "../auth/utils";
import { CreateTodoRequest}  from "../requests/CreateTodoRequest";
import { UpdateTodoRequest } from "../requests/UpdateTodoRequest";
import { TodoUpdate} from "../models/TodoUpdate";
import { TodoAccess } from "../dataLayer/TodoAcess";

import * as uuid from 'uuid'
const todoAccess = new TodoAccess();

export async function getTodos(jwtToken: string): Promise<TodoItem[]> {
    const userId = parseUserId(jwtToken);
    return todoAccess.getTodos(userId);
}

export function createTodo(createTodoRequest: CreateTodoRequest, jwtToken: string): Promise<TodoItem> {
    const userId = parseUserId(jwtToken);
    const todoId =  uuid.v4();
    const s3BucketName = process.env.S3_BUCKET_NAME;
    const item = {
        userId: userId,
        todoId: todoId,
        attachmentUrl:  `https://${s3BucketName}.s3.amazonaws.com/${todoId}`, 
        createdAt: new Date().toISOString(),
        done: false,
        ...createTodoRequest,
    };
    return todoAccess.createTodo(item);
}

export function updateTodo(updateTodoRequest: UpdateTodoRequest, todoId: string, jwtToken: string): Promise<TodoUpdate> {
    const userId = parseUserId(jwtToken);
    return todoAccess.updateTodo(updateTodoRequest, todoId, userId);
}

export function deleteTodo(todoId: string, jwtToken: string): Promise<string> {
    const userId = parseUserId(jwtToken);
    return todoAccess.deleteTodo(todoId, userId);
}

export function generateUploadUrl(todoId: string): Promise<string> {
    return todoAccess.generateUploadUrl(todoId);
}