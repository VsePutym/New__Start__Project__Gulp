//флаг --save-dev нужен для того, чтобы сохранялись версии устанавливаемых пакетов
//итоговый каталог для заказчика
// динамическое имя с именем общего каталога (выяснить как внести его в гит игнор)
let project_folder = require("path").basename(__dirname);
//каталог исходников
let source_folder = "#src";
//Переменная path, которая содержит объекты, которые в свою очередь будут содержать пути к файлам и папкам
let path ={
    // пути вывода (куда галп будет выгружать обработанные файлы)
    //для каталога с результатом
    build: {
        //пути к файлам
        html: project_folder + "/",
        css: project_folder + "/css/",
        js: project_folder + "/js/",
        img: project_folder + "/img/",
        fonts: project_folder + "/fonts/",
    },
    //для каталога с исходниками
    src: {
        //исключаем файлы с _*.html из сборки
        html: [source_folder + "/*.html", "!" + source_folder + "/_*.html"],
        css: source_folder + "/scss/style.scss",
        js: source_folder + "/js/script.js",
        img: source_folder + "/img/**/*.{jpg,png,svg,gif,ico,webp}",
        fonts: source_folder + "/fonts/*.ttf"
    },
    watch: {
        //слушаем всё, что является нужным файлом
        html: source_folder + "/**/*.html",
        css: source_folder + "/scss/**/*.scss",
        js: source_folder + "/js/**/*.js",
        img: source_folder + "/img/**/*.{jpg,png,svg,gif,ico,webp}"
    },
    //объект CLEAN содержит путь к каталгу проекта и отвечает за удаление этого каталога
    //каждый раз, когда мы будем запускать gulp
    clean: "./" + project_folder + "/"
}

//переменные, которые помогут в написании сценария
//переменным будет присвоен сам 'gulp'
let {src, dest} = require('gulp'),
    //создадим отдельную переменную gulp, которой тоже присвоим 'gulp' для выполнения иных задач
    gulp = require('gulp'),
    browsersync = require("browser-sync").create(),
    fileinclude = require("gulp-file-include"),
    del = require("del"),
    scss = require("gulp-sass"),
    autoprefixer = require("gulp-autoprefixer"),
    group_media = require("gulp-group-css-media-queries"),
    clean_css = require("gulp-clean-css"),
    rename = require("gulp-rename"),
    uglify = require("gulp-uglify-es").default,
    concat = require("gulp-concat"),
    sourcemaps = require("gulp-sourcemaps"),
    imagemin = require("gulp-imagemin"),
    recompress = require("imagemin-jpeg-recompress"), //тоже пережимает, но лучше. Плагин для плагина
    pngquant = require("imagemin-pngquant"),
    // htmlValidator = require('gulp-w3c-html-validator'),
    bemValidator = require('gulp-html-bem-validator'),
    svgSprite = require("gulp-svg-sprite");


    //Функция, которая будет обновлять страницу
function browserSync(params) {
    //обращаемся к переменной
    browsersync.init({
        //тут указываются настройки плагина
        server: {
            baseDir: "./" + project_folder + "/"
        },
        port: 3000,
        notify: false,
        injectChanges: false
    })
}
// функция для работы с html файлами
function html() {
    return src(path.src.html)
    .pipe(fileinclude())
    .pipe(dest(path.build.html)) //выгрузка
    .pipe(browsersync.stream())
        //сборка файлов через fileinclude
        // .pipe(htmlValidator())
        .pipe(bemValidator())
}

