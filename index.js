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
const insights = require("./public/routes/insights")
app.use("/videos", videos)
app.use("/insights", insights)


app.listen(1234, () => {
	console.log("\nRooks\nv1.0.2\n")
})



app.get("/", (req, res) => {
	res.render("baseline.ejs", {pageTitle: "The RKS Project"})
})



app.use(function(req, res, next) {
	console.log("Error 404 - Page not found")
	res.status(404).redirect("/")
})