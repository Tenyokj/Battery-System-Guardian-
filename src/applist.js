const psList = require('ps-list').default;

(async () => {
  const list = await psList();

  // Оставляем только приложения с .app в пути
  const apps = list
    .filter(p => p.cmd && p.cmd.includes('.app/Contents/MacOS/'))
    .map(p => p.name.replace(/\.app$/, ''))
    .filter((v, i, a) => a.indexOf(v) === i); // убираем дубликаты

  console.log('🔹 GUI-apps:', apps);
  console.log('🔹 Total GUI applications:', apps.length);
})();
