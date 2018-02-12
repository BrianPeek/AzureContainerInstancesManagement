require('dotenv').config();
const ContainerInstanceManagementClient = require('azure-arm-containerinstance');
const WebSiteManagementClient = require('azure-arm-website');


const utilities = require('../functions/shared/utilities');

const deletehelpers = require('../functions/ACIDelete/deletehelpers');
const createhelpers = require('../functions/ACICreate/createhelpers');


function queryAppService(resourceGroup, credentials, subscriptionId) {
    let webSiteClient = new WebSiteManagementClient(credentials, subscriptionId);
    webSiteClient.webApps.listFunctionSecrets(resourceGroup, 'aci123', 'ACICreate').then(result => {
        console.log(result)
    }).catch(error => console.log(JSON.stringify(error)));

}


function listContainerGroups(credentials) {
    let client = new ContainerInstanceManagementClient(credentials, subscriptionId);
    client.containerGroups.list().then((containerGroups) => {
        console.log('List of containerGroups:');
        console.dir(containerGroups, {
            depth: null,
            colors: true
        });
    });
}


let body = {
    resourceGroup: "acitest123",
    containerGroupName: "cigroup",
    containerGroup : {
        location: "eastus",
        containers: [{
            name: "ciname",
            image: "dgkanatsios/simpleapp", 
            resources: {
                requests: {
                    memoryInGB: 0.5,
                    cpu: 0.5
                }
            },
            ports: [{
                protocol: 'TCP',
                port: 8080
            }]
        }],
        ipAddress: {
            ports: [{
                protocol: 'TCP',
                port: 8080
            }],
            type: 'Public'
        },
        osType: 'Linux',
    }
};


if (utilities.validatePostData(body)) {
    //createhelpers.createContainerGroup(body).then(() => createhelpers.insertIntoTable(body)).catch(error => console.log(error)).then(() => console.log('done'));
    deletehelpers.deleteContainerGroup(body).then(() => deletehelpers.setInTableAsDeleting(body)).catch(error => console.log(error)).then(() => console.log('Done'));
}