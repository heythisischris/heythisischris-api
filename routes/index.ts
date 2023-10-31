import { router } from "#src/utils";
import * as publicRoutes from "./public";
import * as internalRoutes from "./internal";
import * as scheduledRoutes from "./scheduled";

export const publicRouter = async () => {
    return router(publicRoutes);
};

export const internalRouter = async () => {
    return router(internalRoutes);
};

export const scheduledRouter = async () => {
    return router(scheduledRoutes);
};