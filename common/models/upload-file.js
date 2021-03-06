'use strict';

const path = require('path');
const ejs = require('ejs');
const configPath = process.env.NODE_ENV === undefined ?
  '../../server/config.json' :
  `../../server/config.${process.env.NODE_ENV}.json`;
const config = require(configPath);
var ffmpeg = require('fluent-ffmpeg');

var thumb = require('node-thumbnail').thumb;


module.exports = function (Uploadfile) {

  Uploadfile.afterRemote('upload', function (context, result, next) {
    let files = [];
    // folder name come from url request
    var folderName = context.req.params.container;

    let src = path.join(__dirname, '../../../madarImage/uploadFiles/');
    // file root save 
    var urlFileRoot = config.domain + config.restApiRoot + Uploadfile.http.path;

    // ulr save depend of folder name
    var urlFileRootSave = urlFileRoot + '/' + folderName + '/download/'

    // ulr save thumble
    var urlThumbRootSave = urlFileRoot + '/' + "thumbnail" + '/download/'

    // ulr save thumble
    var urlWebThumbRootSave = urlFileRoot + '/' + "web-thumbnail" + '/download/'

    

    if (process.env.NODE_ENV != undefined) {
      ffmpeg.setFfmpegPath(path.join(config.thumbUrl + config.programFFmpegName[0]));
      ffmpeg.setFfprobePath(path.join(config.thumbUrl + config.programFFmpegName[1]));
    }
    result.result.files.file.forEach((file) => {
      // cheack type of file from folder name request
      //   if (folderName == "videos") {
      //     var newWidth = 0
      //     var newHeight = 0
      //     var oldWidth = 0;
      //     var oldHeight = 0;
      //     var rotation;
      //     var size
      //     ffmpeg.ffprobe(src + "/" + folderName + "/" + file.name, function (err, metadata) {
      //       if (err) {} else {
      //         console.log(metadata);
      //         metadata['streams'].forEach(function (element) {
      //           if (element.width) {
      //             oldWidth = element.width;
      //             oldHeight = element.height;
      //             rotation = element.rotation
      //           }
      //         }, this);
      //         if (oldWidth != 0)
      //           var res = oldWidth / oldHeight;
      //         else
      //           var res = 2
      //         console.log("res");
      //         console.log(res);
      //         if (rotation == -90 || rotation == 90) {
      //           newHeight = 400
      //           newWidth = newHeight * res
      //           size = newHeight + 'x' + parseInt(newWidth)
      //         } else {
      //           newWidth = 400
      //           newHeight = newWidth / res
      //           size = newWidth + 'x' + parseInt(newHeight)
      //         }
      //         console.log(size)
      //         ffmpeg(src + "/" + folderName + "/" + file.name)
      //           .screenshot({
      //             count: 1,
      //             filename: file.name.substring(0, file.name.lastIndexOf('.')) + "_thumb.PNG",
      //             folder: src + '/thumbnail/',
      //             size: size
      //           });
      //       }
      //     });


      //     files.push({
      //       'file': urlFileRootSave + file.name,
      //       'thumbnail': urlThumbRootSave + file.name.substring(0, file.name.lastIndexOf('.')) + "_thumb.PNG"
      //     });

      //   }
      // cheack type of file from folder name request            
      if (folderName == "image") {
        thumb({
          source: src + "/" + folderName + "/" + file.name, // could be a filename: dest/path/image.jpg
          destination: src + '/thumbnail/',
          concurrency: 4
        }, function (files, err, stdout, stderr) {});
        var parts = file.name.split('.');
        var extension = parts[parts.length - 1];
        thumb({
          source: src + "/" + folderName + "/" + file.name, // could be a filename: dest/path/image.jpg
          destination: src + '/web-thumbnail/',
          concurrency: 4,
          width: 1200
        }, function (files, err, stdout, stderr) {});
        files.push({
          'url': urlFileRootSave + file.name,
          'thumb': urlThumbRootSave + file.name.substring(0, file.name.lastIndexOf('.')) + "_thumb." + extension,
          'web-thumb': urlWebThumbRootSave + file.name.substring(0, file.name.lastIndexOf('.')) + "_thumb." + extension
        });

      }
      //   else {
      //     files.push({
      //       'url': urlFileRootSave + file.name
      //     });
      //   }
      // this for download
      // files.push({ 'file': urlFileRootSave + file.name, 'thumble': urlThumbRootSave + file.name.substring(0, file.name.lastIndexOf('.')) + "_thumb.PNG" });

      // this for view
      // files.push({ 'file': src + folderName + "/" + file.name, 'thumble': src + "thumb/" + file.name.substring(0, file.name.lastIndexOf('.')) + "_thumb.png" });
    });
    Uploadfile.app.models.media.create(files, function (err, data) {
      if (err)
        return next(err)
      context.res.json(data);

    })
  });


};