function cssLibs() {
    //библиотека из css-стилей плагинов
    return src([
        "node_modules/normalize.css/normalize.css",
        'node_modules/slick-carousel/slick/slick.css'
    ])
        .pipe(sourcemaps.init())
        .pipe(concat("libs.css")) //склеиваем их в один файл с указанным именем
        .pipe(
            autoprefixer({
                overrideBrowserslist: ["last 5 versions"],
                cascade: true
            })
        )
        .pipe(dest(path.build.css)) //кидаем несжатый файл в директорию результата
        .pipe(clean_css({
            compatibility: "ie8",
            level: {
                1: {
                    specialComments: 0,
                    removeEmpty: true,
                    removeWhitespace: true,
                },
                2: {
                    mergeMedia: true,
                    removeEmpty: true,
                    removeDuplicateFontRules: true,
                    removeDuplicateMediaBlocks: true,
                    removeDuplicateRules: true,
                    removeUnusedAtRules: true,
                },
            },
        }))
        .pipe(
            rename({
                extname: ".min.css"
            })
        )
        .pipe(sourcemaps.write('.'))
        .pipe(dest(path.build.css)) //кидаем готовый файл в директорию
}
//Функция обработки стилей
function css() {
    return src(path.src.css)
        .pipe(sourcemaps.init()) //инициализируем sourcemaps, чтобы он начинал записывать, что из какого файла берётся
        .pipe(
            scss({
                //формирование развернутого (не сжатого) css файла
                outputStyle: "expanded"
            })
        )
        .pipe(
            group_media()
        )
        .pipe(
            autoprefixer({
                overrideBrowserslist: ["last 5 versions"],
                cascade: true
            })
        )
        .pipe(dest(path.build.css)) //выгрузка
        .pipe(clean_css({
            compatibility: "ie8",
            level: {
                1: {
                    specialComments: 0,
                    removeEmpty: true,
                    removeWhitespace: true,
                },
                2: {
                    mergeMedia: true,
                    removeEmpty: true,
                    removeDuplicateFontRules: true,
                    removeDuplicateMediaBlocks: true,
                    removeDuplicateRules: true,
                    removeUnusedAtRules: true,
                },
            },
        }))
        .pipe(
            rename({
                extname: ".min.css"
            })
        )
        .pipe(sourcemaps.write('.')) //записываем карту в итоговый файл
        .pipe(dest(path.build.css))
        .pipe(browsersync.stream())
}

function jsLibs() {
    return src([
        //подключаем разные js в общую библиотеку.
        'node_modules/slick-carousel/slick/slick.js'
    ])
        //pipe - функция, внутри которой мы пишем команды для gulp
        .pipe(concat("libs.js"))
        .pipe(dest(path.build.js)) //выгрузка несжатого
        .pipe(
            uglify() // сжимаем
        )
        .pipe(
            rename({
                extname: ".min.js"
            })
        )
        .pipe(dest(path.build.js)) //выгрузка сжатого
        .pipe(browsersync.stream())
}

function js() {
    return src(path.src.js)
        //сборка файлов через fileinclude
        .pipe(fileinclude())
        //pipe - функция, внутри которой мы пишем команды для gulp
        .pipe(sourcemaps.init())
        .pipe(dest(path.build.js)) //выгрузка
        .pipe(
            uglify()
        )
        .pipe(
            rename({
                extname: ".min.js"
            })
        )
        .pipe(sourcemaps.write('.'))
        .pipe(dest(path.build.js))
        .pipe(browsersync.stream())
}

function images() {
    return src(path.src.img)
        .pipe(
            imagemin(
                [
                    recompress({
                        //Настройки сжатия изображений. Сейчас всё настроено так, что сжатие почти незаметно для глаза на обычных экранах. Можете покрутить настройки, но за результат не отвечаю.
                        loops: 4, //количество прогонок изображения
                        min: 80, //минимальное качество в процентах
                        max: 100, //максимальное качество в процентах
                        quality: "high", //тут всё говорит само за себя, если хоть капельку понимаешь английский
                        use: [pngquant()],
                    }),
                    imagemin.gifsicle(), //тут и ниже всякие плагины для обработки разных типов изображений
                    imagemin.optipng(),
                    imagemin.svgo(),
                ],
                {
                    progressive: true,
                    svgoPlugins: [{removeViewBox: false}],
                    interlaced: true,
                    optimizationLevel: 3 // 0 to 7
                }
            ),
        )
        .pipe(dest(path.build.img))
        .pipe(browsersync.stream());
}


gulp.task('svgSprite', function () {
    return gulp.src([source_folder + '/iconsprite/*.svg'])
        .pipe(svgSprite({
            mode: {
                stack: {
                    //куда будет выводиться готовый собранный файл
                    sprite: "../icons/icons.svg", //sprite file name
                    //создание html файла с примером иконок
                    example: true
                }
            },
        }
        ))
        .pipe(dest(path.build.img)); //выгрузка
})

//Функция для отслеживания изменений на лету
function watchFiles(params) {
    gulp.watch([path.watch.html], html);
    gulp.watch([path.watch.css], css);
    gulp.watch([path.watch.js], js);
    gulp.watch([path.watch.img], images);
}


//Функция, кот. будет чистить(удалять) папку result
function clean(params) {
    return del(path.clean);
}


let build = gulp.series(clean, gulp.parallel(jsLibs, js, cssLibs, css, html, images));
let watch = gulp.parallel(build, watchFiles, browserSync);


//подружим gulp с новыми переменными, чтобы он их понимал и работал с ними
exports.images = images;
exports.js = js;
exports.jsLibs = jsLibs;
exports.css = css;
exports.cssLibs = cssLibs;
exports.html = html;
exports.build = build;
exports.watch = watch;
exports.default = watch;