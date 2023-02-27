import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { unmarshall } from '@aws-sdk/util-dynamodb';
const dynamodb = new DynamoDB();

export const query = async (Statement, Parameters) => {
    return (await dynamodb.executeStatement({ Statement, Parameters })).Items.map(obj => unmarshall(obj));
};
