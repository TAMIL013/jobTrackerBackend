const {getAllQueues,getAllStatus,getAllJobs} = require('../Controllers/queueDetails')
function routers(app){
    app.route('/getAllQueues').get(getAllQueues)
    app.route('/getAllStatus').post(getAllStatus)
    app.route('/getAllJobs').post(getAllJobs)
}
module.exports =routers