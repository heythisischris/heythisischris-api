const aws = require('aws-sdk');
const dynamodb = new aws.DynamoDB();
const converter = require('aws-sdk').DynamoDB.Converter;
const unmarshall = async (input) => {
    for (let i = 0; i < input.Items.length; i++) { input.Items[i] = converter.unmarshall(input.Items[i]); }
    return input.Items;
};
const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');

exports.handler = async (event) => {
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

        await unmarshall(await dynamodb.executeStatement({ Statement: `UPDATE heythisischris SET "content"=? WHERE "type"='github' AND "timestamp"='2020-01-01'`, Parameters: [{ "S": JSON.stringify(responseArray.splice(0, 30)) }] }).promise());

        return { statusCode: 200, body: "success", headers: { 'Access-Control-Allow-Origin': '*' } };
    }
    else if (event.path.endsWith('/github')) {
        let commits = (await unmarshall(await dynamodb.executeStatement({ Statement: `SELECT "content" from heythisischris WHERE "type"='github' AND "timestamp"='2020-01-01'` }).promise()))[0].content;
        return { statusCode: 200, body: commits, headers: { 'Access-Control-Allow-Origin': '*' } };
    }
    else if (event.path === '/feed') {
        let posts = await unmarshall(await dynamodb.executeStatement({ Statement: `SELECT * from heythisischris WHERE "type"='post' AND "timestamp">='2020-01-01' ORDER BY "timestamp" ASC` }).promise());
        return { statusCode: 200, body: JSON.stringify(posts), headers: { 'Access-Control-Allow-Origin': '*' } };
    }
    else if (event.path === '/apps') {
        const apps = await unmarshall(await dynamodb.executeStatement({ Statement: `SELECT * from heythisischris WHERE "type"='app' AND "timestamp">='0' ORDER BY "timestamp" ASC` }).promise());
        return { statusCode: 200, body: JSON.stringify(apps), headers: { 'Access-Control-Allow-Origin': '*' } };

    }
    else if (event.path === '/app') {
        const apps = (await unmarshall(await dynamodb.executeStatement({ Statement: `SELECT * from heythisischris WHERE "type"='app' AND "timestamp">='0' AND "id"='${event.queryStringParameters.id}' ORDER BY "timestamp" DESC` }).promise()));
        return { statusCode: 200, body: JSON.stringify(apps[0]), headers: { 'Access-Control-Allow-Origin': '*' } };
    }
    else if (event.path === '/contact') {
        await new aws.SES({ region: 'us-east-1' }).sendEmail({
            Destination: { ToAddresses: ['chris@heythisischris.com'] },
            Source: 'noreply@heythisischris.com',
            ReplyToAddresses: ['noreply@heythisischris.com'],
            Message: {
                Body: { Html: { Data: event.body.message }, Text: { Data: event.body.message } },
                Subject: { Data: `${event.body.name} contacted you from ${event.body.email}` }
            },
        }).promise();

        return { statusCode: 200, body: JSON.stringify('success'), headers: { 'Access-Control-Allow-Origin': '*' } };
    }
    else if (event.path === '/comments') {
        let response = [{}];
        if (event.httpMethod === 'GET') {
            response = await unmarshall(await dynamodb.executeStatement({ Statement: `SELECT * from heythisischris WHERE "type"='comment' AND "timestamp">='2020-01-01' AND "post_id"='${event.queryStringParameters.post_id}' ORDER BY "timestamp" ASC` }).promise());
            for (let obj of response) {
                if (obj.ip_address === event.requestContext.identity.sourceIp) {
                    obj.canDelete = true;
                }
            }
        }
        else if (event.httpMethod === 'POST') {
            let id = uuidv4().slice(0, 8);
            await unmarshall(await dynamodb.executeStatement({ Statement: `INSERT INTO heythisischris VALUE {'type':'comment', 'timestamp':'${new Date().toISOString()}', 'ip_address':'${event.requestContext.identity.sourceIp}', 'name':'${event.body.name.substr(0, 10)}', 'content':'${event.body.content.substr(0, 200)}', 'post_id':'${event.body.post_id}', 'id':'${id}'}` }).promise());
            let post = (await unmarshall(await dynamodb.executeStatement({ Statement: `SELECT * FROM heythisischris WHERE "type"='post' AND "id"='${event.body.post_id}'` }).promise()))[0];
            await unmarshall(await dynamodb.executeStatement({ Statement: `UPDATE heythisischris SET "commentCount"=${post.commentCount+1} WHERE "type"='post' AND "timestamp"='${post.timestamp}' AND "id"='${event.body.post_id}'` }).promise());
            response = [{ id: id }];
        }
        else if (event.httpMethod === 'DELETE') {
            await unmarshall(await dynamodb.executeStatement({ Statement: `DELETE FROM heythisischris WHERE "type"='comment' AND "timestamp"='${event.body.timestamp}' AND "id"='${event.body.id}' AND "ip_address"='${event.requestContext.identity.sourceIp}'` }).promise());
            let post = (await unmarshall(await dynamodb.executeStatement({ Statement: `SELECT * FROM heythisischris WHERE "type"='post' AND "id"='${event.body.post_id}'` }).promise()))[0];
            await unmarshall(await dynamodb.executeStatement({ Statement: `UPDATE heythisischris SET "commentCount"=${post.commentCount-1} WHERE "type"='post' AND "timestamp"='${post.timestamp}' AND "id"='${event.body.post_id}'` }).promise());
        }
        return { statusCode: 200, body: JSON.stringify(response), headers: { 'Access-Control-Allow-Origin': '*' } };
    }
    else {
        return { statusCode: 200, body: 'whatcha lookin for?', headers: { 'Access-Control-Allow-Origin': '*' } };
    }
};
