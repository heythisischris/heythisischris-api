import { githubSync } from './routes/githubSync';
import { github } from './routes/github';
import { posts } from './routes/posts';
import { post } from './routes/post';
import { apps } from './routes/apps';
import { app } from './routes/app';
import { testimonials } from './routes/testimonials';
import { contact } from './routes/contact';
import { comments } from './routes/comments';
import { notion } from './routes/notion';
import { githubCalendar } from './routes/githubCalendar';
import { age } from './routes/age';
import { uuid } from './routes/uuid';
import { empty } from './routes/empty';

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
