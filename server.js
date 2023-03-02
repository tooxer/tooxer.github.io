const express = require("express");
const app = express();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const fetch = require('node-fetch');
const { stringify } = require('querystring');
var crypto = require('crypto');
const date = require('date-and-time');
let alert = require('alert');

const PORT = process.env.PORT || 3000;

const now = new Date();
const pattern = date.compile('YYYY/MM/DD HH:mm:ss');

//create a data schema
const  mainSchema = {
    _id: String,
    username: String,
    email_address: String,
    rating: Number,
    time_created: String,
    timestamp_created: String,
    processed: Boolean,
    last_updated: String,
    last_timestamp_updated: String,
    ip_address: String,
    num_updated: Number,
    num_searched: Number,
    username_visible: Boolean
}

//create a data schema
const  subSchema = {
    _id: String,
    email_address: String,
    time_created: String,
    timestamp_created: String
}

const Main = mongoose.model("Main", mainSchema);

const Training_usrs = mongoose.model("training_data", mainSchema, "training_data");

const Sub = mongoose.model("Sub", subSchema);

// Function to serve all static files
// inside public directory.
app.use(express.static('public'));
app.use('/assets', express.static('assets'));

app.use(express.json());

app.use(bodyParser.urlencoded({extended: false}));

app.engine('html', require('ejs').renderFile);

mongoose.connect("mongodb+srv://test:test@cluster0.tg7xw.mongodb.net/main_db", { useNewUrlParser: true }, { useUnifiedTopology: true }, { useUnifiedTopology: true })

app.get("/", function (req, res){
    var trusted_number_index = 0;
    var trusted_sign_index = "+";
    var dataset_number_index = 0;
    var dataset_sign_index = "+";
    Main.count({}, function( err, trusted_number){
        console.log( "Number of users:", trusted_number );
        trusted_number = trusted_number + 28962
        if (trusted_number >= 1000){
            trusted_number = Math.round(trusted_number / 1000)
            trusted_sign = "K+"
        }
        else if (trusted_number >= 1000000){
            trusted_number = Math.round(trusted_number / 1000000)
            trusted_sign = "M+"
        }
        else {
            trusted_sign = "+"
        }
        trusted_number_index = trusted_number;
        trusted_sign_index = trusted_sign;
    })

    Training_usrs.count({}, function( err, dataset_number){
        console.log( "Number of users in dataset:", dataset_number );
        if (dataset_number >= 1000){
            dataset_number = Math.round(dataset_number / 1000)
            dataset_sign = "K+"
        }
        else if (dataset_number >= 1000000){
            dataset_number = Math.round(dataset_number / 1000000)
            dataset_sign = "M+"
        }
        else {
            dataset_sign = "+"
        }
        dataset_number_index = dataset_number;
        dataset_sign_index = dataset_sign;
        res.render(__dirname + "/index.html", {trusted_number: trusted_number_index,
                                                            trusted_sign: trusted_sign_index,
                                                            dataset_number: dataset_number_index,
                                                            dataset_sign: dataset_sign_index})
    })

})


app.get("/terms", function (req, res){
    res.render(__dirname + "/terms.html")
})

app.get("/privacy-policy", function (req, res){
    res.render(__dirname + "/privacy.html")
})


app.post("/submit", (req, res) => {
    const name = req.body.name;
    const response_key = req.body["g-recaptcha-response"];
    const secret_key = "6LeLsBccAAAAAARGn1aJi1FKCURC3bRDD3dvPCr8";

    const url =
        `https://www.google.com/recaptcha/api/siteverify?secret=${secret_key}&response=${response_key}`;

    fetch(url, {
        method: "post",
    })
        .then((response) => response.json())
        .then((google_response) => {
            if (google_response.success == true) {
                username = (req.body.request_username).toLowerCase();
                email_address = (req.body.request_email).toLowerCase();


                Main.findOne({ 'username': username , 'username_visible': true}, function (err, response_data) {
                    if (err) {
                        // console.log("There was an error connecting to the database")
                        res.render(__dirname + "/error.html",
                            {error_title: "Error!",
                                error_text: "There was an issue in your request!",
                                error_info: "Please try again later.",
                                error_img: "assets/images/error2.svg"});
                    }
                    else{
                        if (response_data === null){
                            // console.log("Could not find the data in database")
                            var username_hash = crypto.createHash('md5').update(username).digest('hex');
                            let newMain = new Main({
                                _id: username_hash,
                                username: username.toLowerCase(),
                                email_address: email_address,
                                rating: Math.round(getRandomArbitrary(1, 10)),
                                time_created: date.format(now, pattern),
                                timestamp_created: Date.now().toString(),
                                processed: false,
                                last_updated: date.format(now, pattern),
                                last_timestamp_updated: Date.now().toString(),
                                ip_address: req.ip,
                                num_updated: 1,
                                num_searched: 0,
                                username_visible: true
                            });
                            newMain.save();
                            console.log("User added to the database")
                            res.render(__dirname + "/submit.html", {name: (req.body.request_username).toUpperCase()});
                        }
                        else{
                            console.log("We have the username in our database");
                            if (response_data['processed'] === true){
                                email_address = response_data['email_address']
                                rating = response_data['rating']

                                console.log(email_address)
                                let rating_img;
                                if (rating === 1) {rating_img = "assets/images/ranking/rank_1.svg"}
                                else if (rating === 2) {rating_img = "assets/images/ranking/rank_2.svg"}
                                else if (rating === 3) {rating_img = "assets/images/ranking/rank_3.svg"}
                                else if (rating === 4) {rating_img = "assets/images/ranking/rank_4.svg"}
                                else if (rating === 5) {rating_img = "assets/images/ranking/rank_5.svg"}
                                else if (rating === 6) {rating_img = "assets/images/ranking/rank_6.svg"}
                                else if (rating === 7) {rating_img = "assets/images/ranking/rank_7.svg"}
                                else if (rating === 8) {rating_img = "assets/images/ranking/rank_8.svg"}
                                else if (rating === 9) {rating_img = "assets/images/ranking/rank_9.svg"}
                                else {rating_img = "assets/images/ranking/rank_10.svg"}
                                res.render(__dirname + "/search.html", {username: search_text.toUpperCase(), rating_img: rating_img});
                            }
                            else {
                                res.render(__dirname + "/error.html",
                                    {error_title: "",
                                        error_text: "We are still processing the data, please try again later!",
                                        error_info: "Please contact support@piveez.com if you see the same page for more than 48 hours.",
                                        error_img: "assets/images/error_process.svg"});
                            }

                            Main.updateOne({_id: response_data['_id']}, {
                                num_searched: (response_data['num_searched'] + 1)
                            }, function(err, affected, resp) {
                                console.log(resp);
                            })

                        }
                    }
                })


            } else {
                res.render(__dirname + "/error.html",
                    {error_title: "Error!",
                        error_text: "Please show us you are a human!",
                        error_info: "Please make sure you are marking reCaptcha",
                        error_img: "assets/images/error2.svg"});

            }
        })
        .catch((error) => {
            res.render(__dirname + "/error.html",
                {error_title: "Error!",
                    error_text: "Please show us you are a human!",
                    error_info: "Please make sure you are marking reCaptcha",
                    error_img: "assets/images/error2.svg"});



        });
});

