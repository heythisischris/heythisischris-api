import ServerlessClient from "serverless-postgres";

export const dsql = new ServerlessClient({
    user: 'admin',
    host: process.env.DSQL_HOST,
    database: 'postgres',
    password: process.env.DSQL_PASSWORD,
    port: 5432,
    ssl: { rejectUnauthorized: false },
});