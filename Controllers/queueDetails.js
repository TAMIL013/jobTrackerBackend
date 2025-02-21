const {dynamoDB, dynamoDBDoc} =require('../DBConnection/dbConnection')
const config = require('../JSON/Config/config.json')

async function ensureQueueExist(tableNames){
    try {
        for(let queue of tableNames){
            const createParams = {
                TableName: queue,
                AttributeDefinitions: [
                  { AttributeName: "status", AttributeType: "S" }, 
                  { AttributeName: "job_id", AttributeType: "S" },
                ],
                KeySchema: [
                  { AttributeName: "status", KeyType: "HASH" }, 
                  { AttributeName: "job_id", KeyType: "RANGE" }, 
                ],
                ProvisionedThroughput: {
                  ReadCapacityUnits: 1, 
                  WriteCapacityUnits: 1, 
                },
              };
        
              // Create the table
              await dynamoDBDoc.createTable(createParams).promise();
              await dynamoDBDoc.waitFor("tableExists", { TableName: queue }).promise();
              console.log(`${queue} added and activated`)
        }
        const existingTables = await dynamoDBDoc.listTables().promise();
        return {
            status:true,
            queues:existingTables?.TableNames
        }
      } catch (error) {
        return{
            status:false,
            error:error
        }
      }
}
const getAllQueues = async function(request,response){
    try{
        const existingTables = await dynamoDBDoc.listTables().promise();
        const nonExistingQueues = config.queue_name.filter(queue => !existingTables?.TableNames.includes(queue))
        if(!nonExistingQueues.length){
           return response.status(200).send({
                queues:existingTables?.TableNames
            })
        }
        let res=await ensureQueueExist(nonExistingQueues)
        if(res.status){
           return response.status(200).send({
                queues:res.queues
            })
        }
        return response.status(500).send({
            message:'error in fetch all queues',
            error:res.error
        })
    }catch(err){
        console.log(err)
        response.status(500).send({
            err:err
        })
    }
}
const getAllStatus = async function(request,response){
    try{
       let queue= request.body.queue_name;
       console.log(queue)
       let lastEvaluatedKey= null
       let statusCount={}
       do{
           let params={
                TableName:queue,
                ProjectionExpression: "#status",
                ExpressionAttributeNames: {
                    "#status": "status",
                  },
           }
           if(lastEvaluatedKey) params['ExclusiveStartKey']=lastEvaluatedKey
           let result =await dynamoDB.scan(params).promise()
           lastEvaluatedKey=result.lastEvaluatedKey
           console.log('res',result.Items)
           result.Items.forEach((item) => {
            if (item.status) {
              statusCount[item.status] = (statusCount[item.status] || 0) + 1;
            }
          });
       }while(lastEvaluatedKey)
       return response.status(200).send({
            data:statusCount
        })
    }catch(err){
        console.log(err)
        response.status(500).send({
            err:err
        })
    }
}
const getAllJobs = async function(request,response){
    try{
       let queue= request.body.queue_name;
       let status= request.body.status;
       let lastEvaluatedKey= request.body.lastEvaluatedKey
       let limit= request.body.limit
        let params={
            TableName: queue,
            KeyConditionExpression: "#status = :status",
            Limit:limit,
            ExpressionAttributeValues: {
                ":status": status,
            },
            ExpressionAttributeNames: {
                "#status": "status",  
            },
            ProjectionExpression: "#status,#job_id, #type,#created_at,#updated_at",
            ExpressionAttributeNames: {
                "#status": "status",
                "#job_id": "job_id",
                "#type": "type",
                "#created_at": "created_at",
                "#updated_at": "updated_at",
            },
        }
        if(lastEvaluatedKey) params['ExclusiveStartKey']=lastEvaluatedKey
        let result =await dynamoDB.query(params).promise()
       return response.status(200).send({
            data:result.Items,
            lastEvaluatedKey:result.LastEvaluatedKey
        })
    }catch(err){
        console.log(err)
        response.status(500).send({
            err:err
        })
    }
}
module.exports = {getAllQueues,getAllStatus,getAllJobs}