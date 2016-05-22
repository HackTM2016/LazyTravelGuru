var fs = require('fs');
var glob = require('glob');
var libpng = require('node-png');
var path = require('path');
var q = require('q');
var qfs = require('q-io/fs');

var PNG_CHANNELS = 4;

function buildSprite(opts){
    var inputImagePaths;

    return q.when()
        .then(function(){
            return resolveGlob(opts.inputImages);
        })
        .then(function(_inputImagePaths_){
            inputImagePaths = _inputImagePaths_;
            inputImagePaths.sort();

            return q.all(inputImagePaths.map(function(inputImagePath){
                return loadPng(inputImagePath);
            }));
        })
        .then(function(pngImages){
            var glyphicons = buildGlyphicons(inputImagePaths, pngImages);

            var sprite = generateSpriteFromGlyphicons(glyphicons);

            var less = generateLessFromSpritePositions(opts.cssPrefix, opts.spriteUrl, sprite.metadata);

            return q.all([
                savePng(opts.spriteImage, sprite.image),
                qfs.write(opts.spriteLess, less),
            ]);
        });
}

function resolveGlob(filePathPattern){
    var deferred = q.defer();

    glob(filePathPattern, function(e, filePaths){
        if(e){
            deferred.reject(e);
        }
        else{
            deferred.resolve(filePaths);
        }
    });

    return deferred.promise;
}

function loadPng(pngPath){
    var deferred = q.defer();

    fs.createReadStream(pngPath)
        .pipe(new libpng.PNG({filterType: 4}))
        .on('parsed', function(){
            deferred.resolve(this);
        });

    return deferred.promise;
}

function savePng(pngPath, png){
    var deferred = q.defer();

    png.pack()
        .pipe(fs.createWriteStream(pngPath))
        .on('end', function(){
            deferred.resolve();
        });

    return deferred;
}

function buildGlyphicons(imagePaths, pngImages){
    var glyphicons = [];

    for(var i = 0; i < imagePaths.length; ++i){
        var imagePath = imagePaths[i];
        var pngImage = pngImages[i];

        var glyphicon = parseGlyphiconMetadataFromPath(imagePath);
        glyphicon.image = pngImage;

        glyphicons.push(glyphicon);
    }

    return glyphicons;
}

function generateSpriteFromGlyphicons(glyphicons){
    var maxWidth = findMaxWidthImage(glyphicons);
    var heightSum = calcImageHeightSum(glyphicons);

    var spriteImage = new libpng.PNG({
        width: maxWidth,
        height: heightSum,
    });

    clearPng(spriteImage);

    var spriteMetadata = [];
    var currentY = 0;
    for(var i = 0; i < glyphicons.length; ++i){
        var glyphicon = glyphicons[i];

        spriteMetadata.push({
            name: glyphicon.name,
            x: 0,
            y: currentY,
            width: glyphicon.image.width,
            height: glyphicon.image.height,
        });

        copyPngSection(spriteImage, 0, currentY, glyphicon.image, 0, 0, glyphicon.image.width, glyphicon.image.height);

        currentY += glyphicon.image.height;
    }

    return {
        image: spriteImage,
        metadata: spriteMetadata,
    };
}

function clearPng(png){
    for(var y = 0; y < png.height; ++y){
        for(var x = 0; x < png.width; ++x){
            for(var c = 0; c < PNG_CHANNELS; ++c){
                var pos = (png.width * y + x) * PNG_CHANNELS + c;
                png.data[pos] = 0;
            }
        }
    }
}

function copyPngSection(dstPng, dstX, dstY, srcPng, srcX, srcY, width, height){
    for(var y = 0; y < height; ++y){
        var srcYPos = srcPng.width * PNG_CHANNELS * (y + srcY);
        var dstYPos = dstPng.width * PNG_CHANNELS * (y + dstY);

        for(var x = 0; x < width; ++x){
            var srcXPos = srcYPos + (x + srcX) * PNG_CHANNELS;
            var dstXPos = dstYPos + (x + dstX) * PNG_CHANNELS;

            for(var c = 0; c < PNG_CHANNELS; ++c){
                var srcCPos = srcXPos + c;
                var dstCPos = dstXPos + c;

                dstPng.data[dstCPos] = srcPng.data[srcCPos];
            }
        }
    }
}

function generateLessFromSpritePositions(cssPrefix, spriteUrl, spriteMetadataArray){
    var less = '/* the ' + cssPrefix + ' rules are generated and should not be editied manually */\n';
    less += '' + cssPrefix + '-sprite {\n';
    less += '.vfp-display-inline-block();\n';
    less += 'background-image: url("' + spriteUrl + '");\n';

    for(var i = 0; i < spriteMetadataArray.length; ++i){
        var spriteMetadata = spriteMetadataArray[i];

        less += '&' + cssPrefix + '-' + spriteMetadata.name + '{';
        less += 'width:' + spriteMetadata.width + 'px;';
        less += 'height:' + spriteMetadata.height + 'px;';
        less += 'background-position:' + (-spriteMetadata.x) + 'px ' + (-spriteMetadata.y) + 'px;';
        less += '}\n';
    }

    less += '}\n';

    return less;
}

function parseGlyphiconMetadataFromPath(imagePath){
    var fileName = path.basename(imagePath);

    var match = fileName.match(/^([a-zA-Z0-9-]+)[.]png$/);
    if(!match){
        throw new Error('Can\'t read metadata from file name: ' + fileName);
    }

    return {
        name: match[1].toLowerCase(),
    };
}

function findMaxWidthImage(glyphicons){
    var maxWidth = -1;

    for(var i = 0; i < glyphicons.length; ++i){
        var width = glyphicons[i].image.width;

        if(width > maxWidth){
            maxWidth = width;
        }
    }

    return maxWidth;
}

function calcImageHeightSum(glyphicons){
    var heightSum = 0;

    for(var i = 0; i < glyphicons.length; ++i){
        heightSum += glyphicons[i].image.height;
    }

    return heightSum;
}

module.exports = {
    buildSprite: buildSprite,
};