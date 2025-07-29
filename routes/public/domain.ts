import { event } from '#src/utils';
import { Route53DomainsClient, CheckDomainAvailabilityCommand, GetDomainDetailCommand } from "@aws-sdk/client-route-53-domains";
const client = new Route53DomainsClient({ region: "us-east-1" });

export const domain = async () => {
    const domainName = event.queryStringParameters.q;
    const command = new CheckDomainAvailabilityCommand({
        DomainName: domainName
    });

    // const command = new GetDomainDetailCommand({
    //     DomainName: domainName
    // });

    try {
        const response = await client.send(command);
        return { response };
    } catch (error) {
        return { error };
    }
}