(function () {
  'use strict';

  var SPREADSHEET_ID = '1FxEEfCDPfcsB5W18tnzbOSovosicT5C15OYsnDaKlW4';
  var STORAGE_KEY = 'amphoe_exec_urls_b2_b7';
  var MAIN_FALLBACK_URL =
    'https://script.google.com/macros/s/AKfycbxvqWwNRKu5GpoVRyDZGdwXRy6ubEgPAg2-stv-G-arF4HRoqkAfP21oTl124ne6CvZ/exec';
  var URL_KEYS = [
    'WEB_APP_URL',
    'CLIPROOM_WEB_APP_URL',
    'LEARNING_SOURCE_WEB_APP_URL',
    'PROFILE_WEB_APP_URL',
    'QUIZ_WEB_APP_URL',
    'CLASSROOM_WEB_APP_URL'
  ];
  var savedUrls = {};

  function isValidWebAppUrl(value) {
    return /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec(?:[?#].*)?$/.test(value);
  }

  function cleanUrl(value) {
    value = String(value || '').trim();
    return isValidWebAppUrl(value) ? value.split(/[?#]/)[0] : '';
  }

  try {
    savedUrls = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch (error) {
    savedUrls = {};
  }

  // รองรับค่าหลัก B2 ที่เคยบันทึกจาก api-config.js รุ่นก่อน
  try {
    if (!savedUrls.WEB_APP_URL) {
      savedUrls.WEB_APP_URL = localStorage.getItem('amphoe_web_app_url_from_exec_b2') || '';
    }
  } catch (error) {
    // ใช้ค่าหลักสำรองด้านล่าง
  }

  URL_KEYS.forEach(function (key) {
    savedUrls[key] = cleanUrl(savedUrls[key]);
  });
  savedUrls.WEB_APP_URL = savedUrls.WEB_APP_URL || MAIN_FALLBACK_URL;
  window.APP_CONFIG = Object.freeze(Object.assign({}, savedUrls));

  window.__setExecUrlsFromSheet = function (response) {
    try {
      var rows = (response && response.table && response.table.rows) || [];
      var nextUrls = Object.assign({}, window.APP_CONFIG);

      URL_KEYS.forEach(function (key, index) {
        var cell = rows[index] && rows[index].c && rows[index].c[0];
        var url = cleanUrl(cell && (cell.v || cell.f));
        if (url) nextUrls[key] = url;
      });

      var changed = URL_KEYS.some(function (key) {
        return nextUrls[key] !== window.APP_CONFIG[key];
      });

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUrls));
      } catch (error) {
        // หากปิด localStorage ระบบยังใช้ค่าของรอบปัจจุบันได้
      }

      window.APP_CONFIG = Object.freeze(nextUrls);

      // สคริปต์เดิมอ่านค่าเมื่อเริ่มหน้า จึงรีโหลดครั้งเดียวเมื่อ URL เปลี่ยน
      if (changed) window.location.reload();
    } catch (error) {
      console.warn('อ่าน URL จาก exec!B2:B7 ไม่สำเร็จ', error);
    }
  };

  var queryUrl =
    'https://docs.google.com/spreadsheets/d/' +
    encodeURIComponent(SPREADSHEET_ID) +
    '/gviz/tq?sheet=exec&range=B2:B7&tqx=out:json;responseHandler:__setExecUrlsFromSheet&_=' +
    Date.now();
  var script = document.createElement('script');
  script.src = queryUrl;
  script.async = true;
  script.onerror = function () {
    console.warn('อ่าน exec!B2:B7 ไม่สำเร็จ ระบบใช้ค่าที่บันทึกล่าสุด');
  };
  document.head.appendChild(script);
})();
