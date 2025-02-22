const {getAllQueues,getAllStatus,getAllJobs,addJob,deleteJob} = require('../Controllers/queueDetails')
function routers(app){
    app.route('/getAllQueues').get(getAllQueues)
    app.route('/getAllStatus').post(getAllStatus)
    app.route('/getAllJobs').post(getAllJobs)
    app.route('/addJob').post(addJob)
    app.route('/deleteJobs').post(deleteJob)
}
module.exports =routers