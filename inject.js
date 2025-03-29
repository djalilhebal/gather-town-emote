const files = [
  'js/main.js',
];

files.forEach(f => {
  const s = document.createElement('script');
  s.src = chrome.runtime.getURL(f);
  (document.head || document.documentElement).appendChild(s);;
});
