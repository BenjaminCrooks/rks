const express = require("express")
const router = express.Router()

const bodyParser = require("body-parser")
const mongoose = require("mongoose")
const async = require("async")
const fs = require('fs')

router.use(bodyParser.json())
router.use(bodyParser.urlencoded({extended: true}))
router.use(express.static('public'))
router.use(express.static('F:\\'))

let videosModel = require("../models/videoSchema.js")



router.get("/", (req, res) => {
	async.parallel({
		// Collection Size - Total file size in bytes
		dataVideoSize: function(callback) {
			videosModel.aggregate([
				{$group: {_id: null, total: {$sum: "$filesize"}}}
			]).exec((err, results) => {
				callback(null, results[0].total)
			})
		},

		// Video Count - Total number of videos
		dataVideoCount: function(callback) {
			videosModel.countDocuments({}).exec(callback)
		},

		// Video Length - Total video length in seconds
		dataVideoLength: function(callback) {
			videosModel.aggregate([
				{$group: {_id: null, total: {$sum: "$length"}}}
			]).exec((err, results) => {
				callback(null, results[0].total)
			})
		},

		// Recorded Views - Total amount of views
		dataVideoViews: function(callback) {
			videosModel.aggregate([
				{$group: {_id: null, total: {$sum: {$size: "$views"}}}}
			]).exec((err, results) => {
				callback(null, results[0].total)
			})
		},

		// Story Mode Progress - Total amount of unique views
		dataVideoUniqueViews: function(callback) {
			videosModel.countDocuments({"views.0": {$exists: true}}).exec(callback)
		}
	}, (err, data) => {
		res.render("insights.ejs", {pageTitle: "Insights", data})
	})
})


module.exports = router