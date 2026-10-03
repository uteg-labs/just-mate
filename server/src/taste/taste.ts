const root = `${import.meta.dir}/../../taste`
const groups: readonly string[] = ["man", "women"]
const images = new Bun.Glob("*.{jpg,jpeg,png,webp}")

async function imageIn(folder: string) {
  for await (const name of images.scan({ cwd: folder })) return name
}

export async function listTaste() {
  const items: { id: string; group: string; description: string; photo: string }[] = []

  for await (const path of new Bun.Glob("*/*/description.txt").scan({ cwd: root })) {
    const [group = "", n = ""] = path.split(/[\\/]/)
    if (!(await imageIn(`${root}/${group}/${n}`))) continue

    items.push({
      id: `${group}/${n}`,
      group,
      description: (await Bun.file(`${root}/${path}`).text()).trim(),
      photo: `/taste/${group}/${n}/photo`,
    })
  }

  return items.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))
}

export async function tastePhoto(group: string, n: string) {
  if (!groups.includes(group) || !/^\d{1,2}$/.test(n)) return
  const folder = `${root}/${group}/${n}`
  const name = await imageIn(folder)
  return name ? Bun.file(`${folder}/${name}`) : undefined
}
