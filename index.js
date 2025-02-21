const express = require('express')
const routers =require('./Router/router')
var cors = require('cors')
const app= express()
const PORT=3000

app.use(express.json())
app.use(cors())
routers(app)

app.listen(PORT,()=>{
    console.log('listen on',PORT)
})