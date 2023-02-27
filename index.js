import { githubSync } from './routes/githubSync.js';
import { github } from './routes/github.js';
import { posts } from './routes/posts.js';
import { post } from './routes/post.js';
import { apps } from './routes/apps.js';
import { app } from './routes/app.js';
import { testimonials } from './routes/testimonials.js';
import { contact } from './routes/contact.js';
import { comments } from './routes/comments.js';
import { notion } from './routes/notion.js';
import { githubCalendar } from './routes/githubCalendar.js';
import { age } from './routes/age.js';
import { uuid } from './routes/uuid.js';
import { empty } from './routes/empty.js';

export const handler = async (event) => {
    console.log(`heythisischris init ${event.httpMethod} ${event.path}`);
    event.lambdaStart = new Date();
    event.body ? event.body = JSON.parse(event.body) : event.body = {};

    if (event.path === '/githubSync') {
        return githubSync({ event });
    }
    else if (event.path.endsWith('/github')) {
        return github({ event });
    }
    else if (event.path === '/posts') {
        return posts({ event });
    }
    else if (event.path === '/post') {
        return post({ event });
    }
    else if (event.path === '/apps') {
        return apps({ event });
    }
    else if (event.path === '/app') {
        return app({ event });
    }
    else if (event.path === '/testimonials') {
        return testimonials({ event });
    }
    else if (event.path === '/contact') {
        return contact({ event });
    }
    else if (event.path === '/comments') {
        return comments({ event });
    }
    else if (event.path === '/notion') {
        return notion({ event });
    }
    else if (event.path === '/githubCalendar') {
        return githubCalendar({});
    }
    else if (event.path === '/age') {
        return age({});
    }
    else if (event.path === '/uuid') {
        return uuid({});
    }
    else {
        return empty({});
    }
};
