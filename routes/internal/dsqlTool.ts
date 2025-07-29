import { dsql, graphDsql } from '#src/utils';

export const dsqlTool = async () => {
    await dsql.connect();
    const response = await graphDsql(`
    query {
        users { 
            id 
            created_at 
            name
            projects { id }
        }
    }`, {});
    await dsql.clean();
    console.log(JSON.stringify(response));
    return;
}