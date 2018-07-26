var debounced = function(fn, msec) {
  var timer = 0;
  return function() {
    var context = this,
      args = arguments;
    if (timer) clearTimeout(timer);
    timer = setTimeout(function() {
      fn.apply(context, args);
    }, msec);
  };
};

var getSelector = function(el) {
  var path = '',
    s;
  var r1 = /(^| )+([-\w])/g,
    r2 = /\s+$/;
  while (el.parentNode) {
    s = el.id ? '#' + el.id : '';
    if (el.className.length) {
      s += el.className.replace(r1, '.$2').replace(r2, '');
    }
    if (s.length) {
      path = path.length ? s + ' ' + path : s;
    }
    el = el.parentNode;
  }
  return path;
};

var uid = String(Math.random()).substr(2, 9) + '.' + Date.now();
var m_uid = document.cookie.match(/(?:^|; )_bpid=([^;]+)/);
if (m_uid) {
  uid = m_uid[1];
}

var expires = new Date(Date.now() + 63113852e3);
var domains = window.location.hostname.split('.');

document.cookie =
  '_bpid=' +
  uid +
  '; domain=.' +
  (domains.length > 2 ? domains.slice(1) : domains).join('.') +
  '; path=/; expires=' +
  expires.toUTCString();

var attributes = {};
var beaconUrl = '';

var trackEvent = function(e) {
  var doc = e.target.ownerDocument,
    de = doc.documentElement,
    win = doc.defaultView;
  var dt = new Date();
  var data = {
    u: uid,
    t: dt.getTime(),
    l: doc.location.href,
    e: e.type,
    s: getSelector(e.target),
    vd: de.clientWidth + 'x' + de.clientHeight,
    vs: de.scrollLeft + 'x' + de.scrollTop,
    dd: de.scrollWidth + 'x' + de.scrollHeight,
    sd: win.screen.width + 'x' + win.screen.height,
    ln: navigator.language,
    tz: dt.getTimezoneOffset(),
    a: attributes
  };
  if (!beaconUrl) {
    if (console) console.log('trackEvent', data);
  } else {
    var img = new Image();
    img.src = beaconUrl + '?' + encodeURIComponent(JSON.stringify(data));
  }
};

var trackEvent_ = debounced(trackEvent, 555);
var events = ['click', 'change', 'submit'];

var init = function(beacon, attrs) {
  beaconUrl = beacon;
  if (typeof attrs === 'object') {
    attributes = attrs;
  }
  trackEvent_({
    type: 'pageview',
    target: document.documentElement
  });
  for (var i = 0; i < events.length; i++) {
    document.addEventListener(events[i], trackEvent);
  }
  document.addEventListener('scroll', trackEvent_);
};

init.trackEvent = trackEvent;

window['bp'] = init;
