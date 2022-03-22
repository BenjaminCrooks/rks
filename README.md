# rks
Media application to enable managing and interacting with a local media collection.


### Project Directory
```
.
├── node_modules
├── public
│   └── assets
│   │   └── fonts
│   │   └── icons
│   └── models
│   └── plugins
│   └── routes
├── views
│   └── partials
├── index.js
└── README.md
```


## MongoDB Instance
Pulls data from a locally hosted MongoDB v4.2.5 community server.

### Database & Collections
```
mediaDatabase
├── videos    # movie, film, shows, etc; references actors collection
├── prints    # comics, manga, or anything readable
├── images    # digital art; references artists collection
├── actors
└── artists
```


### Document Structure
