const MulterSharpResizer = require("multer-sharp-resizer");
const express = require('express');
const sass = require('node-sass');
var multer = require("multer");
var sharp = require("sharp");
const less = require('less');
const fs = require('fs');
const app = express();
const port = 3000;

app.use(express.urlencoded({extended: true}));
app.use('/file', express.static('file'));
app.use(express.json());

// SCSS Endpoint. Takes an SCSS file and transpiles it into CSS file
app.post('/api/css/scss', function (request, res) {
    fs.writeFileSync('test.scss', request.body.data.scss, () => {
    });
    sass.render({
        file: 'test.scss'
    }, function (error, root) {
        if (!error) {
            res.json({
                data: {
                    css: root.css.toString()
                }
            });
        } else {
            res.status(400).send(error);
        }
    });
});

// Same same. But diffrent. But still the same!
// Transpiles LESS to CSS
app.post('/api/css/less', function (request, restore) {
    less.render(request.body.data.less, function (error, root) {
        if (!error) {
            restore.json({
                data: {
                    css: root.css
                }
            });
        } else {
            restore.status(400).send(error);
        }
    });
});

// Binding the instance of the app
app.use(express.static(`${__dirname}/upload`));
app.use(express.json());


// Filter files
const multerFilter = (req, file, callback) => {
    if (file.mimetype.indexOf('image') > -1) {
        callback(null, true);
    }
    if (file.mimetype.indexOf('mp3') > -1 || file.mimetype.indexOf('vtt') > -1) {
        callback(null, true);
    }
    else {
        callback(null, false);
    }
}

// Store the objects as storage
const multerStorage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, __dirname + "/file");
    },
    filename: function(req, file, cb){
        // TODO
        const dateAndTime = Date.now();
        console.log(file);
        console.log("DIS IS DA FILE!!!!");
        cb(null, file.filename + dateAndTime);
    }
});

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
});

// Here we crate the upload fields. Uncomment the second field in case you want to upload multiple images.
const uploadImages = upload.fields([
    // {name: "pictures ", maxCount: 5},
    {name: "file", maxCount: 1}
]);

// multer .array() and .single(). For when you want to upload only one image or many pictures.
// const uploadImages = upload.array('pictures', 5);
// const uploadImages = upload.single('file');

// Create resize function and give it the values it needs.
const resizeImages = async(req, res, next) => {
    // Create date to be used in creation. Might come in handy to know when I uploaded what thing.
    const today = new Date();
    const year = today.getFullYear();
    const month = `${today.getMonth() + 1}`.padStart(2, "0");

    const filename = {
        file: `${Date.now()}`
    }

    const sizes = [{
        path: "original",
        width: null,
        height: null
    },
        {
            path: "small__",
            width: 720
        },
        {
            path: "medium__",
            width: 1280
        },
        {
            path: "large__",
            width: 1920
        },
        {
            path: "thumbnail__",
            width: 360
        }
    ];

    // Create upload path for static files
    const uploadPath = `./upload/${year}/${month}`;
    const fileUrl = `${req.protocol}://${req.get("host")}/upload/${year}/${month}`;

    // Sharp options.
    const sharpOptions = {
        fit: "contain",
        background: {r:255, g:255, b:255}
    }

    // Resize objects.
    const resizeObjects = new MulterSharpResizer(req, filename, sizes, uploadPath, fileUrl, sharpOptions);

    // Call resize method to resize files
    await resizeObjects.resize();
    const getDataUploaded = resizeObjects.getData();

    // Get details of uploaded files. Is used by multer
    req.body.file = getDataUploaded.file;
    next();
}
const createPicture = async(req, res, next) => {
    res.status(200) .json({
        status: "succsess",
        file: req.body.file
    })
};

// Third endpoint.
app.post("/api/file", uploadImages, resizeImages, createPicture);

// Fifth endpoint
app.post("/api/audio", upload.fields([{name: 'audio'}, {name: 'vtt'}]), function (req, res, next) {
    console.log("ARNY WAS HERE");
    res.json({
        data: {
            audio: "https://module152kdu.herokuapp.com/file" + req.files['audio'][0].filename,
            vtt: "https://module152kdu.herokuapp.com/file" + req.files['vtt'][0].filename,
        }
    });
});

// Added port variable in case to listen to port 3000
app.listen(process.env.PORT || port);