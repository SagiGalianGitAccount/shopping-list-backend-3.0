const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')
const app = express()
const paypal = require('paypal-rest-sdk');
const corsOptions = {
    origin: 'https://stalwart-zuccutto-ff1300.netlify.app'
}
app.use(cors(corsOptions))
require('dotenv').config()

const PORT = 3001 || process.env.PORT

// paypal.configure({
//     'mode': 'sandbox', //sandbox or live
//     'client_id': process.env.CLIENT_ID_PAYPAL,
//     'client_secret': process.env.SECRET_PAYPAL
//   });

const uri = process.env.MONGODB_KEY
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 })

client.connect(err => {
    if (err){
        console.error('Failed to connect to MongoDB server', err);
    }else{
        console.log('Connected to MongoDB server');
        
    const collection = client.db("shopping-list").collection("lists")

    app.post('/addlist', (req, res) => {
        const listName = req.query.listName
        const listPassword = req.query.listPassword
        const listEmail = req.query.listEmail
        const listPhone = req.query.listPhone

        collection.insertOne({
            listName: listName,
            listPassword: listPassword,
            listEmail: listEmail,
            listPhone: listPhone,
            food: Array()
        }).then(result => {
            console.log(result)
            res.send("Added successfuly !")
        }).catch(err => {
            console.error(err)
            res.send("Could not add !") // 1981
        })
    })

    app.post("/sendPasswordToEmail", (req, res) => {
        const email = req.query.toMail
        const password = null;
        try{
            collection.findOne({listEmail: email}).then(result => {
                if (result){
                    collection.updateOne(
                        { _id: ObjectId(process.env.REQUESTS_ID) },
                        { $push: { requests:  email.toString() + " -> name: " + result.listName + ", password: " + result.listPassword.toString()} },
                        (err, result) => {
                        if (err) throw err;
                            console.log('added the email & password to the db under id ' + process.env.REQUESTS_ID);
                            res.send("success")
                        }
                    );
                }else{
                    res.send("not exist") // do not erase !!
                    console.log("user sent an email that is not exist in the db -> suggest him to create new account or help him according his phone number")
                }
            })
        }catch{
            res.send("error")
        }
    
    
    })

    app.get('/getlist', (req, res) => {
        const listName = req.query.listName
        const listPassword = req.query.listPassword 


        collection.findOne({
            listName: listName ,
            listPassword: listPassword
        }).then(result => {
            res.send(result)
            console.log(result)
        }).catch(err => {
            res.send("No user found")
        })

    })

    app.get('/getlistbyid', (req, res) => {
        const _id = req.query._id

        collection.findOne({
            _id: ObjectId(_id)
        }).then(result => {
            res.send(result)
            //console.log(result)
        }).catch(err => {
            res.send("Could not check for a user !")
        })

    })
    app.get('/getupdates', (req, res) => {
        collection.findOne({
            type: 'manager'
        }).then(result => {
            res.send(result.updates)
        })

    })


    app.post('/addfood', (req, res) => {
        console.log("adding food ")
        const _id = req.query._id
        const foodName = req.query.foodName
        const foodAmount = req.query.foodAmount
        const foodSection = req.query.foodSection
    // console.log(foodSection)

        collection.updateOne({_id: ObjectId(_id)}, {
            $push:{
                food:{
                    $each:[{
                        name: foodName,
                        amount: foodAmount,
                        section: foodSection,
                        foodId: new ObjectId()
                    }],
                    $position:0
                }
            }
        }).then(result => {
            console.log(`added ${foodName} => ${foodAmount} for id: ${_id}`)
            res.send("successfuly added !");
        }).catch(err => {
            console.log("Could not add !")
            res.send("Could not add !")
        })
    })

    app.post('/removefood', (req, res) => {
        const listId = req.query.listId
        const foodId = req.query.foodId

        collection.updateOne({_id: ObjectId(listId)}, {
            $pull: { 'food': { foodId: ObjectId(foodId) } }
        }).then(result => {
            console.log(result)
            res.send("item deleted !")
        }).catch(err => {
            console.error(err);
            res.send("Could not remove item !")
        })
    })


    app.post('/removeall', (req, res) => {
        const listId = req.query.listId

        collection.updateOne({_id: ObjectId(listId)}, {
            $set: { 'food': Array() }
        }).then(result => {
            console.log(result)
            res.send("All items deleted !")
        }).catch(err => {
            console.error(err);
            res.send("Could not remove items !")
        })
    })


    app.post('/changefoodamount', (req, res) => {
        const listId = req.query.listId
        const foodId = req.query.foodId
        const amount = req.query.foodAmount

        collection.updateOne({_id: ObjectId(listId)}, {
            $set: { 
                'food.$[elem].amount': Number(amount)
            }},
            { arrayFilters: [ { "elem.foodId": ObjectId(foodId) } ] })

        .then(result => {
            console.log(result)
            res.send("item deleted !")
        }).catch(err => {
            console.error(err);
            res.send("Could not remove item !")
        })
    })}
})

app.listen(PORT, () => {
    console.log(`[RUNNING] on port: ${PORT}`)
})