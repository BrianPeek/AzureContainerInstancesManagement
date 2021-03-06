const MsRest = require('../shared/external').MsRest;
const ContainerInstanceManagementClient = require('../shared/external').ContainerInstanceManagementClient;
const clientId = process.env.CLIENTID;
const secret = process.env.CLIENTSECRET;
const domain = process.env.TENANT;
const subscriptionId = process.env.SUBSCRIPTIONID;

function getPublicIP(resourceGroup, containerGroupName){
    return new Promise(function(resolve,reject){
        MsRest.loginWithServicePrincipalSecret(
            clientId,
            secret,
            domain,
            (err, credentials) => {
                if (err) throw err;

                const client = new ContainerInstanceManagementClient(credentials, subscriptionId);

                client.containerGroups.get(resourceGroup, containerGroupName)
                    .then(response => {
                        resolve(response.ipAddress.ip);
                    })
                    .catch(err => {
                        reject(err);
                    });
            });
    });
}

module.exports={
    getPublicIP
};