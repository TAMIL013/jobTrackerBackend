const {dynamoDB, dynamoDBDoc} =require('../DBConnection/dbConnection')
const config = require('../JSON/Config/config.json')
const { v4: uuid } = require('uuid');
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
const addJob = async function(request,response){
    try{
        let queue= request.body.queue_name;
        let type = request.body.type;
        let data = request.body.data;
        let run_at =request.body.run_at;
        let created_at=Math.floor(new Date().getTime()/1000);
        let updated_at=created_at;

        let today= new Date();
        today.setHours(0,0,0,0);
        let givenDate= new Date(run_at);
        run_at=Math.floor((new Date(run_at)).getTime() / 1000) ;
        givenDate.setHours(0,0,0,0);
        
        let status = today.getTime()===givenDate.getTime()? 'pending':'delayed';

        let params={
            TableName:queue,
            Item: {
                job_id: uuid(),        
                status: status,    
                type: type,        
                data: data,
                created_at: created_at,
                updated_at: updated_at
            }
        }
        await dynamoDB.put(params).promise()
        return response.status(200).send({
            message:'job added'
        })

    }catch(er){
        return response.status(500).send({
            error:er,
            message:'can\'t add job'
        })
    }
}
const deleteJob =async function(request,response){
    try{
        let queue= request.body.queue_name;
        let status = request.body.status;
        let jobIds = request.body.idList;
        while(jobIds.length){
            let ids= jobIds.splice(0,100) 
            let deletePromises=[]
            for(let id of ids){
                try{
                    let params={
                        TableName:queue,
                        Key:{
                            'status':status,
                            'job_id':id
                        }
                    }
                    await dynamoDB.delete(params).promise();
                    deletePromises.push(Promise.resolve(id))
                }catch(er){
                    deletePromises.push(Promise.reject(id))
                }
            }
            let failedItems=(await Promise.allSettled(deletePromises)).filter(item => item.status !='fulfilled').map(item => item.value)
            if(failedItems.length){
                return response.status(200).send({
                    failedItems:failedItems
                })
            }
        }
        return response.status(200).send({
            message:'job added'
        })
    }catch(er){
        return response.status(500).send({
            error:er,
            message:'can\'t add job'
        })
    }
}
module.exports = {getAllQueues,getAllStatus,getAllJobs,addJob,deleteJob}