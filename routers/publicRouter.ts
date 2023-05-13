import { event } from "#src/utils/event";
import { githubSync, github, posts, post, apps, app, testimonials, contact, comments, notion, githubCalendar, age, empty } from "#src/routes/public";

export const publicRouter = async () => {
    if (event.path === '/githubSync') {
        return githubSync();
    }
    else if (event.path.endsWith('/github')) {
        return github();
    }
    else if (event.path === '/posts') {
        return posts();
    }
    else if (event.path === '/post') {
        return post();
    }
    else if (event.path === '/apps') {
        return apps();
    }
    else if (event.path === '/app') {
        return app();
    }
    else if (event.path === '/testimonials') {
        return testimonials();
    }
    else if (event.path === '/contact') {
        return contact();
    }
    else if (event.path === '/comments') {
        return comments();
    }
    else if (event.path === '/notion') {
        return notion();
    }
    else if (event.path === '/githubCalendar') {
        return githubCalendar();
    }
    else if (event.path === '/age') {
        return age();
    }
    else {
        return empty();
    }
}