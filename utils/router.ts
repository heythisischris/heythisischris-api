import { event } from "./event";

export const router = async (routes) => {
    for (const [routeName, routeFunction] of Object.entries(routes)) {
        if (event.rawPath.endsWith(`/${routeName}`)) {
            return routeFunction();
        }
    }
};