app.post("/subscribe", function (req,res){
    email_address = (req.body.subscribe_email).toLowerCase();
    var email_address_hash = crypto.createHash('md5').update(email_address).digest('hex');
    Sub.findOne({ '_id': email_address_hash }, function (err, response_data) {
        if (err) {
            // console.log("There was an error connecting to the database")
            res.render(__dirname + "/error.html",
                {error_title: "Error!",
                        error_text: "There was an issue in your request!",
                        error_info: "Please try again later.",
                        error_img: "assets/images/error2.svg"});
        }
        else{
            if (response_data === null){
                // console.log("Could not find the data in database")
                let newSub = new Sub({
                    _id: email_address_hash,
                    email_address: email_address,
                    time_created: date.format(now, pattern),
                    timestamp_created: Date.now().toString()
                });
                newSub.save();
                res.redirect("/");
            }
            else{
                res.redirect("/");
            }
        }
    })
})

app.post("/search", function (req,res){
    search_text = (req.body.search_text).toLowerCase();
    Main.findOne({ 'username': search_text , 'username_visible': true}, function (err, response_data) {
        if (err) {
            res.render(__dirname + "/error.html",
                {error_title: "Error!",
                        error_text: "We couldn't find the requested profile in our database!",
                        error_info: "",
                        error_img: "assets/images/error2.svg"});
        }
        else{
            if (response_data === null){
                // console.log("Could not find the data in database")
                res.render(__dirname + "/error.html",
                    {error_title: "Error!",
                        error_text: "We couldn't find the requested profile in our database!",
                        error_info: "",
                        error_img: "assets/images/error2.svg"});
            }
            else{
                console.log("We have the username in our database");
                if (response_data['processed'] === true){
                    email_address = response_data['email_address']
                    rating = response_data['rating']
                    console.log(email_address)
                    let rating_img;
                    if (rating === 1) {rating_img = "assets/images/score/score-1.svg"}
                    else if (rating === 2) {rating_img = "assets/images/score/score-2.svg"}
                    else if (rating === 3) {rating_img = "assets/images/score/score-3.png"}
                    else if (rating === 4) {rating_img = "assets/images/score/score-4.svg"}
                    else if (rating === 5) {rating_img = "assets/images/score/score-5.svg"}
                    else if (rating === 6) {rating_img = "assets/images/score/score-6.svg"}
                    else if (rating === 7) {rating_img = "assets/images/score/score-7.svg"}
                    else if (rating === 8) {rating_img = "assets/images/score/score-8.svg"}
                    else if (rating === 9) {rating_img = "assets/images/score/score-9.svg"}
                    else {rating_img = "assets/images/score/score-10.svg"}
                    res.render(__dirname + "/search.html", {username: search_text.toUpperCase(), rating_img: rating_img});
                }
                else {
                    res.render(__dirname + "/error.html",
                        {error_title: "",
                            error_text: "We are still processing the data, please try again later!",
                            error_info: "Please contact support@piveez.com if you see the same page for more than 48 hours.",
                            error_img: "assets/images/error_process.svg"});
                }

                Main.updateOne({_id: response_data['_id']}, {
                    num_searched: (response_data['num_searched'] + 1)
                }, function(err, affected, resp) {
                    console.log(resp);
                })

            }
        }
    })
})

// This will handle 404 requests.
app.use("*",function(req,res) {
    res.render(__dirname + "/error.html",
        {error_title: "Error!",
            error_text: "We couldn't find the requested page!",
            error_info: "",
            error_img: "assets/images/error2.svg"});
})

app.listen(PORT, function(){
    console.log("Server is running on ${PORT}!")
})

function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}