const AWSXray = require("aws-xray-sdk-core");
const AWS = require("aws-sdk")
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { Types } from 'aws-sdk/clients/s3';
import { TodoItem } from "../models/TodoItem";
import { TodoUpdate } from "../models/TodoUpdate";

const XAWS = AWSXray.captureAWS(AWS);
export class TodoAccess {
    constructor(
        private readonly dynamoClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
        private readonly s3Client: Types = new XAWS.S3({ signatureVersion: 'v4' }),
        private readonly tableName = process.env.TODOS_TABLE,
        private readonly s3BucketName = process.env.S3_BUCKET_NAME
    ) {}

    async getTodos(userId: string): Promise<TodoItem[]> {
        console.log ('getting todos for: ', userId);
        
        try {
            const result = await this.dynamoClient.query({
                TableName: this.tableName,
                KeyConditionExpression: "#userId = :userId",
                ExpressionAttributeValues: {
                    ":userId": userId
                }
            }).promise();
            const items = result.Items;
            return items as TodoItem[];
            
        } catch (error) {
            console.log('Error retrieving all todos', error);          
        }
    }

    async createTodo(todoItem: TodoItem): Promise<TodoItem> {
        console.log ('creating new todo item', todoItem);
        
        try {
            await this.dynamoClient.put({
                TableName: this.tableName,
                Item: todoItem,
            }).promise();
            console.log('done');
            return todoItem as TodoItem;
            
        } catch (error) {
            console.log('Error creating new todo', error);
        }
    }

    async updateTodo(todoUpdate: TodoUpdate, todoId: string, userId: string): Promise<TodoUpdate> {

        console.log('updating todo, ', todoId);
        try {
            const params = {
                TableName: this.tableName,
                Key: {
                    "userId": userId,
                    "todoId": todoId
                },
                UpdateExpression: "set #var1 = :a, #var2 = :b, #var3 = :c",
                ExpressionAttributeNames: {
                    "#var1": "name",
                    "#var2": "dueDate",
                    "#var3": "done"
                },
                ExpressionAttributeValues: {
                    ":a": todoUpdate['name'],
                    ":b": todoUpdate['dueDate'],
                    ":c": todoUpdate['done']
                },
            };
    
            const result = await this.dynamoClient.update(params).promise();
            console.log(result);
            const attributes = result.Attributes;
    
            return attributes as TodoUpdate;
        } catch (error) {
            console.log('Error updating todo', error);
        }
    }

    async deleteTodo(todoId: string, userId: string): Promise<string> {
        console.log('deleting todo', todoId);

        try {
            const params = {
                TableName: this.tableName,
                Key: {
                    "userId": userId,
                    "todoId": todoId
                },
            };
    
            const result = await this.dynamoClient.delete(params).promise();
            console.log(result);
    
            return "" as string;
        } catch (error) {
            console.log('Error deleting todo', error);
        }
    }

    async generateUploadUrl(todoId: string): Promise<string> {
        console.log("Generating upload URL");

        try {
            const url = this.s3Client.getSignedUrl('putObject', {
                Bucket: this.s3BucketName,
                Key: todoId,
                Expires: 1000,
            });
            console.log(url);
    
            return url as string;
        } catch (error) {
            console.log('Error generating upload URL', error);
        }
    }
}