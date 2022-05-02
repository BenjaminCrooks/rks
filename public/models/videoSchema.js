const mongoose = require("mongoose")

var videoSchema = new mongoose.Schema({
	videoid: String,
	studio: String,
	title: String,
	date: Date,
	featuring: Array,
	tags: Array,
	series: Array,
	filesize: Number,
	filetype: String,
	length: Number,
	framewidth: Number,
	frameheight: Number,
	framerate: Number,
	photos: Number,
	ffmpeg: Number,
	views: Array,
	creationdate: Date,
	watchlater: Date
}, {versionKey: false})

module.exports = mongoose.model("videos", videoSchema)