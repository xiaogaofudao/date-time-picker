var utils = require('../core/utils/index')

function DaysPanel (picker) {
  this.picker = picker
  this.main = null
  this.mainStyle = null
  this.arrow = null
  this.arrowStyle = null
}

utils.extend(DaysPanel.prototype, {
  render: function () {
    if (!this.main) {
      this._init()
    }
    this.picker.head.innerHTML = (
      '<div class="picker-year" data-click="toYears">' + this.picker.dateTime.parsedNow.year + '</div>' +
      '<div class="picker-date picker-head-active" data-click="toMonths">' +
        utils.formatDate(
          this.picker.dateTime.now,
          this.picker.config.MDW.replace('D', '#')
        ).replace('#', this.picker.config.day[this.picker.dateTime.parsedNow.day]) +
      '</div>'
    )
    this.main.innerHTML = buildCalendar(this.picker.prevDateTime, this.picker.config, 'prev') + buildCalendar(this.picker.dateTime, this.picker.config, 'curr') + buildCalendar(this.picker.nextDateTime, this.picker.config, 'next')
  },
  _init: function () {
    this._initMain()
    this._initArrow()
  },

  _initMain: function () {
    this.main = document.createElement('div')
    this.main.className = 'date-picker-main'
    this.mainStyle = this.main.style
    this.picker.content.appendChild(this.main)
    this.mainWidth = this.main.offsetWidth
  },
  _initArrow: function () {
    this.arrow = document.createElement('div')
    this.arrow.className = 'picker-actions-arrow'
    this.arrow.innerHTML = '<i data-click="prevMonth">←</i><i data-click="nextMonth">→</i>'
    this.arrowStyle = this.arrow.style
    this.picker.content.appendChild(this.arrow)
  },

  show: function () {
    this.mainStyle.display = 'block'
    this.arrowStyle.display = 'block'
  },
  hide: function () {
    this.mainStyle.display = 'none'
    this.arrowStyle.display = 'none'
  },

  _slideTo: function (v, base, cb) {
    var that = this
    var TIME = 300 / 100
    var transitionTime = TIME * Math.abs(v - base)
    var tid = null
    var ended = function () {
      window.clearTimeout(tid)
      if (!that._slideEndFn) {
        return
      }
      that._slideEndFn = null
      that.main.removeEventListener(utils.prefixNames.transitionEnd, ended, false)
      that.mainStyle.webkitTransition = 'none 0ms'
      that.mainStyle.transition = 'none 0ms'
      that.mainStyle[utils.prefixNames.transform] = 'translateX(-100%) translateZ(0)'
      cb && cb.call(that)
    }
    this._slideEndFn = ended
    this.mainStyle[utils.prefixNames.transform] = 'translateX(' + v + '%) translateZ(0)'
    if (transitionTime > 0) {
      tid = window.setTimeout(ended, transitionTime)
      transitionTime += 'ms'
      this.mainStyle.webkitTransition = transitionTime
      this.mainStyle.transition = transitionTime
    } else {
      ended()
    }
    this.main.addEventListener(utils.prefixNames.transitionEnd, ended, false)
  },
  _befChange: function (base) {
    if (!utils.isNum(base)) {
      base = -100
    }
    this._slideEndFn && this._slideEndFn()
    return base
  },
  prevMonth: function (base) {
    base = this._befChange(base)
    this._slideTo(0, base, function () {
      this.picker.setNowToPrev()
    })
  },
  nextMonth: function (base) {
    base = this._befChange(base)
    this._slideTo(-200, base, function () {
      this.picker.setNowToNext()
    })
  },
  _start: function (e) {
    var point = e.touches[0]
    var pointX = point.pageX
    var that = this
    var base = -100
    var toV = 0
    var shouldChange = false
    var touchmove = function (e) {
      e.preventDefault()
      e.stopPropagation()
      var point = e.touches[0]
      var diffX = point.pageX - pointX
      diffX = diffX * 100 / that.mainWidth
      var absX = Math.abs(diffX)
      if (absX > 100) {
        diffX = diffX > 0 ? 100 : -100
      }
      shouldChange = absX > 55
      toV = base + diffX
      that.arrowStyle.opacity = (100 - absX * 0.9) / 100
      that.mainStyle[utils.prefixNames.transform] = 'translateX(' + toV + '%) translateZ(0)'
    }
    var touchend = function (e) {
      that.arrowStyle.opacity = 1
      if (shouldChange) {
        that[toV > base ? 'prevMonth' : 'nextMonth'](toV)
      } else {
        that._slideTo(base, toV)
      }
      document.removeEventListener('touchmove', touchmove, false)
      document.removeEventListener('touchend', touchend, false)
      document.removeEventListener('touchcancel', touchend, false)
    }
    this._slideEndFn && this._slideEndFn()
    document.addEventListener('touchmove', touchmove, false)
    document.addEventListener('touchend', touchend, false)
    document.addEventListener('touchcancel', touchend, false)
  },
  destroy: function () {
    this._slideEndFn && this._slideEndFn()
    this.picker.content.removeChild(this.main)
    this.picker.content.removeChild(this.arrow)
    this.picker = null
    this.main = null
    this.mainStyle = null
    this.arrow = null
    this.arrowStyle = null
  }
})

module.exports = DaysPanel

function buildCalendar (datetime, config, cls) {
  var now = new Date()
  var parsedNow = {
    year: now.getFullYear(),
    month: now.getMonth(),
    date: now.getDate()
  }
  var parsedCurrent = datetime.parsedNow
  cls = ' picker-bdy-' + cls
  return (
    '<div class="picker-bdy' + cls + '">' +
      '<div class="date-picker-title">' + utils.formatDate(datetime.now, config.YM) + '</div>' +
      '<div class="date-picker-days">' +
        '<div class="date-picker-days-title">' +
          config.shortDay.map(function (d) {
            return '<i>' + d + '</i>'
          }).join('') +
        '</div>' +
        '<div class="date-picker-days-bdy">' +
          datetime.getRows().map(function (row) {
            return (
              '<div class="picker-row">' +
                row.map(function (d) {
                  var klass = parsedCurrent.year === parsedNow.year && parsedCurrent.month === parsedNow.month && d === parsedNow.date ? 'picker-now' : ''
                  if (d === parsedCurrent.date) {
                    if (klass) {
                      klass += ' picker-active'
                    } else {
                      klass = 'picker-active'
                    }
                  }
                  if (klass) {
                    klass = ' class="' + klass + '"'
                  }
                  return '<i data-click="selV" data-val="' + d + '" ' + klass + '><span>' + d + '</span></i>'
                }).join('') +
              '</div>'
            )
          }).join('') +
        '</div>' +
      '</div>' +
    '</div>'
  )
}
