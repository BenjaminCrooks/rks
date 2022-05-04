# rks
Media application to enable managing and interacting with a local media collection. I am currently revamping this project from older code; progressively adding the updated sections & portions to this repository.

### Project Directory
```
.
├── node_modules
├── public
│   ├── assets
│   │   ├── fonts
│   │   └── icons
│   ├── models
│   ├── plugins
│   └── routes
├── views
│   └── partials
├── index.js
└── README.md
```

## Media Folder Architecture
Each media item has a dedicated folder that houses the nessecary files and items. Each of these folder's names corresponds to the respective media document's id; with all media folders being housed on a dedicated storage system.

### Video Folder Structure
```
.
├── images
│   ├── image_1.jpg
│   └── ...
├── ffmpeg
│   ├── image_1.jpg
│   └── ...
├── thumbnail.jpg
└── video.mp4
```

## MongoDB Instance
Pulls data from a locally hosted MongoDB v4.2.5 community server.

### Database & Collections
The instance contains varying collections, with each collection matching to a media type.

***The prints and images collections were initialized for future development.*
```
mediaDatabase
├── videos    # movies, films, shows, youtube videos, etc
├── prints    # comics, manga, or anything readable
└── images    # digital art
```

### Video Document Structure
```
{
	_id: ObjectId,
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
}

```


## Project Setup

### MongoDB Document Creation
```js
db.videos.insertOne(
	{videoid: "",
	studio: "",
	title: "",
	date: new Date(""),
	featuring: [],
	tags: [],
	series: [],
	filesize: NumberInt(),
	filetype: "",
	length: NumberInt(),
	framewidth: NumberInt(),
	frameheight: NumberInt(),
	framerate: NumberDecimal(),
	photos: NumberInt(),
	ffmpeg: NumberInt(),
	views: [],
	creationdate: new Date("")}
)
```

```js
db.videos.insertMany([
	// document,
	// document,
	// ...
])
```

### MongoDB Document Updating
```js
db.videos.updateOne(
	{_id: ObjectId("229739")},
	{$set: 
		{
			watchlater: new Date(),
		}
	}
)
```

```js
db.videos.updateOne(
	{_id: ObjectId("229739")},
	{$push: 
		{
			views: new Date()
		}
	}
)
```

```js
db.videos.updateMany(
	{},
	{$rename: 
		{
			"actors": "featuring",
			"categories": "tags"
		}
	}
)
```

### MongoDB Collection Backup
```
cd ...\MongoDB\Server\4.2\bin
mongodump
```

### FFmpeg
Used to generate the video interval overview images.

The *fps* denominator is set to the total length of the video in seconds divided by the number of desired images.
```
ffmpeg -i video.mp4 -vf fps=1/29 output/image_%d.jpg
```
