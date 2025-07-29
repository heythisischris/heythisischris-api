import { DsqlSigner } from "@aws-sdk/dsql-signer";

export const generateDsqlToken = async () => {
    const signer = new DsqlSigner({
        hostname: 'giabtu6rwy3actsdpqd6lsnxb4.dsql.us-east-2.on.aws',
        region: 'us-east-2',
        expiresIn: 604800,
    });
    try {
        const token = await signer.getDbConnectAdminAuthToken();
        console.log(JSON.stringify({ token }));
        return token;
    } catch (error) {
        console.error("Failed to generate token: ", error);
        throw error;
    }
}