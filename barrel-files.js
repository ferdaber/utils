const path = require('path')
const fs = require('graceful-fs')

const src = path.resolve('src')

fs.readdir(src, { withFileTypes: true }, (err, ents) => {
  if (err) throw err
  ents
    .filter(ent => ent.isDirectory())
    .forEach(ent => {
      const dir = path.resolve(src, ent.name)
      fs.readdir(dir, { withFileTypes: true }, (err, ents) => {
        if (err) throw err
        const files = ents
          .filter(ent => ent.isFile() && ent.name !== 'index.ts')
          .map(ent => path.basename(ent.name, path.extname(ent.name)))
        fs.writeFile(
          path.resolve(dir, 'index.ts'),
          files.map(filename => `export * from './${filename}'`).join('\n'),
          err => {
            if (err) throw err
          }
        )
      })
    })
})
