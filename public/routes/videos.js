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
	let pageCount = Math.ceil((docs[0].videoCount[0].count)/videosPerPage),
		pageArray = [page-3, page-2, page-1, page, page+1, page+2, page+3],
		iterablePages = [page-3, page-2, page-1, page, page+1, page+2, page+3],
		pages = docs[0].videoCount[0].count > videosPerPage,
		url = req.protocol + '://' + req.get('host') + req.originalUrl

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

	return {pages, pageCount, pageArray, url}
}

function volatileFacet(pageParam, sortOrder) {
	if (pageParam == undefined) {pageParam = 1}
	let page = parseInt(pageParam)
	
	let facetAggregation = {
		$facet: {
			"videos": [
				{$sort: {}},
				{$skip: undefined},
				{$limit: videosPerPage}
				// ,
				// {$set: {
				// 	date: {$dateToString: {format: "%m %d, %Y", date: "$date", timezone: "America/New_York"}},
				// 	creationdate: {$dateToString: {format: "%m %d, %Y", date: "$creationdate", timezone: "America/New_York"}},
				// 	watchlater: {$dateToString: {format: "%m %d, %Y", date: "$watchlater", timezone: "America/New_York"}}
				// }}
			],
			"videoCount": [{$count: "count"}]
		}
	}

	facetAggregation["$facet"]["videos"][0]["$sort"][sortOrder] = -1
	facetAggregation["$facet"]["videos"][0]["$sort"]["_id"] = 1
	facetAggregation["$facet"]["videos"][1]["$skip"] = (page - 1) * videosPerPage
	
	return {page, facetAggregation}
}

function vidRes(frameWidth) {
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
	let lengthArray = [(milliseconds/(3600000))%24, (milliseconds/(60000))%60, (milliseconds/1000)%60]
	lengthArray.forEach(function(element, index) {
		lengthArray[index] = String(Math.floor(element)).padStart(2, "0")
	})
  
  return lengthArray.join(":")
}

function displayAttrs(docs) {
	docs.forEach(function(element, index) {
		docs[index]["resolution"] = vidRes(element.framewidth)
		docs[index]["length"] = vidLength(element.length)
	})

	return docs
}



router.get("/all", (req, res) => {
	let {page, facetAggregation} = volatileFacet(req.query.p, "date")

	videosModel.aggregate([
			facetAggregation
		]).exec((err, docs) =>{
		let {pages, pageCount, pageArray, url} = pagination(req, page, docs)

		res.render("videos.ejs", {videos: displayAttrs(docs[0].videos), pages, page, pageCount, pageArray, url})
	})
})


router.get("/new", (req, res) => {
	let {page, facetAggregation} = volatileFacet(req.query.p, "creationdate")

	videosModel.aggregate([
		facetAggregation
	]).exec((err, docs) =>{
		let {pages, pageCount, pageArray, url} = pagination(req, page, docs)

		res.render("videos.ejs", {videos: displayAttrs(docs[0].videos), pages, page, pageCount, pageArray, url})
	})
})


router.get("/top", (req, res) => {
	let {page, facetAggregation} = volatileFacet(req.query.p, "viewcount")

	videosModel.aggregate([
		{$set: {viewcount: {$size: "$views"}}},
		{$match: {viewcount: {$gt: 1}}},
		facetAggregation
	]).exec((err, docs) =>{
		let {pages, pageCount, pageArray, url} = pagination(req, page, docs)
		
		res.render("videos.ejs", {videos: displayAttrs(docs[0].videos), pages, page, pageCount, pageArray, url})
	})
})


router.get("/watch-later", (req, res) => {
	let {page, facetAggregation} = volatileFacet(req.query.p, "watchlater")

	videosModel.aggregate([
		{$match: {watchlater: {$ne: null}}},
		facetAggregation
	]).exec((err, docs) =>{
		let {pages, pageCount, pageArray, url} = pagination(req, page, docs)
		
		res.render("videos.ejs", {videos: displayAttrs(docs[0].videos), pages, page, pageCount, pageArray, url})
	})
})



router.get("/query", (req, res) => {
	videosModel.findOne({_id: "62323c6aaa07942530cd9605"}).exec((err, doc) =>{
		res.send(doc)
	})
})

module.exports = router