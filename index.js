const express = require("express")
const app = express()
const { MongoClient } = require("mongodb")
var Gpio = require('onoff').Gpio; //include onoff to interact with the GPIO
var rain = new Gpio(23, 'out');
var cloud = new Gpio(24, 'out');
const red = new Gpio(5, 'out');
const green = new Gpio(6, 'out');
const blue = new Gpio(26, 'out');
var player = require('play-sound')(opts = {})
const {exec} = require('child_process')
const internetAvailable = require("internet-available");

runFlag = 0

const ws2821x = require('rpi-ws281x-native-fixed');
const options = {
  dma: 10,
  freq: 800000,
  gpio: 21,
  invert: false,
  brightness: 100,
  stripType: ws2821x.stripType.WS2812
};

const channel = ws2821x(300, options);
const colors = channel.array;

// update color-values

let audio = 0

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

const uri = "mongodb+srv://projectumbo:deepa%40SH4040@cluster0.ja4hb.mongodb.net?retryWrites=true&w=majority";
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
  
  if(audio){
    audio.kill()
  }

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
    audio = player.play('sounds/rain.wav', { timeout: 3000 }, function(err){
      if (err && !err.killed) {
        console.log("error here.............",err)
      }
    })    
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
    runFlag = 1
    await client.connect();
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
              if(audio){
                audio.kill()
              }
              rain.writeSync(1)
              cloud.writeSync(1)
              for (let i = 0; i < channel.count; i++) {
                colors[i] = "0x" + rgbToHex(result.color_r) + rgbToHex(result.color_g) + rgbToHex(result.color_b);
              }
              ws2821x.render();
            }
            else if(result.main=="Drizzle"){
              if(audio){
                audio.kill()
              }
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
            else if(result.main=="snow"){
              rain.writeSync(1);
              cloud.writeSync(0)
              lightening()             
            }
            else if(result.main=="Clouds"){
              if(audio){
                audio.kill()
              }
              rain.writeSync(1);
              cloud.writeSync(0)
              for (let i = 0; i < channel.count; i++) {
                colors[i] = "0x" + rgbToHex(result.color_r) + rgbToHex(result.color_g) + rgbToHex(result.color_b);
              }
              ws2821x.render();             
            }
            else if(result.main=="Thunderstorm"){
              rain.writeSync(0);
              cloud.writeSync(0)
              lightening()                           
            }
            else{
              if(audio){
                audio.kill()
              }
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
            if(audio){
              audio.kill()
            }
            rain.writeSync(0);
            cloud.writeSync(1)
            for (let i = 0; i < channel.count; i++) {
              colors[i] = "0x" + rgbToHex(result.lights_r) + rgbToHex(result.lights_g) + rgbToHex(result.lights_b);
            }
            ws2821x.render();
          }  
          else if(result.mode=="Clouds"){
            console.log(audio)
            if(audio){
              player.play()
            }
            rain.writeSync(1);
            cloud.writeSync(0)
            for (let i = 0; i < channel.count; i++) {
              colors[i] = "0x" + rgbToHex(result.lights_r) + rgbToHex(result.lights_g) + rgbToHex(result.lights_b);
            }
            ws2821x.render();
          
          }     
        })        
      })
      
const db = client.db("cred");
const collect = db.collection("cred")

changeStream_cred = collect.watch();
  // set up a listener when change events are emitted
  changeStream_cred.on("change", next => {
    if(next.updateDescription.updatedFields.newid || next.updateDescription.updatedFields.newpsk){
      collect.findOne({_id:1},(error,result)=>{
        const old_id = result.oldid
        const new_id = result.newid
        const old_psk = result.oldpsk
        const new_psk = result.newpsk
  
        const ssid_command = "sudo sed -i \'s/ssid=\"" + old_id + "\"/ssid=\"" + new_id + "\"/\' /etc/wpa_supplicant/wpa_supplicant.conf";
        const psk_command = "sudo sed -i \'s/psk=\"" + old_psk + "\"/psk=\"" + new_psk + "\"/\' /etc/wpa_supplicant/wpa_supplicant.conf";
  
        exec(ssid_command, function (msg) { 
        if(msg==null){
          console.log("ssid changed successfully")
          exec(psk_command, function (msgp) { 
            if(msgp==null){
            console.log("psk changed successfully")
              collect.updateOne({_id:1},{$set:{old_id:new_id,old_psk:new_psk}}).then(res=>{
                exec("sudo reboot",(mssgf)=>{
                console.log("rebooting...",mssgf)
              })
              }).catch(e=>{
                console.log(e)
              })              
            }
            else{
            console.log("execution failed",msg)
            }
          });
        }
        else{
          console.log("execution failed",msg)
        }
        })      
      })  
    }     
  })

  } catch{
    runFlag = 0
    err=>console.log("error.........",err)
  }
}
run().catch(e=>{
  console.log("error.................",e)
  run()
})



setInterval(()=>{
  internetAvailable({}).then((res) => {
    console.log("internet available..")
    if(client){   
      console.log("Connected to DB..")
      green.writeSync(1)
      red.writeSync(0)
      blue.writeSync(0)
      // Do nothing
      if(runFlag==0){
        run()
        green.writeSync(0)
        red.writeSync(0)
        blue.writeSync(1)
      }
    }
    else{      
      //Run run function
      console.log("No DB..")
      
    }
}).catch(e=>{
      green.writeSync(0)
      red.writeSync(1)
      blue.writeSync(0)
      console.log("Internet error..")
  })

},100)

app.listen(port,()=>{
    console.log("App Listening on port http://localhost:"+port)
})