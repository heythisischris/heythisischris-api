import ical from 'ical-generator';

export const linearCalendar = async () => {
    const calendar = ical({ name: `Linear Tasks` });
    const rows = (await (await fetch(`https://api.linear.app/graphql`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: process.env.LINEAR_API_KEY,
        },
        body: JSON.stringify({
            query: `{
                issues(filter: {dueDate: { null: false }} orderBy: createdAt) {
                    nodes {
                        id
                        identifier
                        title
                        dueDate
                        state { name }
                        team { name }
                    }
                }
            }` }),
    })).json())?.data?.issues?.nodes;

    const statusDict = {
        'Backlog': '○',
        'Selected': '◔',
        'In Progress': '◑',
        'In Review': '◕',
        'Done': '✓',
        'Icebox': '⊗',
    }

    for (const row of rows.filter(obj => ['Backlog', 'Selected', 'In Progress', 'In Review'].includes(obj.state.name))) {
        calendar.createEvent({
            allDay: true,
            start: new Date(row.dueDate),
            summary: `${statusDict?.[row.state.name]} ${row.identifier}: ${row.title}`,
            description: `https://linear.app/htic/issue/${row.identifier}`,
        });
    }

    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'text/calendar',
            'Content-Disposition': 'attachment; filename="calendar.ics"',
        },
        body: calendar.toString(),
    };
};