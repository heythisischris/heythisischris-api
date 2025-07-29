export const archiveLinearTeams = async () => {
    try {
        // Step 1: Fetch all teams
        const teamsData = (await (await fetch(`https://api.linear.app/graphql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: process.env.LINEAR_API_KEY,
            },
            body: JSON.stringify({
                query: `{teams(orderBy: createdAt, last: 30) { nodes {id name} }}`
            }),
        })).json());
        const activeTeams = teamsData?.data?.teams?.nodes || [];

        console.log(`Found ${activeTeams.length} active teams`);
        // Step 2: Archive each team
        for (const team of activeTeams) {
            console.log(`Archiving team: ${team.name} (${team.id})`);
            const archiveResponse = await fetch(`https://api.linear.app/graphql`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `${process.env.LINEAR_API_KEY}`,
                },
                body: JSON.stringify({
                    query: `
                    mutation TeamDelete($teamDeleteId: String!) {
                      teamDelete(id: $teamDeleteId) {
                        success
                      }
                    }
                  `,
                    variables: {
                        teamDeleteId: team.id
                    }
                }),
            });

            const archiveResult = await archiveResponse.json();

            if (archiveResult?.data?.teamDelete?.success) {
                console.log(`✅ Successfully archived team: ${team.name}`);
            } else {
                console.error(`❌ Failed to archive team: ${team.name}`, archiveResult?.errors || archiveResult);
            }

            // Add a small delay between requests
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        console.log('Team archiving process completed');

    } catch (err) {
        console.log('Error in archive process:', err);
    }
    return true;
};