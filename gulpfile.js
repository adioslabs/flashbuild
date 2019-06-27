"use strict";

//Standard Plugins
const gulp = require("gulp"),
  browsersync = require("browser-sync").create();

//Gulp Plugins

const sass = require("gulp-sass"),
  postcss = require("gulp-postcss"),
  pug = require("gulp-pug"),
  sourcemaps = require("gulp-sourcemaps"),
  newer = require("gulp-newer"),
  plumber = require("gulp-plumber"),
  // rename = require("gulp-rename"),
  concat = require("gulp-concat"),
  concatCss = require("gulp-concat-css"),
  imagemin = require("gulp-imagemin"),
  eslint = require("gulp-eslint"),
  cssnano = require("gulp-cssnano"),
  purgeCss = require("gulp-purgecss");

//PostCSS Plugins

//************* Folder Path Configuration **************
const pathconf = {
  paths: {
    src: {
      pug: "./src/pug",
      tailwind: "./src/tailwind.css",
      sass: "./src/sass",
      img: "./src/img/*",
      js: "./src/js",
      jsvendors: "./src/js/vendors",
      jsconcat: "./src/js/concats"
    },
    temp: {
      html: "./___Temp/*.html",
      css: "./___Temp/css",
      csscompiled: "./___Temp/css/compiled",
      js: "./___Temp/js",
      img: "./___Temp/img",
      pug: "___Temp"
    },
    build: {
      html: "./___Build",
      css: "./___Build/css",
      js: "./___Build/js",
      img: "./___Build/img"
    }
  }
};

// *********   Source Works  **************

//------All Template files-----

// Tailwind output
function tailwind_comp() {
  return gulp
    .src(pathconf.paths.src.tailwind)
    .pipe(postcss())
    .pipe(gulp.dest(pathconf.paths.temp.css + "/compiled"));
}

//Purge Unused Tailwind classes
function tailwind_purge() {
  return gulp
    .src(pathconf.paths.temp.css + "/compiled/tailwind.css")
    .pipe(
      purgeCss({
        content: [pathconf.paths.temp.html]
      })
    )
    .pipe(gulp.dest(pathconf.paths.temp.css + "/compiled"))
    .pipe(browsersync.stream());
}

// Sass Output
function sass_comp() {
  return gulp
    .src(pathconf.paths.src.sass + "/style.sass")
    .pipe(sass().on("error", sass.logError))
    .pipe(gulp.dest(pathconf.paths.temp.css + "/compiled"))
    .pipe(browsersync.stream());
}

//Concatinate all CSS to single file
function cssConcat() {
  return gulp
    .src([
      pathconf.paths.temp.csscompiled + "/tailwind.css",
      pathconf.paths.temp.csscompiled + "/style.css"
    ])
    .pipe(plumber())
    .pipe(concatCss("main.css"))
    .pipe(gulp.dest(pathconf.paths.temp.css))
    .pipe(browsersync.stream());
}

//Js combine all files into one

//Combines Js files outside Js Vendor folder
function jsCustom() {
  return gulp
    .src(pathconf.paths.src.js + "/*.js")
    .pipe(plumber())
    .pipe(concat("custom.js"))
    .pipe(gulp.dest(pathconf.paths.src.jsconcat));
}

//Combines Js files inside Js Vendor folder
function jsVendor() {
  return gulp
    .src(pathconf.paths.src.jsvendors + "/*.js")
    .pipe(plumber())
    .pipe(concat("vendor.js"))
    .pipe(gulp.dest(pathconf.paths.src.jsconcat));
}

//Combines Js files inside Js concats folder
function jsConcat() {
  return gulp
    .src(pathconf.paths.src.jsconcat + "/*.js")
    .pipe(plumber())
    .pipe(concat("main.js"))
    .pipe(gulp.dest(pathconf.paths.temp.js));
}

//Pug Output
function pug_comp() {
  return gulp
    .src(pathconf.paths.src.pug + "/*.pug")
    .pipe(
      pug({
        pretty: true,
        basedir: pathconf.paths.src.pug
      })
    )
    .pipe(gulp.dest(pathconf.paths.temp.pug))
    .pipe(browsersync.stream());
}

// **********  Temp Works  ************

//Copy Html to ./Build from ./Temp
function htmlCopy() {
  return gulp
    .src(pathconf.paths.temp.html)
    .pipe(gulp.dest(pathconf.paths.build.html));
}

