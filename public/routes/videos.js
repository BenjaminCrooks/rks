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



const videosPerPage = 30

function pagination(req, page, docs) {
	/**
	 * Determines the pagination navigation options relative to a given page number
	 * 
	 * @param {Object} req
	 * @param {number} page - Current page number
	 * @param {array} docs - Video documents
	 * @returns {Object} - Contains the total page count for the MongoDB query, the array of pages to be displayed in the pagination navigation bar, and the page's url
	 */

	let pageCount = Math.ceil((docs[0].videoCount[0].count)/videosPerPage),
			pageArray = [page-3, page-2, page-1, page, page+1, page+2, page+3],
			iterablePages = [page-3, page-2, page-1, page, page+1, page+2, page+3],
			url = req.protocol + '://' + req.get('host') + req.originalUrl

	if (page == 1 && !url.includes("p=") && Object.keys(req.query).length == 0) {
		url = url + "?p=1"
	} else if (page == 1 && !url.includes("p=") && Object.keys(req.query).length > 0) {
		url = url + "&p=1"
	}

	iterablePages.forEach(function(i) {
		if (i < 1) {
			pageArray.splice(pageArray.indexOf(i), 1)
			let next = pageArray[pageArray.length - 1] + 1
			if (next <= pageCount) {pageArray.push(next)}
		} else if (i > pageCount) {
			pageArray.splice(pageArray.indexOf(i), 1)
			let next = pageArray[0] - 1
			if (next > 0) {pageArray.unshift(next)}
		}
	})

	return {pageCount, pageArray, url}
}

function volatileFacet(page, sortVar, sortOrder) {
	/**
	 * Reduces aggregation redundancy within the routing code by filling in volatile attributes
	 * 
	 * @param {string} page - Current page number from req.query
	 * @param {string} sortVar - Desired attribute to be used when sorting the video aggregation
	 * @param {number} sortOrder - Ascending/descending
	 * @returns {Object} - Contains the current page number as an integer and the constructed aggregation that enables pagination
	 */

	if (page === undefined) {page = 1}
	if (sortVar === undefined) {sortVar = "date"}
	page = parseInt(page)
	
	let facetAggregation = {
		$facet: {
			"videos": [
				{$sort: {[sortVar]: sortOrder, "_id": 1}},
				{$skip: (parseInt(page) - 1) * videosPerPage},
				{$limit: videosPerPage},
				{$set: {views: {$reverseArray: "$views"}}},
				{$project: {videoid: 1, date: 1, featuring: 1, length: 1, filesize: 1, framewidth: 1, frameheight: 1, views: 1, creationdate: 1, watchlater: 1}}
			],
			"videoCount": [{$count: "count"}]
		}
	}

	return {page, facetAggregation}
}

function vidRes(frameWidth) {
	/**
	 * Assigns a respective abbreviation for a given resolution size
	 * Called in the displayAttrs() function
	 * 
	 * @param {number} frameWidth
	 * @returns {string} - Abbreviated resolution term
	 */

  let resolution

  if (frameWidth >= 3800) {
    resolution = "4K"
  } else if (frameWidth >= 3000) {
    resolution = "QHD+"
  } else if (frameWidth >= 2000) {
    resolution = "QHD"
  } else if (frameWidth >= 1800) {
    resolution = "1080p"
  } else if (frameWidth >= 1000) {
    resolution = "720p"
  } else if (frameWidth < 1000) {
    resolution = "SD"
  }

  return resolution
}

function vidLength(milliseconds) {
	/**
	 * Formats a given millisecond integer into a readable form
	 * Called in the displayAttrs() function
	 * 
	 * @param {number} milliseconds
	 * @returns {string} - Milliseconds as HOUR:MINUTE:SECOND
	 */

	let lengthArray = [(milliseconds/(3600000))%24, (milliseconds/(60000))%60, (milliseconds/1000)%60]
	lengthArray.forEach(function(element, index) {
		lengthArray[index] = String(Math.floor(element)).padStart(2, "0")
	})
  
  return lengthArray.join(":")
}

function dateString(isTime, dateInput) {
	/**
	 * Formats a date object into a readable form
	 * Called in the function displayAttrs()
	 * 
	 * @param {boolean} isTime - Whether the formatted date output should include the time of day
	 * @param {Object} dateInput - Date object
	 * @returns {string} - Date as HOUR:MINUTE AM/PM MONTH DAY, YEAR
	 */

	if (dateInput === undefined) {
		return undefined
	} else {
		date = dateInput.toLocaleDateString("en-US", {timeZone: "UTC", month: "long", day: "numeric", year: "numeric"})
		if (isTime === true) {
			let hour = dateInput.getHours(), minute = dateInput.getMinutes(), ampm = "AM"
			if (hour >= 12) { ampm = "PM" }
			hour = hour % 12
			if (hour == 0) { hour = 12 }
			if (minute < 10) { minute = "0" + minute }
			date = hour + ":" + minute + " " + ampm + " " + date
		}
		
		return date
	}
}

