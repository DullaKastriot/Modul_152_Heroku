const express = require('express');
const sass = require('node-sass');
const less = require('less');
const fs = require('fs');
const app = express();
const port = 3000;

app.use(express.urlencoded({extended: true}));
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

// Added port variable in case to listen to port 3000
app.listen(process.env.PORT || port);