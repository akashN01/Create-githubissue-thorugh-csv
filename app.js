const express = require('express')
const bodyparser = require('body-parser')
const fs = require("fs");
const { parse } = require("csv-parse");
const axios = require('axios');
var mileStoneNumber = 0;
let csvData = []
fs.createReadStream("./strictmode.csv")
  .pipe(parse({ delimiter: ",", from_line: 2 }))
  .on("data", async function (row) {
    csvData.push(row[0].split(';'));
});

// var parser = parse({columns: true}, async function (err, records) {
// });

fs.createReadStream(__dirname+'/strictmode.csv').pipe(parser);

const app = express();
const port = 3000; 

/* * Initial setup start  */
app.use(express.static('./public'))
app.use(bodyparser.json())
app.use(
  bodyparser.urlencoded({
    extended: true,
  }),
)

// Initial page 
app.get(('/'), (req, res) => {
    console.log('-- listing port')
    res.sendFile(__dirname + '/index.html')
    
});

app.listen(port, () => {
    setTimeout(async() => {
        let i = 0
        while(csvData.length > i ){
            console.log('while loop -- : ', csvData[i])
            await createIssue(csvData[i])
            i ++
        }
    }, 4000);
})
/** Initial setup End  */

// Create issue in github 
async function createIssue(data) {
    return new Promise(async(resolve, reject) => {
       // Create Label 
       await createLabel(data);
       // Create Milestone
       let mileStone = await createMileStone(data);
       console.log('MileStone oout put : ', mileStone);
       if(mileStone.success && mileStone?.response?.number){
          console.log('MileStone configuration : ', mileStone?.response?.number);
          mileStoneNumber = mileStone.response.number;
       };
    
       // create issue 
        var payload = JSON.stringify({
        "title": data[0],
        "body": data[1],
        "milestone": mileStoneNumber,
        "labels": [data[2]]
        });
    
        var config = {
        method: 'post',
        url: 'https://api.github.com/repos/OWNER/REPO/issues',
        headers: { 
            'Accept': 'application/vnd.github+json', 
            'Authorization': 'Bearer <YOUR TOKEN>', 
            'Content-Type': 'application/json'
        },
        data : payload
        };
        await axios(config)
        .then(function (response) {
            console.log(JSON.stringify(response.data));
            resolve(true);
        })
        .catch(function (error) {
            console.log('mile stone ::: issue creation', JSON.stringify(error));
            resolve(false)
        });
    })
}

// Create MileStone in github 
function createMileStone(data) {
    return new Promise((resolve, reject) => {
        console.log('coming inside the create milestone : ',data[0])
        var payload = JSON.stringify({
            "title": data[4],
            "state": data[5],
            "description":data[6],
            "due_on": new Date(data[7]).toISOString()
        });
    
        var config = {
        method: 'post',
        url: 'https://api.github.com/repos/OWNER/REPO/milestones',
        headers: { 
            'Accept': 'application/vnd.github+json', 
            'Authorization': 'Bearer <YOUR TOKEN>', 
            'X-GitHub-Api-Version': '2022-11-28', 
            'Content-Type': 'application/json'
        },
        data : payload
        };
    
        axios(config)
        .then(function (response) {
            console.log(response.data);
            resolve({"success": true, "response": response.data})
        })
        .catch(function (error) {
            console.log('inside the -- createMileStone ')
            resolve({"success": false});
        }); 
    })
}
// Issue label creator 
function createLabel(data){
    return new Promise((resolve, reject) => {
        var payload = JSON.stringify({
            "name": data[2],
            "description": data[3],
            "color": getRandomColor()
        });

        var config = {
        method: 'post',
        url: 'https://api.github.com/repos/OWNER/REPO/labels',
        headers: { 
            'Authorization': 'Bearer <YOUR TOKEN>', 
            'Content-Type': 'application/json'
        },
        data : payload
        };

        axios(config)
        .then(function (response) {
            console.log(response.data);
            resolve({"success": true, "response": response.data})
        })
        .catch(function (error) {
            console.log('inside error  -- createLabel ')
            resolve({"success": false});
        }); 
    })
}

// Random color generator 
function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}