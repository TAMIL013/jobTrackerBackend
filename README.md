### Job Tracker App - API Endpoints & Functionality

Integrate the following API routes to manage queues, job statuses, and job operations effectively:  

---
`getAllQueues`
- **Purpose**: Fetch all queues from the database.  
- **Additional Logic**: If a queue is not present in the configuration file, create it automatically.  
- Response: Returns a list of all queues.  

---

`getAllStatus` 
- **Purpose**: Fetch the status breakdown of jobs in a specific queue, including job count for each status.  
- **Request Parameters**:  
  - `queue_name` (required) – The name of the queue.  
- **Response**: A list of status with job counts.  

---

`getAllJobs`
- **Purpose**: Retrieve a list of jobs from a specific queue, filtered by status.  
- **Request Parameters**:  
  - `queue_name` (required) – The name of the queue.  
  - `status` (required) – The job status (e.g., `pending`, `active`, etc.).  
  - `limit` (required) - size of the job list
  - `lastEvaluatedKey` - starting of the item for dynamoDB
- **Response**: A paginated list of jobs matching the filters.  

---
`/addJob` 
- **Purpose**: Add a new job to a queue.  
- **Request Body**:  
  - `type` (required) – The job type.  
  - `data` (required) – Job-specific data.  
  - `run_at` (optional) – If provided, determines when the job should run.  
- **Logic**:  
  - If `run_at` is in the future, the job's statusis set to `"delayed"`.  
  - Otherwise, the job's status is set to `"pending"`.  

---

`deleteJob`
- **Purpose**: Delete multiple jobs from a queue.  
- **Request Body**:  
  - `job_ids` (required) – An array of job IDs to be deleted.  
  - `queue_name` (required) – The queue from which jobs should be removed.  
  - `status` (required) – The current status of the jobs to delete.  
- **Response**: Success message with the number of jobs deleted.  

---