const azurestorage = require('../shared/external').azurestorage;
const constants = require('../shared/constants');
const monitorhelpers = require('./monitorhelpers');

//remember that process.env.AZURE_STORAGE_ACCOUNT and process.env.AZURE_STORAGE_ACCESS_KEY must be set with the correct values

const resourceGroupPattern = '\/resource[Gg]roups\/(.*?)\/';
const resourceIdPattern = '\/container[Gg]roups\/(.*?)$';

const tableName = constants.tableName;

function modifyTable(context, eventGridEvent) {
    return new Promise(function (resolve, reject) {
        const tableSvc = azurestorage.createTableService();
        tableSvc.createTableIfNotExists(tableName,
            function (error, result, response) {
                if (error) {
                    reject(error);
                } else {
                    //schema definitions https://docs.microsoft.com/en-us/azure/event-grid/event-schema-subscriptions
                    const resourceGroup = eventGridEvent.data.resourceUri.match(resourceGroupPattern)[1];
                    const resourceId = eventGridEvent.data.resourceUri.match(resourceIdPattern)[1];
                    const aciData = {
                        PartitionKey: resourceGroup,
                        RowKey: resourceId
                    };

                    if (eventGridEvent.eventType === 'Microsoft.Resources.ResourceWriteSuccess') { //ACI up and running
                        aciData.State = constants.runningState;
                        monitorhelpers.getPublicIP(resourceGroup, resourceId).then(ip => {
                            aciData.PublicIP = ip;
                            tableSvc.mergeEntity(tableName, aciData, function (error, result, response) {
                                if (error) {
                                    reject(error);
                                } else {
                                    resolve(`Updated ResourceGroup ${aciData.PartitionKey} and ID ${aciData.RowKey} and State ${aciData.State}`);
                                }
                            });
                        }).catch(err => reject(err));
                    } else if (eventGridEvent.eventType === 'Microsoft.Resources.ResourceWriteFailure' ||
                        eventGridEvent.eventType === 'Microsoft.Resources.ResourceWriteCancel') { //ACI creation failed
                        aciData.State = constants.failedState;
                        tableSvc.mergeEntity(tableName, aciData, function (error, result, response) {
                            if (error) {
                                reject(error);
                            } else {
                                resolve(`Updated ResourceGroup ${aciData.PartitionKey} and ID ${aciData.RowKey} and State ${aciData.State}`);
                            }
                        });
                    } else  {
                        //context.log(eventGridEvent);
                        resolve(`Event with type ${eventGridEvent.eventType} arrived and was unhandled`);
                    }
                }
            });
    });
}


module.exports = function (context, eventGridEvent) {
    //context.log(eventGridEvent);
    if (eventGridEvent.data.resourceProvider === 'Microsoft.ContainerInstance') {
        modifyTable(context, eventGridEvent).then(result => {
            context.log(result);
            context.done();
        }).catch(error => {
            context.log(error);
            context.done();
        });
    } else {
        context.log(`Received event from RP ${eventGridEvent.data.resourceProvider} was unhandled`);
        context.done();
    }
};