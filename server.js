const express = require("express");
const app = express();
const port = 3000;
const sass = require('node-sass');
const fs = require("fs");
const less = require('less');
// A small test. Really? Another one...
app.use(express.urlencoded({extended: true}));
app.use(express.json());

app.post('/api/css/scss', function (req, res) {
    fs.writeFileSync('file.scss', req.body.data.scss, () => {
    });
    sass.render({
        file: "file.scss"
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

app.post('/api/css/less', function (req, res) {
    less.render(req.body.data.less, function (error, root) {
        if (!error) {
            res.json({
                data: {
                    css: root.css
                }
            });
        } else {
            res.status(400).send(error);
        }
    });
});

app.listen(process.env.PORT || port);