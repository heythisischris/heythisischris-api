import { query } from '#src/utils';

export const githubSync = async () => {
  const graphql = await (await fetch('https://api.github.com/graphql', {
    method: 'POST',
    body: JSON.stringify({
      query: `{${['place4pals', 'productabot', 'heythisischris', 'calcbot',].map(obj => `
                ${obj.replaceAll('-', '')}: search(query: "org:${obj} is:public", type: REPOSITORY, last: 10) {
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
                                    history(first: 100, author: {emails:["chris@heythisischris.com"]}) {
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
  })).json();

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

  await query(`UPDATE htic SET "content"=? WHERE "pk"='github' AND "sk"='0'`, [{ "S": JSON.stringify(responseArray.slice(0, 100)) }]);

  return true;
};
