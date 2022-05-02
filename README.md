# rks
Media application to enable managing and interacting with a local media collection. I am currently revamping this project from older code; progressively adding the updated sections & portions to this repository.

### Project Directory
```
.
├── node_modules
├── public
│   ├── assets
│   │   ├── fonts # omitting .ttf files
│   │   └── icons # omitting icon image files
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
