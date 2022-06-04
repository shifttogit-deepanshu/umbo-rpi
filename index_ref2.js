const express = require("express")
const app = express()
const { MongoClient } = require("mongodb")
var Gpio = require('onoff').Gpio; //include onoff to interact with the GPIO
var relay1 = new Gpio(23, 'out');
var relay2 = new Gpio(24, 'out');


const ws2821x = require('rpi-ws281x-native-fixed');
const options = {
  dma: 10,
  freq: 800000,
  gpio: 18,
  invert: false,
  brightness: 100,
  stripType: ws2821x.stripType.WS2812
};

const channel = ws2821x(290, options);
const colors = channel.array;

// update color-values

var rgbToHex = function (rgb) { 
        var hex = Number(rgb).toString(16);
        if (hex.length < 2) {
             hex = "0" + hex;
        }
        return hex;
      };


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
      if(next.updateDescription.updatedFields.status==false){
        console.log(".............",next.updateDescription.updatedFields.status)
        relay1.writeSync(0); 
	      relay2.writeSync(0); 
      }

      if(next.updateDescription.updatedFields.status==true){
        console.log(".............",next.updateDescription.updatedFields.status)
        relay1.writeSync(1); 
	      relay2.writeSync(1); 
      }


      if(next.updateDescription.updatedFields){
        collection.findOne({_id:1},(error,result)=>{
                if(result){
                  console.log("0x" + rgbToHex(result.lights_r) + rgbToHex(result.lights_g) + rgbToHex(result.lights_b))
                        for (let i = 0; i < channel.count; i++) {
                                colors[i] = "0x" + rgbToHex(result.lights_r) + rgbToHex(result.lights_g) + rgbToHex(result.lights_b);
                        }
                        ws2821x.render();
                }
        })
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


