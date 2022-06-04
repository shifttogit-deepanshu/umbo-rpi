const express = require("express")
const app = express()
const { MongoClient } = require("mongodb")
var Gpio = require('onoff').Gpio; //include onoff to interact with the GPIO
var rain = new Gpio(23, 'out');
var cloud = new Gpio(24, 'out');

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
    res.send("Umbo Server! You shouldn't be Here!")
})



const uri = "mongodb+srv://projectumbo:deepa%40SH4040@cluster0.ja4hb.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri);

lightening_status = true

const simulateAsyncPause = (t) =>
  new Promise(resolve => {
    setTimeout(() => resolve(), t);
  });

  const lightening_on = ()=>new Promise((resolve,reject)=>{
    console.log("on")
    for (let i = 0; i < channel.count; i++) {
      colors[i] = "0xffffff";
    }
    ws2821x.render(); 
    resolve()
  })

const lightening_off = ()=>new Promise((resolve,reject)=>{
  console.log("off")
  for (let i = 0; i < channel.count; i++) {
    colors[i] = "0x000000";
  }
  ws2821x.render(); 
  resolve()
})


const lightening_final = ()=>new Promise((resolve,reject)=>{
  console.log("off")
  for (let i = 0; i < channel.count; i++) {
    colors[i] = "0x000000";
  }
  ws2821x.render(); 
  lightening_status = true
  resolve()
})


const lightening = async ()=>{
  if(lightening_status){
  lightening_status = false
  await lightening_off()
  await lightening_on()
  await simulateAsyncPause(Math.floor(Math.random() * 100))
  await lightening_off()
  await simulateAsyncPause(Math.floor(Math.random() * 50))
  await lightening_on()
  await simulateAsyncPause(Math.floor(Math.random() * 100))
  await lightening_off()
  await simulateAsyncPause(Math.floor(Math.random() * 50))
  await lightening_on()
  await simulateAsyncPause(Math.floor(Math.random() * 100))
  await lightening_off()
  await simulateAsyncPause(Math.floor(Math.random() * 200))
  await lightening_on()
  await simulateAsyncPause(Math.floor(Math.random() * 100))
  await lightening_final()
  await lightening_off()
}
  
}


// const lightening = ()=>{
//   setLightsAsync.then(res=>{
//     for (let i = 0; i < channel.count; i++) {
//       colors[i] = "0xffffff";
//     }    
//     ws2821x.render();
//   })
// }

let changeStream;
async function run() {
  try {
    await client.connect();
    console.log("onnected..")
    const database = client.db("weathers");
    const collection = database.collection("weathers");
    // open a Change Stream on the "haikus" collection
    changeStream = collection.watch();
    // set up a listener when change events are emitted
    changeStream.on("change", next => {
      // process any change event
        collection.findOne({_id:1},(error,result)=>{
          if(result.mode=="web"){   
            
            if(result.main=="Clear"){
              rain.writeSync(1)
              cloud.writeSync(1)
              for (let i = 0; i < channel.count; i++) {
                colors[i] = "0x" + rgbToHex(result.color_r) + rgbToHex(result.color_g) + rgbToHex(result.color_b);
              }
              ws2821x.render();
            }
            else if(result.main=="Drizzle"){
              rain.writeSync(1);
              cloud.writeSync(0)
              for (let i = 0; i < channel.count; i++) {
                colors[i] = "0x" + rgbToHex(result.color_r) + rgbToHex(result.color_g) + rgbToHex(result.color_b);
              }
              ws2821x.render();
            }
            else if(result.main=="Rain"){
              rain.writeSync(0);
              cloud.writeSync(1)
              lightening()             
            }
            else if(result.main=="Clouds"){
              rain.writeSync(1);
              cloud.writeSync(0)
              for (let i = 0; i < channel.count; i++) {
                colors[i] = "0x" + rgbToHex(result.color_r) + rgbToHex(result.color_g) + rgbToHex(result.color_b);
              }
              ws2821x.render();             
            }
            else if(result.main=="Thunder"){
              rain.writeSync(0);
              cloud.writeSync(0)
              lightening()                           
            }
            else{
              rain.writeSync(1)
              cloud.writeSync(1)
              for (let i = 0; i < channel.count; i++) {
                colors[i] = "0x" + rgbToHex(result.color_r) + rgbToHex(result.color_g) + rgbToHex(result.color_b);
              }
              ws2821x.render();
            }            
          }
          else if(result.mode=="Thunderstorm"){
            rain.writeSync(0);
            cloud.writeSync(0)
            lightening()             
          }
          else if(result.mode=="Rain"){
            rain.writeSync(0);
            cloud.writeSync(1)
            for (let i = 0; i < channel.count; i++) {
              colors[i] = "0x" + rgbToHex(result.lights_r) + rgbToHex(result.lights_g) + rgbToHex(result.lights_b);
            }
            ws2821x.render();
          }  
          else if(result.mode=="Clouds"){
            rain.writeSync(1);
            cloud.writeSync(0)
            for (let i = 0; i < channel.count; i++) {
              colors[i] = "0x" + rgbToHex(result.lights_r) + rgbToHex(result.lights_g) + rgbToHex(result.lights_b);
            }
            ws2821x.render();
          }     
        })        
      });

  } catch{
      err=>console.log("error.........",err)
  }
}
run().catch(console.log("error................."))

app.listen(port,()=>{
    console.log("App Listening on port http://localhost:"+port)
})


