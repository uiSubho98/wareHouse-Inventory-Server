const express = require('express')
const app = express()
const cors = require('cors')
const port = process.env.PORT || 5000;
const jwt = require('jsonwebtoken')
require('dotenv').config()
app.use(express.json())
app.use(cors())

const { MongoClient, ServerApiVersion,ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.abiet.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try{
        await client.connect();
        console.log('db connected')
        const itemsCollection = client.db('warehouse').collection("items");
        const userCollection = client.db('warehouse').collection("user");
      //get all items
        app.get('/items',async(req,res)=>{
            const query={};
            const cursor = itemsCollection.find(query);
            const result = await cursor.toArray()
            res.send(result)
        })

        // get single Item
        app.get('/items/:id',async(req,res)=>{
          const id = req.params.id;
          const query = {_id:ObjectId(id)};
          const result= await itemsCollection.findOne(query);
          res.send(result)

        })


        // update single delivery Item
        app.put('/items/:id', async (req,res) => {
          const id = req.params.id
          const deliverQuantity = req.body
          const filter = {_id: ObjectId(id)}
          const options = { upsert: true };
          const updateDoc = {
            $set: {
              quantity: deliverQuantity.newQuantity
            }
          };
          const result = await itemsCollection.updateOne(filter, updateDoc, options)
          res.send(result)
          })



          //update single quantity Item
          app.put('/items/:id', async (req,res) => {
            const id = req.params.id
            const setQuantity = req.body
            const filter = {_id: ObjectId(id)}
            const options = { upsert: true };
            const updateDoc = {
              $set: {
                quantity: setQuantity.newQuantity
              }
            };
            const result = await itemsCollection.updateOne(filter, updateDoc, options)
            res.send(result)
            })

        //add item
        app.post('/items',async(req,res)=>{
          const newItem=req.body;
          const tokenDetail = req.headers.authorization;
         const [email,accessToken] = tokenDetail?.split(" ")
         const decoded = checkingToken(accessToken);
         console.log(decoded.email,email)
         if(email===decoded.email){
          const result = await itemsCollection.insertOne(newItem);
          res.send(result)
         }
         else{
           res.send({sucess:'UnAuthorized User'});
         }
        })


        //delete a item
        app.delete('/items/:id',async(req,res)=>{
          const id = req.params.id;
          const query = {_id:ObjectId(id)};
          const result= await itemsCollection.deleteOne(query);
          res.send(result)

        })

          //delete a item from userCollection
          app.delete('/user/:id',async(req,res)=>{
            const id = req.params.id;
            console.log(id)
            const query = {_id:ObjectId(id)};
            const result= await userCollection.deleteOne(query);
            res.send(result)
  
          })



        // post userItems
        app.post('/user',async(req,res)=>{
          const newItem=req.body;
          const tokenDetail = req.headers.authorization;
         const [email,accessToken] = tokenDetail?.split(" ")
         const decoded = checkingToken(accessToken);
         console.log(decoded.email,email)
         if(email===decoded.email){
          const result = await userCollection.insertOne(newItem);
          res.send(result)
         }
         else{
           res.send({sucess:'UnAuthorized User'});
         }
        })



        //get userEmail Items
        app.get('/user',async(req,res)=>{
        const tokenDetail= req.headers.authorization;
        const [email,accessToken]=tokenDetail.split(" ")
        const decoded = checkingToken(accessToken);
        // console.log(email,decoded.email )
        if(email === decoded.email){
          const userOrders=await userCollection.find({email:email}).toArray();
          res.send(userOrders)
        }
        else{
          res.send({success:'unauthorized access'})
        }
        })

        app.post('/login',(req,res)=>{
          const email = req.body;
          const token = jwt.sign(email, process.env.ACCESS_TOKEN_SECRET);
          res.send({token})
        })
    }
    finally{

    }
}
run().catch(console.dir)
  
  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })

  function checkingToken(token){
    let email;
    jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,function(err,decoded){
      if(err){
        email = 'Invalid Email'
      }
      if(decoded){
        email = decoded
      }
    })
    return email;
  }