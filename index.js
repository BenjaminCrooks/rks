const express = require("express")
const app = express()

const bodyParser = require("body-parser")
const mongoose = require("mongoose")
const async = require("async")
const fs = require('fs')

mongoose.connect("mongodb://localhost:27017/mediaDatabase")

app.set("view engine", "ejs")
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))
app.use(express.static('public'))
app.use(express.static('F:\\'))


let videosModel = require("./public/models/videoSchema.js")


const videos = require("./public/routes/videos")
app.use("/videos", videos)


app.listen(1234, () => {
	console.log("\nRooks\nv1.0.3\n")
})



app.get("/", (req, res) => {
	res.render("baseline.ejs", {pageTitle: "The RKS Project"})
})