function displayAttrs(doc) {
	/**
	 * Iteratively augments attributes into readable formats for a given array of video documents
	 * 
	 * @param {Object} doc - Video document
	 * @returns {Object} - Video document
	 */

	doc.date = dateString(false, doc.date)
	doc.resolution = vidRes(doc.framewidth)
	doc.ms = doc.length
	doc.length = vidLength(doc.length)
	doc.filesize = (doc.filesize%1000000000000/1000000000).toFixed(2) + "gb" // 1 gb = 1073741824 byte?
	doc.creationdate = dateString(true, doc.creationdate)
	doc.views = doc.views.map(function(element) {
		return dateString(true, element)
	})
	// watchlater
	
	return doc
}



router.get("/all", (req, res) => {
	let {page, facetAggregation} = volatileFacet(req.query.p, "date", -1)

	videosModel.aggregate([
		facetAggregation
	]).exec((err, docs) => {
		if (err) {
			console.log("Error 404 - Page not found\n\tCode 042")
			res.status(404).redirect("/")
		} else if (docs[0].videos.length == 0) {
			console.log("Error 204 - No content found; 0 documents matched the parameters\n\tCode 021")
			res.status(204).redirect("/")
		} else if (docs[0].videos.length > 0) {
			let {pageCount, pageArray, url} = pagination(req, page, docs)
			res.render("video-gallery.ejs", {videos: docs[0].videos.map(function(element) {return displayAttrs(element)}), pageTitle: "All Videos", page, pageCount, pageArray, url})
		}
	})
})


router.get("/new", (req, res) => {
	let {page, facetAggregation} = volatileFacet(req.query.p, "creationdate", -1)

	videosModel.aggregate([
		facetAggregation
	]).exec((err, docs) => {
		if (err) {
			console.log("Error 404 - Page not found\n\tCode 043")
			res.status(404).redirect("/")
		} else if (docs[0].videos.length == 0) {
			console.log("Error 204 - No content found; 0 documents matched the parameters\n\tCode 022")
			res.status(204).redirect("/")
		} else if (docs[0].videos.length > 0) {
			let {pageCount, pageArray, url} = pagination(req, page, docs)
			res.render("video-gallery.ejs", {videos: docs[0].videos.map(function(element) {return displayAttrs(element)}), pageTitle: "New Videos", page, pageCount, pageArray, url})
		}
	})
})


router.get("/top", (req, res) => {
	let {page, facetAggregation} = volatileFacet(req.query.p, "viewcount", -1)

	videosModel.aggregate([
		{$set: {viewcount: {$size: "$views"}}},
		{$match: {viewcount: {$gt: 1}}},
		facetAggregation
	]).exec((err, docs) => {
		if (err) {
			console.log("Error 404 - Page not found\n\tCode 044")
			res.status(404).redirect("/")
		} else if (docs[0].videos.length == 0) {
			console.log("Error 204 - No content found; 0 documents matched the parameters\n\tCode 023")
			res.status(204).redirect("/")
		} else if (docs[0].videos.length > 0) {
			let {pageCount, pageArray, url} = pagination(req, page, docs)
			res.render("video-gallery.ejs", {videos: docs[0].videos.map(function(element) {return displayAttrs(element)}), pageTitle: "Top Videos", page, pageCount, pageArray, url})
		}
	})
})


router.get("/watch-later", (req, res) => {
	let {page, facetAggregation} = volatileFacet(req.query.p, "watchlater", -1)

	videosModel.aggregate([
		{$match: {watchlater: {$ne: null}}},
		facetAggregation
	]).exec((err, docs) => {
		if (err) {
			console.log("Error 404 - Page not found\n\tCode 045")
			res.status(404).redirect("/")
		} else if (docs[0].videos.length == 0) {
			console.log("Error 204 - No content found; 0 documents matched the parameters\n\tCode 024")
			res.status(204).redirect("/")
		} else if (docs[0].videos.length > 0) {
			let {pageCount, pageArray, url} = pagination(req, page, docs)
			res.render("video-gallery.ejs", {videos: docs[0].videos.map(function(element) {return displayAttrs(element)}), pageTitle: "Watch Later", page, pageCount, pageArray, url})
		}
	})
})



router.get("/search-advanced", (req, res) => {
	res.render("search.ejs", {pageTitle: "Advanced Search"})
})


