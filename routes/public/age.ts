export const age = async () => {
    const age = new Date(new Date().getTime() - new Date(process.env.dateOfBirth).getTime()).getUTCFullYear() - 1970;
    return { age };
};
