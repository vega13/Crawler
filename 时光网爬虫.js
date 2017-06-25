var request = require('sync-request')
var cheerio = require('cheerio')

class Movie {
    constructor() {
        this.name = ''
        this.score = 0
        this.quote = ''
        this.ranking = 0
        this.coverUrl = ''
    }
}

var log = console.log.bind(console)

var cachedUrl = url => {
    var cacheFile = ''
    // 这里是因为他网页路径写的有问题
    if (url == 'http://www.mtime.com/top/movie/top100/') {
        cacheFile = 'cached_html/' + url.split('movie/')[1] + 'index-1.html'
    } else {
        cacheFile = 'cached_html/' + url.split('movie/')[1]
    }
    var fs = require('fs')
    var exists = fs.existsSync(cacheFile)
    if (exists) {
        var data = fs.readFileSync(cacheFile)
        // log('data', data)
        return data
    } else {
        var r = request('GET', url)
        var body = r.getBody('utf-8')
        fs.writeFileSync(cacheFile, body)
        return body
    }
}

var movieFromDiv = function(div) {
    var e = cheerio.load(div)
    var movie = new Movie()
    movie.name = e('.pb6').text()
    movie.score = e('.point').text()
    movie.quote = e('.mt3').text()
    movie.ranking = e('.number').text()
    movie.coverUrl = e('.img_box').attr('src')
    // log('movie', movie)
    return movie
}

var moviesFromUrl = function(url) {
    var body = cachedUrl(url)
    var e = cheerio.load(body)
    var ul = e('#asyncRatingRegion')
    var movieDivs = ul.find('li')
    var movies = []
    for (var i = 0; i < movieDivs.length; i++) {
        var div = movieDivs[i]
        var m = movieFromDiv(div)
        movies.push(m)
    }
    return movies
}

var saveMovie = function(movies) {
    var s = JSON.stringify(movies, null, 2)
    var fs = require('fs')
    var path = 'uigd.txt'
    fs.writeFileSync(path, s)
}

var downloadCovers = movies => {
    var request = require('request')
    var fs = require('fs')
    for (var i = 0; i < movies.length; i++) {
        var m = movies[i]
        var url = m.coverUrl
        var path = 'covers/' + m.name.split(' ')[0]
        request(url).pipe(fs.createWriteStream(path))
    }
}

var __main = function() {
    var movies = []
    for (var i = 1; i <= 10; i++) {
        var url = ''
        if (i == 1) {
            url = `http://www.mtime.com/top/movie/top100/`
        } else {
            url = `http://www.mtime.com/top/movie/top100/index-${i}.html`
        }
        var moviesInPage = moviesFromUrl(url)
        movies = [...movies, ...moviesInPage]
    }
    saveMovie(movies)
    downloadCovers(movies)
}


__main()
