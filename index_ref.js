// const express = require("express")
// const app = express()
const express = require("express")
const app = express()
const { MongoClient } = require("mongodb")
var Gpio = require('onoff').Gpio; //include onoff to interact with the GPIO
var relay1 = new Gpio(23, 'out'); //use GPIO pin 4, and specify that it is output
var relay2 = new Gpio(24, 'out'); 
// const port = process.env.PORT || 3000


// app.get("/",(req,res)=>{
//     res.send("Hello !")
//     console.log("hw!")
// })


// app.get("/onLED",(req,res)=>{
//     LED.writeSync(1); 
//     console.log("Led turned on....")
//     res.send({status:"LED turned on"})
// })

// app.get("/offLED",(req,res)=>{
//     LED.writeSync(0); 
//     console.log("Led turned on....")
//     res.send({status:"LED turned on"})
// })

// app.listen(port,()=>{
//     console.log("listening..........")
// })



const port = process.env.PORT || 3000

app.get("/",(req,res)=>{
    console.log("Hello World!")
    res.send("Hello World")
})


const uri = "mongodb+srv://umbotest:deepanshu1341@cluster0.2siho.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri);

// const simulateAsyncPause = () =>
//   new Promise(resolve => {
//     setTimeout(() => resolve(), 1000);
//   });

let changeStream;
async function run() {
  try {
    await client.connect();
    const database = client.db("test");
    const collection = database.collection("lights");
    // open a Change Stream on the "haikus" collection
    changeStream = collection.watch();
    // set up a listener when change events are emitted
    changeStream.on("change", next => {
      // process any change event
      console.log("received a change to the collection: \t", next);

      if(next.updateDescription.updatedFields.status){
        relay1.writeSync(1); 
        relay2.writeSync(1);
      }
      else{
        relay1.writeSync(0); 
        relay2.writeSync(0);
      }
    });
  } catch{
      err=>console.log("error.........",err)
  }
}
run().catch(console.dir);


app.listen(port,()=>{
    console.log("App Listening on port http://localhost:"+port)
})