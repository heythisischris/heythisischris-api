export const unarchiveLinearTeams = async () => {
    try {
        // Step 1: Fetch all teams
        const teamsData = (await (await fetch(`https://api.linear.app/graphql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: process.env.LINEAR_API_KEY,
            },
            body: JSON.stringify({
                query: `query ArchivedTeams {archivedTeams {id name}}`
            }),
        })).json());
        const archivedTeams = teamsData?.data?.archivedTeams

        console.log(`Found ${archivedTeams.length} archived teams`);
        // Step 2: Unarchive each team
        for (const team of archivedTeams) {
            console.log(`Unarchiving team: ${team.name} (${team.id})`);
            const unarchiveResponse = await fetch(`https://api.linear.app/graphql`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `${process.env.LINEAR_API_KEY}`,
                },
                body: JSON.stringify({
                    query: `
                    mutation TeamUnarchive($teamUnarchiveId: String!) {
                      teamUnarchive(id: $teamUnarchiveId) {
                        success
                      }
                    }
                  `,
                    variables: {
                        teamUnarchiveId: team.id
                    }
                }),
            });

            const unarchiveResult = await unarchiveResponse.json();

            if (unarchiveResult?.data?.teamUnarchive?.success) {
                console.log(`✅ Successfully unarchived team: ${team.name}`);
            } else {
                console.error(`❌ Failed to unarchive team: ${team.name}`, unarchiveResult?.errors || unarchiveResult);
            }

            // Add a small delay between requests
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        console.log('Team unarchiving process completed');

    } catch (err) {
        console.log('Error in unarchive process:', err);
    }
    return true;
};