//Copy Images to ./temp/img from ./src/img
function imageCopy() {
  return gulp
    .src(pathconf.paths.src.img)
    .pipe(gulp.dest(pathconf.paths.temp.img));
}

//Copy Js to ./Built/js from ./Temp/Js
function jsCopy() {
  return gulp
    .src(pathconf.paths.temp.js + "/*.js")
    .pipe(gulp.dest(pathconf.paths.build.js));
}

//*********  Build Works   ************

//Image output to build image with a copy
function image_comp() {
  return gulp
    .src(pathconf.paths.temp.img + "/*")
    .pipe(newer(pathconf.paths.temp.img))
    .pipe(
      imagemin([
        imagemin.gifsicle({ interlaced: true }),
        imagemin.jpegtran({ progressive: true }),
        imagemin.optipng({ optimizationLevel: 5 }),
        imagemin.svgo({
          plugins: [{ removeViewBox: false }, { collapseGroups: true }]
        })
      ])
    )
    .pipe(gulp.dest(pathconf.paths.build.img));
}

// Optimize css
// Step 1 Copy main css to build file
function cssCopy() {
  return gulp
    .src(pathconf.paths.temp.css + "/main.css")
    .pipe(gulp.dest(pathconf.paths.build.css));
}

// step 2 Remove unwanted classes
function cssPurge() {
  return gulp
    .src(pathconf.paths.build.css + "/main.css")
    .pipe(
      purgeCss({
        content: [pathconf.paths.build.html + "/*.html"]
      })
    )
    .pipe(gulp.dest(pathconf.paths.build.css));
}

//step 3 Remove unwanted spaces
function cssNano() {
  return gulp
    .src(pathconf.paths.build.css + "/main.css")
    .pipe(sourcemaps.init())
    .pipe(cssnano())
    .pipe(sourcemaps.write("."))
    .pipe(gulp.dest(pathconf.paths.build.css));
}

//step 4 Lint javascripts
function jsLint() {
  return gulp
    .src(pathconf.paths.temp.js + "/*.js")
    .pipe(plumber())
    .pipe(
      eslint({
        configFile: "./.eslintrc.json"
      })
    )
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
}

// ************* System files *************

//Browser-sync
function browserSync(done) {
  browsersync.init({
    server: {
      baseDir: pathconf.paths.temp.pug
    },
    port: 3000
  });
  done();
}

// BrowserSync Reload
function browserSyncReload(done) {
  browsersync.reload();
  done();
}

//Watch functions
function watchfiles() {
  gulp.watch(
    pathconf.paths.src.sass + "/**/*.sass",
    gulp.series(csscomp, browserSyncReload)
  );
  gulp.watch(
    pathconf.paths.src.pug + "/**/*.pug",
    gulp.series(htmlcomp, browserSyncReload)
  );
  gulp.watch(pathconf.paths.src.img, gulp.series(imageCopy, browserSyncReload));
  gulp.watch(pathconf.paths.temp.js + "/*.js", jsLint);
  gulp.watch(
    pathconf.paths.src.js + "/*.js",
    gulp.series(jscomp, browserSyncReload)
  );
  gulp.watch(
    pathconf.paths.src.jsvendors + "/*.js",
    gulp.series(jscomp, browserSyncReload)
  );
}

//Complex tasker

//Compile
//chages in sass files
const sasscomp = gulp.parallel(sass_comp, tailwind_comp),
  csscomp = gulp.series(sasscomp, tailwind_purge, cssConcat),
  // Changes in Pug Files
  htmlcomp = gulp.series(pug_comp),
  //Concatinates files in Js and Js vendor files
  jsCusVenCon = gulp.parallel(jsCustom, jsVendor),
  //Concatinates all js files into one file
  jscomp = gulp.series(jsCusVenCon, jsConcat),
  //Changes in Source folder
  compile = gulp.parallel(htmlcomp, jscomp, jsLint, csscomp, imageCopy),
  //Build File
  //Build file for Distribution run => "gulp build"
  build = gulp.series(
    compile,
    htmlCopy,
    jsCopy,
    cssCopy,
    cssPurge,
    cssNano,
    image_comp
  ),
  // Autotask Runner
  //Watch for changes
  watch = gulp.parallel(watchfiles, browserSync);

//Gulp CLI Exports
//To Compile (Run before watch to get temporary uncompressed files to work on)
exports.compile = compile;

//To Watch (For Development phase)
exports.watch = watch;

//To Build (For Final File to Deploy)
exports.build = build;
