const dir = new URL("../../../temporary/", import.meta.url)

export const saveProfileCard = (id: string, markdown: string) =>
  Bun.write(new URL(`${id}.md`, dir), markdown)