router.get("/search", (req, res) => {
	if ((Object.keys(req.query).length === 0) || (Object.keys(req.query).length === 1 && req.query.p !== undefined)) {
		console.log("Error 404 - No content found; 0 query parameters given\n\tCode 047")
		res.status(404).redirect("/videos/all")
	} else {
		let rq = req.query
				

		let aggrMatch = []

		if (rq.studio !== undefined) { aggrMatch.push({studio: {$in: rq.studio.split("+")}}) }
		if (rq.title !== undefined) { aggrMatch.push({title: new RegExp(rq.title, "i")}) }
		if (rq.featuring !== undefined) { aggrMatch.push({featuring: {$in: rq.featuring.split("+").map(function(element) {return new RegExp(element, "i")})}}) }
		if (rq.tags !== undefined) { aggrMatch.push({tags: {$all: rq.tags.split("+")}}) }
		if (rq.filetype !== undefined) { aggrMatch.push({filetype: {$in: rq.filetype.split("+")}}) }
		// qLength = { $and: [ {length: {$gte: qMinLength}}, {length: {$lte: qMaxLength}} ] }
		// qFrameRate = { $and: [ {framerate: {$gte: qMinFrameRate}}, {framerate: {$lte: qMaxFrameRate}} ] }
		// qViews = { $and: [ {viewcount: {$gte: qMinViews}}, {viewcount: {$lte: qMaxViews}} ] } // {viewcount: qViewCount}   OR   min = max
		if (rq.watchlater !== undefined) { aggrMatch.push({watchlater: {$ne: null}}) }

		


		let {page, facetAggregation} = volatileFacet(req.query.p, rq.order, -1)

		let aggrPipeline = [
			{$set: {
				viewcount: {$size: "$views"},
				datelastview: {$arrayElemAt: ["$views", -1]}
			}},
			{$match: {$and: aggrMatch}}
		]

		if (rq.random !== undefined) { aggrPipeline.push({$sample: {size: parseInt(rq.random)}}) }
		aggrPipeline.push(facetAggregation)

		videosModel.aggregate(aggrPipeline).exec((err, docs) => {
			if (err) {
				console.log("Error 404 - Page not found\n\tCode 048")
				res.status(404).redirect("/")
			} else if (docs[0].videos.length == 0) {
				console.log("Error 204 - No content found; 0 documents matched the parameters\n\tCode 026")
				res.status(204).redirect("/")
			} else {
				let {pageCount, pageArray, url} = pagination(req, page, docs)
				// searchResults: docs[0].videoCount[0].count
				console.log("Search results: " + docs[0].videoCount[0].count)
				res.render("video-gallery.ejs", {videos: docs[0].videos.map(function(element) {return displayAttrs(element)}), pageTitle: "Search Results", page, pageCount, pageArray, url})
			}
		})
	}
})



router.get("/:objectid", (req, res) => {
	let objectid = new mongoose.Types.ObjectId(req.params.objectid)

	async.waterfall([
		function (callback) {
			videosModel.findOne({_id: objectid}).exec((err, doc) => {
				callback(null, doc)
			})
		},

		function (doc, callback) {
			fs.readdir("F://" + doc.videoid + "/images", (err, images) => {
				if (err) {
					callback(null, doc, null)
				} else {
					images.sort(function(a, b) {return parseInt(a.replace("image_", "")) - parseInt(b.replace("image_", ""))})

					images = images.map(function(element, index, array) {
						return [doc.videoid, "images", element].join("/")
					})

					callback(null, doc, images)
				}
			})
		},

		function (doc, images, callback) {
			fs.readdir("F://" + doc.videoid + "/ffmpeg", (err, ffmpeg) => {
				if (err) {
					callback(null, doc, images, null)
				} else {
					ffmpeg.sort(function(a, b) {return parseInt(a.replace("image_", "")) - parseInt(b.replace("image_", ""))})

					ffmpeg = ffmpeg.map(function(element, index, array) {
						return [
							[doc.videoid, "ffmpeg", element].join("/"),
							vidLength(Math.round((index + 1) * (doc.length / array.length)))
						]
					})

					callback(null, doc, images, ffmpeg)
				}
			})
		}
	], (err, doc, images, ffmpeg) => {
		res.render("video-document.ejs", {
			date: dateString(false, doc.date),
			filesize: (doc.filesize%1000000000000/1000000000).toFixed(2) + "gb",
			length: vidLength(doc.length),
			resolution: vidRes(doc.framewidth),
			views: doc.views.map(function(element) {return dateString(true, element)}),
			creationdate: dateString(true, doc.creationdate),
			watchlater: dateString(true, doc.watchlater),

			video: doc,
			images,
			ffmpeg,
			pageTitle: doc.title
		})
	})
})





router.patch("/record-view", (req, res) => {
	let docId = new mongoose.Types.ObjectId(req.body.docid)

	videosModel.findOneAndUpdate(
		{_id: docId},
		{$push: {views: new Date()}},
		// {$unset: {watchlater: ""}},
		function(err, res) {
			console.log("New recorded VIEW has been added to " + res.title)
		}
	)
})

router.patch("/record-save", (req, res) => {
	let docId = new mongoose.Types.ObjectId(req.body.docid)
	
	if (req.body.isSaved) {
		videosModel.findOneAndUpdate({_id: docId}, {$unset: {watchlater: ""}}, function(err, res) {
			console.log("Removed " + res.title + " from watch later")
		})
	} else {
		videosModel.findOneAndUpdate({_id: docId}, {watchlater: new Date()}, function(err, res) {
			console.log("Saved " + res.title + " to watch later")
		})
	}
})



module.exports = router