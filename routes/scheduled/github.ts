import { client } from "#src/utils/client";

export const github = async () => {
  const data = [];
  const organizations = JSON.parse(process.env.ORGANIZATIONS);
  const treeQuery = `tree {
    entries { 
      name mode type lineCount
      object {
        ... on Tree {
          entries {
            name mode type lineCount
            object {
              ... on Tree {
                entries {
                  name mode type lineCount
                  object {
                    ... on Tree {
                      entries {
                        name mode type lineCount
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
  }`;
  for (const organization of organizations) {
    const response = await (await fetch('https://api.github.com/graphql', {
      method: 'POST',
      body: JSON.stringify({
        query: `{search(query: "org:${organization}", type: REPOSITORY, last: 20) {
                    nodes {
                      ... on Repository {
                        name
                        url
                        owner {
                          avatarUrl
                        }
                        refs(refPrefix: "refs/heads/", first: 10) {
                          edges {
                            node {
                              ... on Ref {
                                name
                                target {
                                  ... on Commit {
                                    history(first: 100, author: {emails: ["chris@heythisischris.com"]}) {
                                      edges {
                                        node {
                                          ... on Commit {
                                            message
                                            commitUrl
                                            committedDate
                                            deletions
                                            additions
                                            changedFilesIfAvailable
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
                  }
                }`
      }),
      headers: { Authorization: 'Basic ' + Buffer.from('heythisischris:' + process.env.GITHUB_KEY).toString('base64') }
    })).json();
    data.push(...response?.data?.search?.nodes);
  }

  const responseArray = [];
  for (const repo of data) {
    for (const branch of repo.refs.edges) {
      responseArray.push(...branch.node.target.history.edges.map(commit => {
        return {
          date: commit?.node?.committedDate,
          repo: repo?.name,
          repoUrl: repo?.url,
          image: repo?.owner?.avatarUrl,
          branch: branch?.node?.name,
          commit: commit?.node?.message,
          commitUrl: commit?.node?.commitUrl,
          additions: commit?.node?.additions,
          deletions: commit?.node?.deletions,
          changed_files: commit?.node?.changedFilesIfAvailable,
          tree: commit?.node?.tree,
        };
      }));
    }
  }
  responseArray.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  await client.connect();
  for (const row of responseArray) {
    await client.query(`
      INSERT INTO "commits"("created_at", "repo", "repo_url", "branch", "commit", "commit_url", "image", "additions", "deletions", "changed_files", "tree") VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) ON CONFLICT DO NOTHING
  `, [row?.date, row?.repo, row?.repoUrl, row?.branch, row?.commit, row?.commitUrl, row?.image, row?.additions, row?.deletions, row?.changed_files, JSON.stringify(row?.tree)]);
  }
  await client.clean();

  return responseArray;
};
