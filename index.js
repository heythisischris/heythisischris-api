import { SES } from '@aws-sdk/client-ses';
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { randomUUID } from 'crypto';

const ses = new SES({ region: 'us-east-1' });
const query = async (Statement, Parameters) => { return (await new DynamoDB().executeStatement({ Statement, Parameters })).Items.map(obj => unmarshall(obj)); };

export const handler = async (event) => {
    console.log('heythisischris init');
    event.body ? event.body = JSON.parse(event.body) : event.body = {};

    if (event.path === '/githubSync') {
        let graphql = await fetch('https://api.github.com/graphql', {
            method: 'POST',
            body: JSON.stringify({
                query: `{${['place4pals', 'productabot', 'heythisischris'].map(obj => `
                ${obj}: search(query: "org:${obj}", type: REPOSITORY, last: 10) {
                    nodes {
                      ... on Repository {
                        name
                        url
                        refs(refPrefix: "refs/heads/", first: 10) {
                          edges {
                            node {
                              ... on Ref {
                                name
                                target {
                                  ... on Commit {
                                    history(first: 100, author: {emails:["chris@heythisischris.com","thisischrisaitken@gmail.com","caitken@teckpert.com"]}) {
                                      edges {
                                        node {
                                          ... on Commit {
                                            message
                                            commitUrl
                                            committedDate
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                }`).join('')}}`
            }),
            headers: { Authorization: 'Basic ' + Buffer.from('heythisischris:' + process.env.github).toString('base64') }
        });
        graphql = await graphql.json();
        let responseArray = [];
        for (let org of Object.values(graphql.data)) {
            for (let repo of org.nodes) {
                for (let branch of repo.refs.edges) {
                    responseArray = responseArray.concat(branch.node.target.history.edges.map(obj => {
                        return {
                            date: obj.node.committedDate,
                            repo: repo.name,
                            repoUrl: repo.url,
                            branch: branch.node.name,
                            commit: obj.node.message,
                            commitUrl: obj.node.commitUrl
                        };
                    }));
                }
            }
        }
        responseArray.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        await query(`UPDATE heythisischris SET "content"=? WHERE "type"='github' AND "timestamp"='0'`, [{ "S": JSON.stringify(responseArray.slice(0, 60)) }]);

        return { statusCode: 200, body: "success", headers: { 'Access-Control-Allow-Origin': '*' } };
    }
    else if (event.path.endsWith('/github')) {
        const commits = (await query(`SELECT "content" from heythisischris WHERE "type"='github' AND "timestamp"='0'`))[0].content;
        return { statusCode: 200, body: commits, headers: { 'Access-Control-Allow-Origin': '*' } };
    }
    else if (event.path === '/posts') {
        const posts = await query(`SELECT * from heythisischris WHERE "type"='post' ORDER BY "timestamp" DESC`);
        return { statusCode: 200, body: JSON.stringify(posts), headers: { 'Access-Control-Allow-Origin': '*' } };
    }
    else if (event.path === '/post') {
        const posts = await query(`SELECT * from heythisischris WHERE "type"='post' AND id='${event.queryStringParameters.id}'`);
        return { statusCode: 200, body: JSON.stringify(posts[0]), headers: { 'Access-Control-Allow-Origin': '*' } };
    }
    else if (event.path === '/apps') {
        const apps = await query(`SELECT * from heythisischris WHERE "type"='app' ORDER BY "timestamp" ASC`);
        return { statusCode: 200, body: JSON.stringify(apps), headers: { 'Access-Control-Allow-Origin': '*' } };

    }
    else if (event.path === '/app') {
        const apps = await query(`SELECT * from heythisischris WHERE "type"='app' AND "id"='${event.queryStringParameters.id}' ORDER BY "timestamp" DESC`);
        return { statusCode: 200, body: JSON.stringify(apps[0]), headers: { 'Access-Control-Allow-Origin': '*' } };
    }
    else if (event.path === '/contact') {
        await ses().sendEmail({
            Destination: { ToAddresses: ['chris@heythisischris.com'] },
            Source: 'noreply@heythisischris.com',
            ReplyToAddresses: ['noreply@heythisischris.com'],
            Message: {
                Body: { Html: { Data: event.body.message }, Text: { Data: event.body.message } },
                Subject: { Data: `${event.body.name} contacted you from ${event.body.email}` }
            },
        });

        return { statusCode: 200, body: JSON.stringify('success'), headers: { 'Access-Control-Allow-Origin': '*' } };
    }
    else if (event.path === '/comments') {
        let response = [{}];
        if (event.httpMethod === 'GET') {
            response = await query(`SELECT * from heythisischris WHERE "type"='comment' AND "post_id"='${event.queryStringParameters.post_id}' ORDER BY "timestamp" ASC`);
            for (let obj of response) {
                if (obj.ip_address === event.requestContext.identity.sourceIp) {
                    obj.canDelete = true;
                }
            }
        }
        else if (event.httpMethod === 'POST') {
            const id = randomUUID().slice(0, 8);
            await query(`INSERT INTO heythisischris VALUE {'type':'comment', 'timestamp':'${new Date().toISOString()}', 'ip_address':'${event.requestContext.identity.sourceIp}', 'name':'${event.body.name.substr(0, 10)}', 'content':'${event.body.content.substr(0, 200)}', 'post_id':'${event.body.post_id}', 'id':'${id}'}`);
            const post = (await query(`SELECT * FROM heythisischris WHERE "type"='post' AND "id"='${event.body.post_id}'`))[0];
            await query(`UPDATE heythisischris SET "commentCount"=${post.commentCount+1} WHERE "type"='post' AND "timestamp"='${post.timestamp}' AND "id"='${event.body.post_id}'`);
            response = [{ id: id }];
        }
        else if (event.httpMethod === 'DELETE') {
            await query(`DELETE FROM heythisischris WHERE "type"='comment' AND "timestamp"='${event.body.timestamp}' AND "id"='${event.body.id}' AND "ip_address"='${event.requestContext.identity.sourceIp}'`);
            const post = (await query(`SELECT * FROM heythisischris WHERE "type"='post' AND "id"='${event.body.post_id}'`))[0];
            await query(`UPDATE heythisischris SET "commentCount"=${post.commentCount-1} WHERE "type"='post' AND "timestamp"='${post.timestamp}' AND "id"='${event.body.post_id}'`);
        }
        return { statusCode: 200, body: JSON.stringify(response), headers: { 'Access-Control-Allow-Origin': '*' } };
    }
    else {
        return { statusCode: 200, body: 'whatcha lookin for?', headers: { 'Access-Control-Allow-Origin': '*' } };
    }
};
